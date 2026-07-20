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
  min-height: 58px;
  padding: 8px 12px;
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
  font-family: 'Courier New', monospace;
  font-size: 8px;
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
  background: #9d9d92;
}

.risk-high,
.risk-critical {
  background: var(--poivelle-red);
}

.risk-medium {
  background: #bd8b2f;
}

.agent-button {
  height: 34px;
  gap: 7px;
  padding: 0 12px;
  border: 1px solid var(--poivelle-ink);
  color: var(--poivelle-ink);
  background: var(--poivelle-mint);
  font: inherit;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
}

.agent-button:disabled {
  opacity: 0.42;
  cursor: not-allowed;
}

@media (max-width: 767px) {
  .agent-dock {
    grid-template-columns: minmax(0, 1fr) auto;
    min-height: 52px;
    padding: 7px 9px;
  }

  .agent-identity {
    display: none;
  }
}
</style>
