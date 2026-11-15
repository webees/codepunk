<script setup lang="ts">
import { computed } from "vue";

import type { RuntimeState } from "../hooks/use-runtime-info";
import StatusPill from "./status-pill.vue";

const props = defineProps<{
  readonly state: RuntimeState;
}>();

const appLabel = computed(() => {
  const info = props.state.info;
  return info ? `${info.appName} v${info.appVersion}` : "";
});

const platformLabel = computed(() => {
  const info = props.state.info;
  return info ? `${info.platform} · ${info.architecture}` : "";
});
</script>

<template>
  <section v-if="state.status === 'loading'" class="card" aria-busy="true" aria-live="polite">
    <h2 class="card__title">Runtime</h2>
    <p class="card__muted">Inspecting the desktop bridge…</p>
  </section>

  <section v-else-if="state.status === 'error' || !state.info" class="card" aria-live="polite">
    <h2 class="card__title">Runtime</h2>
    <StatusPill tone="danger">Bridge unavailable</StatusPill>
    <p class="card__muted" role="alert">{{ state.error ?? "Unknown error" }}</p>
  </section>

  <section v-else class="card" aria-live="polite">
    <header class="card__header">
      <h2 class="card__title">Runtime</h2>
      <StatusPill tone="success">Connected</StatusPill>
    </header>
    <dl class="facts">
      <div class="facts__row">
        <dt>App</dt>
        <dd>{{ appLabel }}</dd>
      </div>
      <div class="facts__row">
        <dt>Tauri</dt>
        <dd>{{ state.info.tauriVersion }}</dd>
      </div>
      <div class="facts__row">
        <dt>Platform</dt>
        <dd>{{ platformLabel }}</dd>
      </div>
    </dl>
  </section>
</template>
