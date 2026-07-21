<template>
  <header class="studio-header">
    <div class="identity">
      <button class="home-button" type="button" :title="$t('poivelle.discovery.back')" @click="$emit('home')">
        <ArrowLeft :size="16" aria-hidden="true" />
      </button>
      <span class="wordmark"><Clapperboard :size="15" aria-hidden="true" /> POIVELLE</span>
      <button class="project-button" type="button" @click="$emit('open-projects')">
        <span>{{ projectTitle || $t('poivelle.project.noProject') }}</span>
        <ChevronDown :size="14" aria-hidden="true" />
      </button>
      <span v-if="graphVersion !== undefined" class="version">Graph v{{ graphVersion }}</span>
    </div>
    <div class="actions">
      <span class="sync-state">
        <span class="sync-dot" />
        {{ $t('poivelle.status.synced') }}
      </span>
      <button
        v-if="canEdit"
        class="icon-button"
        type="button"
        :title="$t('poivelle.action.commit')"
        @click="$emit('commit')"
      >
        <GitCommitHorizontal :size="17" aria-hidden="true" />
      </button>
      <button class="primary-button" type="button" :disabled="!canRun" @click="$emit('run')">
        <Play :size="15" fill="currentColor" aria-hidden="true" />
        {{ $t('poivelle.action.runSkill') }}
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ArrowLeft, ChevronDown, Clapperboard, GitCommitHorizontal, Play } from '@lucide/vue';

defineProps<{
  projectTitle?: string;
  graphVersion?: number;
  canRun: boolean;
  canEdit: boolean;
}>();

defineEmits<{
  'open-projects': [];
  home: [];
  commit: [];
  run: [];
}>();
</script>

<style scoped>
.studio-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 60px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--poivelle-line);
  background: var(--poivelle-paper);
  box-shadow: var(--app-shadow-xs);
  z-index: 2;
}

.identity,
.actions,
.project-button,
.primary-button,
.sync-state {
  display: flex;
  align-items: center;
}

.identity {
  min-width: 0;
  gap: 12px;
}

.actions {
  gap: 8px;
}

.wordmark {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--app-brand-hex);
  font-size: 12px;
  font-weight: 750;
  letter-spacing: 0.08em;
}

.project-button,
.home-button,
.icon-button,
.primary-button {
  border: 1px solid var(--poivelle-line-strong);
  border-radius: var(--poivelle-radius-small);
  color: var(--poivelle-ink);
  background: transparent;
  cursor: pointer;
}

.project-button {
  min-width: 0;
  max-width: 280px;
  height: 36px;
  gap: 7px;
  padding: 0 10px;
  font: inherit;
  font-size: 13px;
  font-weight: 650;
  background: var(--poivelle-canvas);
}
.home-button {
  display: grid;
  width: 34px;
  height: 36px;
  place-items: center;
  padding: 0;
  border: 1px solid var(--poivelle-line-strong);
  border-radius: var(--poivelle-radius-small);
  color: var(--poivelle-muted);
  background: transparent;
  cursor: pointer;
}

.project-button span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.version,
.sync-state {
  color: var(--poivelle-muted);
  font-size: 11px;
}

.sync-state {
  gap: 6px;
  margin-right: 4px;
}

.sync-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--el-color-success);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-success) 14%, transparent);
}

.icon-button {
  display: grid;
  place-items: center;
  width: 34px;
  height: 36px;
  padding: 0;
}

.primary-button {
  height: 36px;
  gap: 7px;
  padding: 0 13px;
  border-color: var(--app-brand-hex);
  color: #fff;
  background: var(--app-brand-hex);
  box-shadow: var(--app-shadow-sm);
  font: inherit;
  font-size: 12px;
  font-weight: 700;
}

.primary-button:disabled {
  cursor: not-allowed;
  opacity: 0.42;
}

.project-button:hover,
.home-button:hover,
.icon-button:hover {
  border-color: var(--app-brand-hex);
  color: var(--app-brand-hex);
  background: var(--poivelle-hover);
}

.primary-button:not(:disabled):hover {
  background: var(--app-brand-hex-dark-2);
  box-shadow: var(--app-glow-primary);
}

.project-button:focus-visible,
.home-button:focus-visible,
.icon-button:focus-visible,
.primary-button:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--app-brand-hex) 38%, transparent);
  outline-offset: 2px;
}

@media (max-width: 767px) {
  .studio-header {
    min-height: 54px;
    padding: 7px 10px;
  }

  .wordmark,
  .sync-state,
  .version,
  .icon-button {
    display: none;
  }

  .project-button {
    max-width: 180px;
  }

  .primary-button {
    padding: 0 10px;
  }
}
</style>
