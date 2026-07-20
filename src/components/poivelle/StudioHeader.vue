<template>
  <header class="studio-header">
    <div class="identity">
      <span class="wordmark">POIVELLE</span>
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
import { ChevronDown, GitCommitHorizontal, Play } from '@lucide/vue';

defineProps<{
  projectTitle?: string;
  graphVersion?: number;
  canRun: boolean;
  canEdit: boolean;
}>();

defineEmits<{
  'open-projects': [];
  commit: [];
  run: [];
}>();
</script>

<style scoped>
.studio-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 58px;
  padding: 8px 14px 8px 18px;
  border-bottom: 1px solid var(--poivelle-line);
  background: var(--poivelle-paper);
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
  color: var(--poivelle-red);
  font-family: 'Courier New', monospace;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.16em;
}

.project-button,
.icon-button,
.primary-button {
  border: 1px solid var(--poivelle-line-strong);
  color: var(--poivelle-ink);
  background: transparent;
  cursor: pointer;
}

.project-button {
  min-width: 0;
  max-width: 280px;
  height: 34px;
  gap: 7px;
  padding: 0 10px;
  font: inherit;
  font-size: 13px;
  font-weight: 650;
}

.project-button span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.version,
.sync-state {
  color: var(--poivelle-muted);
  font-family: 'Courier New', monospace;
  font-size: 10px;
}

.sync-state {
  gap: 6px;
  margin-right: 4px;
}

.sync-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--poivelle-green);
}

.icon-button {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  padding: 0;
}

.primary-button {
  height: 34px;
  gap: 7px;
  padding: 0 13px;
  border-color: var(--poivelle-ink);
  color: var(--poivelle-paper);
  background: var(--poivelle-ink);
  font: inherit;
  font-size: 12px;
  font-weight: 700;
}

.primary-button:disabled {
  cursor: not-allowed;
  opacity: 0.42;
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
