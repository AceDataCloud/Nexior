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
        <span
          ><strong>{{ formatCredits(costs?.totals_microcredits.final ?? 0) }}</strong
          >{{ $t('poivelle.review.finalCost') }}</span
        >
        <span
          ><strong>{{ passedEvaluations }}/{{ evaluations.length }}</strong
          >{{ $t('poivelle.review.qualityChecks') }}</span
        >
        <span
          ><strong :class="latestForensic?.result.verdict === 'fail' ? 'metric-fail' : ''">{{
            latestForensic?.result.verdict ?? '—'
          }}</strong
          >{{ $t('poivelle.review.forensics') }}</span
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
        <article
          v-for="run in runs"
          :key="run.id"
          :class="['run-item', { active: activeRun?.run.id === run.id }]"
          @click="$emit('open-run', run.id)"
        >
          <span :class="['run-state', `state-${run.state}`]" />
          <div>
            <strong>{{ run.state }}</strong>
            <small>{{ run.id }}</small>
          </div>
          <button
            v-if="canEdit && cancellable(run)"
            type="button"
            class="cancel-run"
            @click.stop="$emit('cancel-run', run.id)"
          >
            {{ $t('poivelle.run.cancel') }}
          </button>
        </article>
        <p v-if="!runs.length" class="empty-copy">{{ $t('poivelle.review.noRuns') }}</p>
        <section v-if="activeRun" class="run-detail">
          <header>
            <strong>{{ $t('poivelle.review.runDetail') }}</strong>
            <span>{{ activeRun.attempts.length }} {{ $t('poivelle.review.attempts') }}</span>
          </header>
          <article v-for="step in activeRun.steps" :key="step.id" class="step-item">
            <span :class="['run-state', `state-${step.state}`]" />
            <div>
              <strong>{{ step.operation }}</strong>
              <small>{{ step.state }} · {{ step.node_id }}</small>
              <p v-if="latestAttempt(step.id)?.error">
                {{ latestAttempt(step.id)?.error?.code ?? 'provider_error' }}:
                {{ latestAttempt(step.id)?.error?.message ?? $t('poivelle.error.generic') }}
              </p>
            </div>
            <button
              v-if="canEdit && ['failed', 'manual_recovery'].includes(step.state)"
              type="button"
              class="retry-step"
              @click.stop="$emit('retry-step', step)"
            >
              {{ $t('poivelle.review.retryStep') }}
            </button>
          </article>
        </section>
        <section v-if="failedForensicChecks.length" class="forensic-failures" role="alert">
          <strong>{{ $t('poivelle.review.forensics') }}</strong>
          <p v-for="check in failedForensicChecks" :key="check.code">
            {{ check.code }} · {{ String(check.actual ?? '—') }} / {{ String(check.expected ?? '—') }}
          </p>
        </section>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type {
  IPoivelleEvaluation,
  IPoivelleForensicValidation,
  IPoivelleGraphSnapshot,
  IPoivelleProjectCosts,
  IPoivelleProposal,
  IPoivelleRevision,
  IPoivelleRun,
  IPoivelleRunDetail,
  IPoivelleStepRun
} from '@/models';

const props = defineProps<{
  graph: IPoivelleGraphSnapshot;
  proposals: IPoivelleProposal[];
  revisions: IPoivelleRevision[];
  runs: IPoivelleRun[];
  activeRun?: IPoivelleRunDetail;
  evaluations: IPoivelleEvaluation[];
  forensicValidations: IPoivelleForensicValidation[];
  costs?: IPoivelleProjectCosts;
  canEdit: boolean;
}>();
defineEmits<{
  'reject-proposal': [proposalId: string];
  'cancel-run': [runId: string];
  'open-run': [runId: string];
  'retry-step': [step: IPoivelleStepRun];
}>();
const pendingProposals = computed(() => props.proposals.filter((proposal) => proposal.state === 'awaiting_approval'));
const cancellable = (run: IPoivelleRun) => !['release_pending', 'succeeded', 'failed', 'cancelled'].includes(run.state);
const passedEvaluations = computed(() => props.evaluations.filter((item) => item.verdict === 'pass').length);
const latestForensic = computed(() => props.forensicValidations[0]);
const failedForensicChecks = computed(
  () => latestForensic.value?.result.checks.filter((check) => check.verdict === 'fail') ?? []
);
const latestAttempt = (stepId: string) =>
  [...(props.activeRun?.attempts ?? [])]
    .filter((attempt) => attempt.step_run_id === stepId)
    .sort((left, right) => right.created_at.localeCompare(left.created_at))[0];
