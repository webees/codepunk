import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

import { type Agent, type AgentTransport, createAgent } from "./core";

export const tauriTransport: AgentTransport = {
  start: (cwd) => invoke<void>("pi_start", { cwd }),
  send: (command) => invoke<void>("pi_rpc", { command }),
  stop: () => invoke<void>("pi_stop"),
  subscribe: (handler) => listen<string>("pi://event", ({ payload }) => handler(payload)),
};

export const createTauriAgent = (): Agent => createAgent(tauriTransport);
