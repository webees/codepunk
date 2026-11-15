import { invoke, isTauri } from "@tauri-apps/api/core";

export interface RuntimeInfo {
  readonly appName: string;
  readonly appVersion: string;
  readonly tauriVersion: string;
  readonly platform: string;
  readonly architecture: string;
}

const browserFallback = {
  appName: "Codepunk",
  appVersion: "dev",
  tauriVersion: "browser preview",
  platform: "web",
  architecture: "unknown",
} as const satisfies RuntimeInfo;

export const loadRuntimeInfo = async (): Promise<RuntimeInfo> =>
  isTauri() ? invoke<RuntimeInfo>("runtime_info") : browserFallback;
