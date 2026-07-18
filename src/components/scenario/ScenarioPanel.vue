<template>
  <aside class="scenario-panel" :class="{ 'scenario-panel--without-footer': !hasFooter }">
    <header v-if="$slots.header" class="scenario-panel__header">
      <slot name="header" />
    </header>
    <div class="scenario-panel__body">
      <slot />
    </div>
    <slot name="footer" />
  </aside>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue';

const slots = useSlots();
const hasFooter = computed(() => Boolean(slots.footer));
</script>

<style lang="scss" scoped>
.scenario-panel {
  display: flex;
  flex: none;
  flex-direction: column;
  width: 320px;
  max-width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: var(--app-sidebar-bg);
  border-right: 1px solid var(--app-border-subtle);
}

.scenario-panel__header {
  flex: none;
}

.scenario-panel__body {
  flex: 1;
  min-height: 0;
  padding: 16px;
  overflow-y: auto;
}

.scenario-panel--without-footer .scenario-panel__body {
  padding-bottom: calc(16px + env(safe-area-inset-bottom));
}
</style>
