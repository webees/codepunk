import { invoke } from "@tauri-apps/api/core";

export interface RuntimeInfo {
  readonly appName: string;
  readonly appVersion: string;
  readonly tauriVersion: string;
  readonly platform: string;
  readonly architecture: string;
}

function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

/**
 * Reads runtime details from the Rust side when running inside Tauri, and falls
 * back to browser-safe values so the UI stays testable outside the desktop shell.
 */
export async function loadRuntimeInfo(): Promise<RuntimeInfo> {
  if (!isTauriRuntime()) {
    return {
      appName: "Codepunk",
      appVersion: "dev",
      tauriVersion: "browser preview",
      platform: "web",
      architecture: "unknown",
    };
  }

  return invoke<RuntimeInfo>("runtime_info");
}
