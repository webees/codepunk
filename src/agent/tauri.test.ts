import { describe, mock, test } from "bun:test";
import assert from "node:assert/strict";

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

describe("Tauri transport", () => {
  test("maps commands and forwards raw events", async () => {
    const { createTauriAgent, tauriTransport } = await import("./tauri");
    const events: unknown[] = [];

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
    assert.deepEqual(events, ["{broken", '{"type":"agent_start"}']);
    assert.equal(createTauriAgent().state.busy, false);
  });
});
