<script setup lang="ts">
defineProps<{
  readonly tone: "neutral" | "success" | "danger";
}>();
</script>

<template>
  <span :class="['pill', `pill--${tone}`]"><slot /></span>
</template>
