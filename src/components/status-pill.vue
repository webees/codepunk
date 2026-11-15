<script setup lang="ts">
defineProps<{
  readonly tone: "success" | "danger";
}>();
</script>

<template>
  <span :class="['pill', `pill--${tone}`]"><slot /></span>
</template>
