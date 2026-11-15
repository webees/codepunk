import { invoke, isTauri } from "@tauri-apps/api/core";

import { APP_NAME } from "./config";

export interface RuntimeInfo {
  readonly appName: string;
  readonly appVersion: string;
  readonly tauriVersion: string;
  readonly platform: string;
  readonly architecture: string;
}

/**
 * Reads runtime details from the Rust side when running inside Tauri, and falls
 * back to browser-safe values so the UI stays testable outside the desktop shell.
 */
export async function loadRuntimeInfo(): Promise<RuntimeInfo> {
  if (!isTauri()) {
    return {
      appName: APP_NAME,
      appVersion: "dev",
      tauriVersion: "browser preview",
      platform: "web",
      architecture: "unknown",
    };
  }

  return invoke<RuntimeInfo>("runtime_info");
}
