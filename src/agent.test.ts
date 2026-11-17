import { describe, mock, test } from "bun:test";
import assert from "node:assert/strict";

import {
  type AgentTransport,
  applyPiEvent,
  createAgent,
  createAgentState,
  type PiCommand,
  type PiEvent,
} from "./agent/core";

const invokes: [string, unknown][] = [];
const listeners: ((event: { payload: string }) => void)[] = [];

mock.module("@tauri-apps/api/core", () => ({
  invoke: async (command: string, args?: unknown) => {
    invokes.push([command, args]);
  },
}));

mock.module("@tauri-apps/api/event", () => ({
  listen: async (_event: string, handler: (event: { payload: string }) => void) => {
    listeners.push(handler);
    return () => {};
  },
}));

const fixture = () => {
  const commands: PiCommand[] = [];
  let listener: ((event: PiEvent) => void) | undefined;
  let cwd = "";
  let stopped = false;
  const transport: AgentTransport = {
    start: async (value) => {
      cwd = value;
    },
    send: async (command) => {
      commands.push(command);
    },
    stop: async () => {
      stopped = true;
    },
    subscribe: async (handler) => {
      listener = handler;
      return () => {
        listener = undefined;
      };
    },
  };
  return {
    transport,
    commands,
    cwd: () => cwd,
    stopped: () => stopped,
    emit: (event: PiEvent) => {
      listener?.(event);
    },
  };
};

describe("Agent runtime", () => {
  test("drives the transport and reduces events", async () => {
    const fake = fixture();
    const agent = createAgent(fake.transport);
    let changes = 0;
    agent.subscribe(() => {
      changes += 1;
    });

    await agent.start("/workspace");
    await agent.prompt("hello");
    await agent.steer("focus");
    await agent.followUp("continue");
    await agent.abort();
    await agent.refresh();
    fake.emit({ type: "agent_start" });
    assert.equal(agent.state.busy, true);
    fake.emit({ type: "agent_settled" });
    assert.equal(agent.state.busy, false);
    await agent.stop();

    assert.equal(fake.cwd(), "/workspace");
    assert.equal(fake.stopped(), true);
    assert.deepEqual(fake.commands, [
      { type: "prompt", message: "hello" },
      { type: "steer", message: "focus" },
      { type: "follow_up", message: "continue" },
      { type: "abort" },
      { type: "get_state" },
    ]);
    assert.ok(changes > 0);
  });

  test("surfaces transport failures", async () => {
    const fake = fixture();
    fake.transport.start = async () => {
      throw new Error("offline");
    };
    const agent = createAgent(fake.transport);

    await agent.start("/workspace");

    assert.equal(agent.state.error, "offline");
    assert.equal(agent.state.busy, false);
  });

  test("stops cleanly", async () => {
    const fake = fixture();
    const agent = createAgent(fake.transport);
    await agent.start("/workspace");
    fake.emit({ type: "agent_start" });

    await agent.stop();

    assert.equal(agent.state.busy, false);
    assert.equal(fake.stopped(), true);
  });
});

describe("Pi event state", () => {
  test("tracks agent activity until settled", () => {
    const state = createAgentState();

    applyPiEvent(state, "{broken");
    applyPiEvent(state, { type: "agent_start" });
    assert.equal(state.busy, true);
    applyPiEvent(state, { type: "agent_settled" });
    assert.equal(state.busy, false);
  });

  test("assembles streamed assistant text", () => {
    const state = createAgentState();

    applyPiEvent(
      state,
      JSON.stringify({ type: "message_start", message: { role: "assistant", content: [] } }),
    );
    applyPiEvent(state, {
      type: "message_update",
      assistantMessageEvent: { type: "text_delta", delta: "Hello " },
    });
    applyPiEvent(state, {
      type: "message_update",
      assistantMessageEvent: { type: "text_delta", delta: "world" },
    });

    assert.equal(state.messages.at(-1)?.text, "Hello world");
  });

  test("replaces streamed text with the final message", () => {
    const state = createAgentState();

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
  });

  test("drops an empty assistant placeholder", () => {
    const state = createAgentState();

    applyPiEvent(state, {
      type: "message_start",
      message: { role: "assistant", content: [] },
    });
    applyPiEvent(state, {
      type: "message_end",
      message: { role: "assistant", content: [] },
    });

    assert.equal(state.messages.length, 0);
  });

  test("tracks tool activity and failures", () => {
    const state = createAgentState();

    applyPiEvent(state, { type: "tool_execution_start", toolName: "read" });
    applyPiEvent(state, { type: "tool_execution_end", toolName: "read", isError: false });
    applyPiEvent(state, { type: "response", success: false, error: "offline" });

    assert.deepEqual(state.tools, ["read 执行中", "read 完成"]);
    assert.equal(state.error, "offline");
    assert.equal(state.busy, false);
  });
});

describe("Tauri transport", () => {
  test("maps commands and filters invalid events", async () => {
    const { tauriTransport } = await import("./agent/tauri");
    const events: PiEvent[] = [];

    await tauriTransport.start("/workspace");
    await tauriTransport.send({ type: "prompt", message: "hi" });
    await tauriTransport.stop();
    await tauriTransport.subscribe((event) => {
      events.push(event);
    });

    assert.deepEqual(invokes, [
      ["pi_start", { cwd: "/workspace" }],
      ["pi_rpc", { command: { type: "prompt", message: "hi" } }],
      ["pi_stop", undefined],
    ]);

    listeners[0]?.({ payload: "{broken" });
    listeners[0]?.({ payload: '{"type":"agent_start"}' });
    assert.deepEqual(events, [{ type: "agent_start" }]);
  });
});
