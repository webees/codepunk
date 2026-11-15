<script setup lang="ts">
import { openUrl } from "@tauri-apps/plugin-opener";
import { ref } from "vue";

defineOptions({ inheritAttrs: false });

const props = defineProps<{
  readonly href: string;
}>();

const failure = ref<string | null>(null);

function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

async function openExternal(): Promise<void> {
  if (!isTauriRuntime()) {
    window.open(props.href, "_blank", "noopener,noreferrer");
    return;
  }

  try {
    await openUrl(props.href);
  } catch (cause) {
    failure.value = cause instanceof Error ? cause.message : String(cause);
  }
}

function handleClick(event: MouseEvent): void {
  event.preventDefault();
  void openExternal();
}
</script>

<template>
  <a v-bind="$attrs" :href="href" rel="noreferrer noopener" target="_blank" @click="handleClick">
    <slot />
  </a>
  <span v-if="failure" role="alert" class="inline-error"> Unable to open link: {{ failure }} </span>
</template>
