<template>
  <section class="agent-dock">
    <div class="agent-identity">
      <Bot :size="16" aria-hidden="true" />
      <div>
        <strong>{{ $t('poivelle.agent.title') }}</strong>
        <span>{{ skill }}</span>
      </div>
    </div>
    <div class="proposal-strip">
      <button
        v-for="proposal in pendingProposals"
        :key="proposal.id"
        type="button"
        @click="$emit('open-proposal', proposal.id)"
      >
        <span :class="['risk-dot', `risk-${proposal.risk_class}`]" />
        <strong>{{ proposal.intent }}</strong>
        <small>{{ proposal.state }}</small>
      </button>
      <p v-if="!pendingProposals.length">{{ $t('poivelle.agent.noProposals') }}</p>
    </div>
    <button v-if="canEdit" class="agent-button" type="button" :disabled="!selectedNodeId" @click="$emit('run')">
      <Sparkles :size="15" aria-hidden="true" />
      {{ $t('poivelle.agent.plan') }}
    </button>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Bot, Sparkles } from '@lucide/vue';
import type { IPoivelleProposal } from '@/models';

const props = defineProps<{
  proposals: IPoivelleProposal[];
  selectedNodeId?: string;
  skill: string;
  canEdit: boolean;
}>();
defineEmits<{
  run: [];
  'open-proposal': [proposalId: string];
}>();
const pendingProposals = computed(() => props.proposals.filter((proposal) => proposal.state === 'awaiting_approval'));
</script>

<style scoped>
.agent-dock {
  display: grid;
  grid-template-columns: 190px minmax(0, 1fr) auto;
  align-items: center;
  min-height: 64px;
  padding: 10px 14px;
  border-top: 1px solid var(--poivelle-line-strong);
  background: var(--poivelle-paper);
}

.agent-identity,
.agent-identity div,
.proposal-strip,
.proposal-strip button,
.agent-button {
  display: flex;
  align-items: center;
}

.agent-identity {
  gap: 9px;
}

.agent-identity div {
  align-items: flex-start;
  flex-direction: column;
}

.agent-identity strong {
  font-size: 11px;
}

.agent-identity span {
  color: var(--poivelle-muted);
  font-size: 9px;
}

.proposal-strip {
  gap: 6px;
  min-width: 0;
  overflow-x: auto;
}

.proposal-strip button {
  flex: none;
  max-width: 240px;
  height: 34px;
  gap: 7px;
  padding: 0 9px;
  border: 1px solid var(--poivelle-line);
  border-radius: var(--poivelle-radius-small);
  color: var(--poivelle-ink);
  background: var(--poivelle-canvas);
  font: inherit;
  cursor: pointer;
}

.proposal-strip button strong {
  overflow: hidden;
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.proposal-strip button small {
  color: var(--poivelle-muted);
  font-size: 8px;
}

.proposal-strip p {
  margin: 0;
  color: var(--poivelle-muted);
  font-size: 10px;
}

.risk-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--el-text-color-placeholder);
}

.risk-high,
.risk-critical {
  background: var(--poivelle-red);
}

.risk-medium {
  background: var(--el-color-warning);
}

.agent-button {
  height: 34px;
  gap: 7px;
  padding: 0 12px;
  border: 1px solid var(--app-brand-hex);
  border-radius: var(--poivelle-radius-small);
  color: var(--app-brand-hex-dark-2);
  background: var(--poivelle-hover);
  font: inherit;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
}

.agent-button:not(:disabled):hover {
  color: #fff;
  background: var(--app-brand-hex);
}

.proposal-strip button:focus-visible,
.agent-button:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--app-brand-hex) 38%, transparent);
  outline-offset: 2px;
}

.agent-button:disabled {
  opacity: 0.42;
  cursor: not-allowed;
}

@media (max-width: 767px) {
  .agent-dock {
    grid-template-columns: minmax(0, 1fr) auto;
    min-height: 50px;
    padding: 6px 10px calc(6px + var(--app-safe-area-bottom));
    background: color-mix(in srgb, var(--poivelle-paper) 92%, transparent);
    backdrop-filter: blur(12px);
  }

  .agent-identity {
    display: none;
  }

  .proposal-strip p {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .agent-button {
    height: 32px;
    padding: 0 10px;
  }
}
</style>
