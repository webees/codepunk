<script setup lang="ts">
import { shallowRef } from "vue";

import { loadRuntimeInfo, type RuntimeInfo } from "./app/runtime";

const state = shallowRef<RuntimeInfo | Error>();

loadRuntimeInfo().then(
  (info) => (state.value = info),
  (cause: unknown) =>
    (state.value = cause instanceof Error ? cause : new Error(String(cause), { cause })),
);
</script>

<template>
  <header>
    <h1>Codepunk</h1>
    <p>Tauri 2 · Vue 3 · Rsbuild · Rust</p>
  </header>

  <main>
    <section aria-labelledby="runtime-heading">
      <h2 id="runtime-heading">Runtime</h2>
      <p v-if="state instanceof Error" role="alert">{{ state.message }}</p>
      <p v-else-if="!state">Inspecting the desktop bridge…</p>
      <dl v-else>
        <dt>Application</dt>
        <dd>{{ state.appName }} {{ state.appVersion }}</dd>
        <dt>Tauri</dt>
        <dd>{{ state.tauriVersion }}</dd>
        <dt>Platform</dt>
        <dd>{{ state.platform }} ({{ state.architecture }})</dd>
      </dl>
    </section>
  </main>
</template>
