import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { applyPiEvent, createAgentState } from "./agent";

describe("Pi event state", () => {
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
