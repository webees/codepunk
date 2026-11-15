<script setup lang="ts">
import type { RuntimeState } from "../hooks/use-runtime-info";

defineProps<{
  readonly state: RuntimeState;
}>();
</script>

<template>
  <section v-if="state.status === 'loading'" class="card" aria-busy="true" aria-live="polite">
    <h2 class="card__title">Runtime</h2>
    <p class="card__muted">Inspecting the desktop bridge…</p>
  </section>

  <section v-else-if="state.status === 'error' || !state.info" class="card" aria-live="polite">
    <h2 class="card__title">Runtime</h2>
    <span class="pill pill--danger">Bridge unavailable</span>
    <p class="card__muted" role="alert">{{ state.error ?? "Unknown error" }}</p>
  </section>

  <section v-else class="card" aria-live="polite">
    <header class="card__header">
      <h2 class="card__title">Runtime</h2>
      <span class="pill pill--success">Connected</span>
    </header>
    <dl class="facts">
      <div class="facts__row">
        <dt>App</dt>
        <dd>{{ state.info.appName }} v{{ state.info.appVersion }}</dd>
      </div>
      <div class="facts__row">
        <dt>Tauri</dt>
        <dd>{{ state.info.tauriVersion }}</dd>
      </div>
      <div class="facts__row">
        <dt>Platform</dt>
        <dd>{{ state.info.platform }} · {{ state.info.architecture }}</dd>
      </div>
    </dl>
  </section>
</template>
