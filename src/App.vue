<script setup lang="ts">
import { invoke, isTauri } from "@tauri-apps/api/core";
import { shallowRef } from "vue";

interface RuntimeInfo {
  readonly appVersion: string;
  readonly tauriVersion: string;
  readonly platform: string;
  readonly architecture: string;
}

const browserFallback: RuntimeInfo = {
  appVersion: "dev",
  tauriVersion: "browser preview",
  platform: "web",
  architecture: "unknown",
};

const state = shallowRef<RuntimeInfo | Error>();

(isTauri() ? invoke<RuntimeInfo>("runtime_info") : Promise.resolve(browserFallback)).then(
  (info) => (state.value = info),
  (cause: unknown) =>
    (state.value = cause instanceof Error ? cause : new Error(String(cause), { cause })),
);
</script>

<template>
  <main>
    <h1>Codepunk</h1>
    <h2>Runtime</h2>
    <p v-if="state instanceof Error" role="alert">{{ state.message }}</p>
    <p v-else-if="!state">Inspecting the desktop bridge…</p>
    <dl v-else>
      <dt>Version</dt>
      <dd>{{ state.appVersion }}</dd>
      <dt>Tauri</dt>
      <dd>{{ state.tauriVersion }}</dd>
      <dt>Platform</dt>
      <dd>{{ state.platform }} ({{ state.architecture }})</dd>
    </dl>
  </main>
</template>
