<template>
  <div class="review-view">
    <section class="review-summary">
      <div>
        <span class="eyebrow">{{ $t('poivelle.review.heading') }}</span>
        <h2>{{ revisions.length ? `Revision ${revisions[0].revision_number}` : $t('poivelle.review.noRevision') }}</h2>
      </div>
      <div class="summary-metrics">
        <span
          ><strong>{{ graph.nodes.length }}</strong
          >{{ $t('poivelle.review.nodes') }}</span
        >
        <span
          ><strong>{{ proposals.length }}</strong
          >{{ $t('poivelle.review.proposals') }}</span
        >
        <span
          ><strong>{{ runs.length }}</strong
          >{{ $t('poivelle.review.runs') }}</span
        >
      </div>
    </section>
    <section class="review-columns">
      <div>
        <h3>{{ $t('poivelle.review.pendingProposals') }}</h3>
        <article v-for="proposal in pendingProposals" :key="proposal.id" class="review-item">
          <span :class="['risk', `risk-${proposal.risk_class}`]">{{ proposal.risk_class }}</span>
          <strong>{{ proposal.intent }}</strong>
          <p>{{ proposal.rationale }}</p>
          <div v-if="canEdit" class="item-actions">
            <span>{{ $t('poivelle.review.approvalTokenRequired') }}</span>
            <button type="button" @click="$emit('reject-proposal', proposal.id)">
              {{ $t('poivelle.review.reject') }}
            </button>
          </div>
        </article>
        <p v-if="!pendingProposals.length" class="empty-copy">{{ $t('poivelle.review.noProposals') }}</p>
      </div>
      <div>
        <h3>{{ $t('poivelle.review.execution') }}</h3>
        <article v-for="run in runs" :key="run.id" class="run-item">
          <span :class="['run-state', `state-${run.state}`]" />
          <div>
            <strong>{{ run.state }}</strong>
            <small>{{ run.id }}</small>
          </div>
          <button
            v-if="canEdit && cancellable(run)"
            type="button"
            class="cancel-run"
            @click="$emit('cancel-run', run.id)"
          >
            {{ $t('poivelle.run.cancel') }}
          </button>
        </article>
        <p v-if="!runs.length" class="empty-copy">{{ $t('poivelle.review.noRuns') }}</p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { IPoivelleGraphSnapshot, IPoivelleProposal, IPoivelleRevision, IPoivelleRun } from '@/models';

const props = defineProps<{
  graph: IPoivelleGraphSnapshot;
  proposals: IPoivelleProposal[];
  revisions: IPoivelleRevision[];
  runs: IPoivelleRun[];
  canEdit: boolean;
}>();
defineEmits<{
  'reject-proposal': [proposalId: string];
  'cancel-run': [runId: string];
}>();
const pendingProposals = computed(() => props.proposals.filter((proposal) => proposal.state === 'awaiting_approval'));
const cancellable = (run: IPoivelleRun) => !['release_pending', 'succeeded', 'failed', 'cancelled'].includes(run.state);
</script>

<style scoped>
.review-view {
  height: 100%;
  padding: 20px;
  overflow: auto;
  background: var(--poivelle-canvas);
}

.review-summary,
.review-columns,
.summary-metrics,
.run-item {
  display: flex;
}

.review-summary {
  align-items: flex-end;
  justify-content: space-between;
  padding: 18px;
  border: 1px solid var(--poivelle-line-strong);
  background: var(--poivelle-paper);
}

.eyebrow,
.review-columns h3 {
  color: var(--poivelle-red);
  font-family: 'Courier New', monospace;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.review-summary h2 {
  margin: 5px 0 0;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 24px;
}

.summary-metrics {
  gap: 22px;
}

.summary-metrics span {
  display: grid;
  color: var(--poivelle-muted);
  font-size: 9px;
  text-transform: uppercase;
}

.summary-metrics strong {
  color: var(--poivelle-ink);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 20px;
}

.review-columns {
  gap: 18px;
  margin-top: 18px;
}

.review-columns > div {
  flex: 1;
  min-width: 0;
}

.review-columns h3 {
  margin: 0 0 9px;
}

.review-item,
.run-item {
  margin-bottom: 8px;
  padding: 12px;
  border: 1px solid var(--poivelle-line);
  background: var(--poivelle-paper);
}

.review-item strong {
  display: block;
  margin: 6px 0 4px;
  font-size: 12px;
}

.review-item p {
  margin: 0;
  color: var(--poivelle-muted);
  font-size: 10px;
  line-height: 1.45;
}

.item-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 10px;
  padding-top: 9px;
  border-top: 1px solid var(--poivelle-line);
}

.item-actions span {
  color: var(--poivelle-muted);
  font-size: 9px;
}

.item-actions button,
.cancel-run {
  border: 1px solid #bd5b50;
  color: #a63329;
  background: transparent;
  font: inherit;
  font-size: 9px;
  cursor: pointer;
}

.item-actions button {
  height: 28px;
  padding: 0 9px;
}

.risk {
  padding: 2px 5px;
  color: var(--poivelle-muted);
  background: var(--poivelle-hover);
  font-size: 8px;
  text-transform: uppercase;
}

.risk-high,
.risk-critical {
  color: #a63329;
  background: #f6d8d3;
}

.run-item {
  align-items: center;
  gap: 10px;
}

.run-state {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #9d9d92;
}

.state-running,
.state-succeeded {
  background: var(--poivelle-green);
}

.state-failed,
.state-cancelled {
  background: var(--poivelle-red);
}

.run-item div {
  display: grid;
  min-width: 0;
}

.cancel-run {
  height: 27px;
  margin-left: auto;
  padding: 0 8px;
}

.run-item strong {
  font-size: 11px;
  text-transform: capitalize;
}

.run-item small {
  overflow: hidden;
  color: var(--poivelle-muted);
  font-family: 'Courier New', monospace;
  font-size: 8px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-copy {
  color: var(--poivelle-muted);
  font-size: 11px;
}

@media (max-width: 820px) {
  .review-summary,
  .review-columns {
    display: block;
  }

  .summary-metrics {
    margin-top: 16px;
  }

  .review-columns > div + div {
    margin-top: 18px;
  }
}
</style>
