import { describe, test } from "bun:test";
import assert from "node:assert/strict";

import {
  type AgentTransport,
  applyPiEvent,
  createAgent,
  createAgentState,
  type PiCommand,
  type PiEvent,
} from "./core";

const transport = () => {
  const commands: PiCommand[] = [];
  let handler: ((event: PiEvent) => void) | undefined;
  let started = false;
  let stopped = false;
  const value: AgentTransport = {
    start: async () => {
      started = true;
    },
    send: async (command) => {
      commands.push(command);
    },
    stop: async () => {
      stopped = true;
    },
    subscribe: async (next) => {
      handler = next;
      return () => {
        handler = undefined;
      };
    },
  };
  return {
    value,
    commands,
    started: () => started,
    stopped: () => stopped,
    emit: (event: PiEvent) => handler?.(event),
  };
};

describe("Agent runtime", () => {
  test("drives the transport and notifies subscribers", async () => {
    const fake = transport();
    const agent = createAgent(fake.value);
    let changes = 0;
    const unsubscribe = agent.subscribe(() => {
      changes += 1;
    });

    await agent.start("/workspace");
    fake.emit({ type: "agent_start" });
    assert.equal(agent.state.busy, true);
    await agent.prompt("hello");
    await agent.steer("focus");
    await agent.followUp("continue");
    await agent.abort();
    await agent.refresh();
    await agent.stop();

    assert.deepEqual(fake.commands, [
      { type: "prompt", message: "hello" },
      { type: "steer", message: "focus" },
      { type: "follow_up", message: "continue" },
      { type: "abort" },
      { type: "get_state" },
    ]);
    assert.equal(fake.started(), true);
    assert.equal(fake.stopped(), true);
    assert.equal(agent.state.busy, false);
    assert.ok(changes > 0);

    const before = changes;
    unsubscribe();
    fake.emit({ type: "agent_start" });
    assert.equal(changes, before);
  });

  test("captures transport failures", async () => {
    const fake = transport();
    const agent = createAgent(fake.value);
    fake.value.start = async () => {
      throw new Error("offline");
    };
    await agent.start("/workspace");
    assert.equal(agent.state.error, "offline");

    fake.value.send = () => Promise.reject("broken");
    await agent.prompt("hello");
    assert.equal(agent.state.error, "broken");
  });
});

describe("Pi events", () => {
  test("reduces activity, messages, tools and failures", () => {
    const state = createAgentState();
    applyPiEvent(state, { type: "agent_start" });
    assert.equal(state.busy, true);

    applyPiEvent(state, {
      type: "message_start",
      message: { role: "assistant", content: [] },
    });
    applyPiEvent(state, {
      type: "message_update",
      assistantMessageEvent: { type: "text_delta", delta: "draft" },
    });
    applyPiEvent(state, {
      type: "message_end",
      message: { role: "assistant", content: [{ type: "text", text: "final" }] },
    });
    assert.equal(state.messages.at(-1)?.text, "final");

    applyPiEvent(state, { type: "tool_execution_start", toolName: "read" });
    applyPiEvent(state, { type: "tool_execution_end", toolName: "read" });
    applyPiEvent(state, { type: "tool_execution_start", toolName: "write" });
    applyPiEvent(state, { type: "tool_execution_end", toolName: "write", isError: true });
    assert.deepEqual(state.tools, ["read 执行中", "read 完成", "write 执行中", "write 失败"]);

    applyPiEvent(state, { type: "response", success: false, error: "offline" });
    assert.equal(state.error, "offline");
    applyPiEvent(state, { type: "response", success: false });
    assert.equal(state.error, "Pi 请求失败");
    applyPiEvent(state, { type: "error", message: "bad" });
    assert.equal(state.error, "bad");
    applyPiEvent(state, { type: "error" });
    assert.equal(state.error, "Pi 错误");
    applyPiEvent(state, { type: "unknown" });
    applyPiEvent(state, { type: "agent_settled" });
    assert.equal(state.busy, false);
    applyPiEvent(state, { type: "agent_start" });
    applyPiEvent(state, { type: "exit" });
    assert.equal(state.busy, false);
  });

  test("handles malformed and edge-case messages", () => {
    const state = createAgentState();
    applyPiEvent(state, "{broken");
    applyPiEvent(state, 42);
    assert.equal(state.messages.length, 0);

    applyPiEvent(state, { type: "message_start", message: { role: "assistant" } });
    applyPiEvent(state, { type: "message_end", message: { role: "assistant", content: [] } });
    assert.equal(state.messages.length, 0);

    applyPiEvent(state, { type: "message_start", message: { role: "assistant" } });
    applyPiEvent(state, {
      type: "message_end",
      message: { role: "assistant", content: "plain" },
    });
    assert.equal(state.messages.at(-1)?.text, "plain");

    applyPiEvent(state, { type: "message_start", message: { role: "user" } });
    applyPiEvent(state, {
      type: "message_update",
      assistantMessageEvent: { type: "other", delta: "ignored" },
    });
    applyPiEvent(state, { type: "tool_execution_start" });
    applyPiEvent(state, { type: "tool_execution_end" });
    assert.equal(state.messages.length, 1);
  });
});
