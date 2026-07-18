<template>
  <footer class="scenario-footer">
    <div v-if="$slots.meta" class="scenario-footer__meta">
      <slot name="meta" />
    </div>
    <slot />
  </footer>
</template>

<style lang="scss" scoped>
.scenario-footer {
  position: sticky;
  bottom: 0;
  z-index: 1;
  flex: none;
  padding: 8px 16px calc(16px + env(safe-area-inset-bottom));
  background: var(--app-sidebar-bg);
  border-top: 1px solid var(--app-border-subtle);
}

.scenario-footer__meta {
  margin-bottom: 8px;
}
</style>