const formatCredits = (microcredits: number) => (microcredits / 1_000_000).toFixed(2);
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
  border-radius: var(--poivelle-radius);
  background: var(--poivelle-paper);
  box-shadow: var(--app-shadow-xs);
}

.eyebrow,
.review-columns h3 {
  color: var(--app-brand-hex);
  font-size: 10px;
  font-weight: 650;
}

.review-summary h2 {
  margin: 5px 0 0;
  font-size: 22px;
  font-weight: 650;
}

.summary-metrics {
  gap: 22px;
}

.summary-metrics span {
  display: grid;
  color: var(--poivelle-muted);
  font-size: 9px;
}

.summary-metrics strong {
  color: var(--poivelle-ink);
  font-size: 20px;
}
.summary-metrics .metric-fail {
  color: var(--poivelle-red);
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
  border-radius: var(--poivelle-radius);
  background: var(--poivelle-paper);
}
.run-item {
  cursor: pointer;
}
.run-item.active {
  border-color: var(--app-brand-hex);
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
  border: 1px solid color-mix(in srgb, var(--el-color-danger) 45%, transparent);
  border-radius: var(--poivelle-radius-small);
  color: var(--el-color-danger);
  background: transparent;
  font: inherit;
  font-size: 9px;
  cursor: pointer;
}
.run-detail {
  margin-top: 14px;
  border-top: 1px solid var(--poivelle-line-strong);
}
.forensic-failures {
  margin-top: 14px;
  padding: 10px;
  border: 1px solid color-mix(in srgb, var(--poivelle-red) 40%, transparent);
  color: var(--poivelle-red);
  background: color-mix(in srgb, var(--poivelle-red) 6%, var(--poivelle-paper));
  font-size: 9px;
}
.forensic-failures p {
  margin: 5px 0 0;
}
.run-detail > header,
.step-item {
  display: flex;
  align-items: center;
  gap: 9px;
}
.run-detail > header {
  justify-content: space-between;
  padding: 12px 2px 8px;
  font-size: 10px;
}
.run-detail > header span {
  color: var(--poivelle-muted);
}
.step-item {
  padding: 10px;
  border: 1px solid var(--poivelle-line);
  background: var(--poivelle-paper);
}
.step-item + .step-item {
  border-top: 0;
}
.step-item > div {
  display: grid;
  min-width: 0;
}
.step-item p {
  margin: 4px 0 0;
  color: var(--poivelle-red);
  font-size: 9px;
}
.retry-step {
  margin-left: auto;
  border: 0;
  color: var(--app-brand-hex);
  background: transparent;
  font: 9px inherit;
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
  border-radius: var(--adc-radius-full);
}

.risk-high,
.risk-critical {
  color: var(--el-color-danger);
  background: color-mix(in srgb, var(--el-color-danger) 10%, transparent);
}

.run-item {
  align-items: center;
  gap: 10px;
}

.run-state {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--el-text-color-placeholder);
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

.item-actions button:focus-visible,
.cancel-run:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--el-color-danger) 45%, transparent);
  outline-offset: 2px;
}

.run-item strong {
  font-size: 11px;
  text-transform: capitalize;
}

.run-item small {
  overflow: hidden;
  color: var(--poivelle-muted);
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
