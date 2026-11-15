<script setup lang="ts">
import { APP_NAME, APP_VERSION, externalLinks, REPOSITORY_URL } from "./app/config";
import ExternalLink from "./components/external-link.vue";
import RuntimeCard from "./components/runtime-card.vue";
import { useRuntimeInfo } from "./hooks/use-runtime-info";

const runtime = useRuntimeInfo();
</script>

<template>
  <div class="shell">
    <header class="hero">
      <p class="eyebrow">Tauri 2 · Vue 3 · Rust</p>
      <h1 class="hero__title">
        {{ APP_NAME }}
        <span class="hero__version">v{{ APP_VERSION }}</span>
      </h1>
      <p class="hero__lede">
        A small, honest desktop foundation: strict TypeScript, a hardened Rust core, and a build
        pipeline that bundles installers on every platform.
      </p>
      <div class="hero__actions">
        <a class="button button--primary" :href="REPOSITORY_URL" rel="noreferrer noopener">
          Source
        </a>
        <ExternalLink class="button" href="https://tauri.app/start/"> Read the docs </ExternalLink>
      </div>
    </header>

    <main class="grid">
      <RuntimeCard :state="runtime" />

      <section class="card">
        <h2 class="card__title">Next steps</h2>
        <ol class="steps">
          <li>Run <code>pnpm tauri dev</code> for the desktop shell.</li>
          <li>Add commands in <code>src-tauri/src</code> and type them once.</li>
          <li>Tag a release; CI builds macOS, Linux and Windows artifacts.</li>
        </ol>
      </section>

      <section class="card">
        <h2 class="card__title">Stack</h2>
        <ul class="chips">
          <li v-for="link in externalLinks" :key="link.href">
            <ExternalLink class="chip" :href="link.href">{{ link.label }}</ExternalLink>
          </li>
        </ul>
      </section>
    </main>

    <footer class="footer">
      <span>MIT licensed · Built in the open</span>
      <ExternalLink :href="`${REPOSITORY_URL}/blob/main/CONTRIBUTING.md`">
        Contributing
      </ExternalLink>
    </footer>
  </div>
</template>
