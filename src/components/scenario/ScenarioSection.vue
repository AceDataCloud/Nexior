<template>
  <section class="scenario-section" :aria-labelledby="title ? titleId : undefined">
    <h2 v-if="title" :id="titleId" class="scenario-section__title">{{ title }}</h2>
    <slot />
  </section>
</template>

<script setup lang="ts">
import { useId } from 'vue';

defineProps<{
  title?: string;
}>();

const titleId = `scenario-section-${useId()}`;
</script>

<style lang="scss" scoped>
.scenario-section + .scenario-section {
  margin-top: 24px;
}

.scenario-section__title {
  margin: 0 0 12px;
  color: var(--el-text-color-primary);
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
}
</style>
