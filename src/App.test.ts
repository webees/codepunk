import assert from "node:assert/strict";
import { test } from "node:test";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import App, { applyPiEvent, createState } from "./App";

test("renders the app shell", async () => {
  assert.match(await renderToString(createSSRApp(App)), /<h1>CodePunk<\/h1>/);
});

test("streams assistant text and settles", () => {
  const state = createState();
  state.busy = true;
  applyPiEvent(state, { type: "agent_start" });
  applyPiEvent(state, { type: "message_start", message: { role: "assistant" } });
  applyPiEvent(state, {
    type: "message_update",
    assistantMessageEvent: { type: "text_delta", delta: "Hello" },
  });
  applyPiEvent(state, {
    type: "message_update",
    assistantMessageEvent: { type: "text_delta", delta: " CodePunk" },
  });
  applyPiEvent(state, { type: "agent_settled" });

  assert.equal(state.messages.at(-1)?.text, "Hello CodePunk");
  assert.equal(state.busy, false);
});

test("replaces streamed text with the final message", () => {
  const state = createState();
  state.messages.push({ role: "assistant", text: "partial" });
  applyPiEvent(state, {
    type: "message_end",
    message: { role: "assistant", content: [{ type: "text", text: "final" }] },
  });
  assert.equal(state.messages.at(-1)?.text, "final");
});

test("shows Pi failures", () => {
  const state = createState();
  state.busy = true;
  applyPiEvent(state, { type: "response", success: false, error: "No API key" });
  assert.equal(state.busy, false);
  assert.equal(state.error, "No API key");
});

test("tracks tool activity", () => {
  const state = createState();
  applyPiEvent(state, { type: "tool_execution_start", toolName: "read" });
  applyPiEvent(state, { type: "tool_execution_end", toolName: "read" });
  assert.deepEqual(state.tools, ["read 执行中", "read 完成"]);
});
