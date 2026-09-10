<template>
  <main v-loading="loading" class="holder-page">
    <section class="holder-hero">
      <div>
        <p class="eyebrow">{{ $t('coin.holderCenter.eyebrow') }}</p>
        <h1>{{ $t('coin.holderCenter.title') }}</h1>
        <p>{{ $t('coin.holderCenter.description') }}</p>
      </div>
      <a :href="platformBenefitsUrl" target="_blank" rel="noopener noreferrer" class="platform-link">
        {{ $t('coin.holderCenter.manageWallet') }}
      </a>
    </section>

    <el-alert
      v-if="!summary?.wallet?.address"
      type="info"
      :closable="false"
      show-icon
      :title="$t('coin.holderCenter.connectPrompt')"
    />

    <section class="tier-card">
      <div class="tier-mark">
        <span>{{ $t('coin.holderCenter.currentTier') }}</span>
        <strong>{{ currentTier ? `T${currentTier}` : 'T0' }}</strong>
      </div>
      <div class="tier-copy">
        <h2>{{ currentTier ? $t('coin.holderCenter.holder') : $t('coin.holderCenter.notQualified') }}</h2>
        <p v-if="summary?.next_tier">
          {{
            $t('coin.holderCenter.toNext', {
              amount: formatNumber(summary.next_tier.remaining),
              tier: summary.next_tier.code
            })
          }}
        </p>
        <p v-else>{{ $t('coin.holderCenter.maxTier') }}</p>
      </div>
      <div class="tier-savings">
        <span>{{ $t('coin.holderCenter.monthlySavings') }}</span>
        <strong>{{ formatCredits(summary?.monthly_savings?.saved_credits) }}</strong>
      </div>
    </section>

    <section v-if="summary?.benefits?.length" class="benefits-panel">
      <header>
        <p class="eyebrow">{{ $t('coin.holderCenter.benefitsEyebrow') }}</p>
        <h2>{{ $t('coin.holderCenter.benefits') }}</h2>
      </header>
      <div class="benefit-list">
        <article v-for="benefit in summary.benefits" :key="benefit.code">
          <div>
            <strong>{{ $t(`coin.benefit.${benefit.code}.title`) }}</strong>
            <p>{{ $t(`coin.benefit.${benefit.code}.description`) }}</p>
          </div>
          <el-tag
            :type="benefit.status === 'active' ? 'success' : benefit.status === 'coming_soon' ? 'warning' : 'info'"
            effect="plain"
            round
          >
            {{ $t(`coin.benefitStatus.${benefit.status}`) }}
          </el-tag>
        </article>
      </div>
    </section>

    <section class="operator-panel">
      <header>
        <p class="eyebrow">{{ $t('coin.operator.eyebrow') }}</p>
        <h2>{{ $t('coin.operator.title') }}</h2>
        <p>{{ $t('coin.operator.description') }}</p>
      </header>
      <el-alert
        v-if="!operatorState?.profile && !operatorState?.eligible"
        type="info"
        :closable="false"
        :title="$t('coin.operator.tierRequired')"
      />
      <el-form v-else label-position="top" class="operator-form" @submit.prevent>
        <el-form-item :label="$t('coin.operator.displayName')">
          <el-input v-model="operatorForm.display_name" :maxlength="80" show-word-limit />
        </el-form-item>
        <el-form-item :label="$t('coin.operator.bio')">
          <el-input v-model="operatorForm.bio" type="textarea" :rows="4" />
        </el-form-item>
        <div class="operator-form__footer">
          <div>
            <el-switch v-model="operatorForm.public" :disabled="operatorState?.profile?.status !== 'approved'" />
            <span>{{ $t('coin.operator.public') }}</span>
          </div>
          <el-button type="primary" :loading="saving" @click="saveOperator">
            {{ operatorState?.profile ? $t('coin.operator.save') : $t('coin.operator.apply') }}
          </el-button>
        </div>
      </el-form>
      <div v-if="operatorState?.profile" class="operator-status">
        <el-tag effect="plain">{{ $t(`coin.operator.status.${operatorState.profile.status}`) }}</el-tag>
        <span v-if="operatorState.profile.featured_eligible">{{ $t('coin.operator.featuredEligible') }}</span>
        <span v-if="operatorState.profile.featured">{{ $t('coin.operator.featured') }}</span>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, onMounted, reactive, ref } from 'vue';
import { ElAlert, ElButton, ElForm, ElFormItem, ElInput, ElMessage, ElSwitch, ElTag } from 'element-plus';
import { aceOperator, type AceHolderSummary, type AceOperatorState } from '@/operators';
import { getBaseUrlPlatform } from '@/utils/baseUrl';
import { captureError } from '@/plugins/telemetry';

const vm = getCurrentInstance()!.proxy as any;
const loading = ref(true);
const saving = ref(false);
const summary = ref<AceHolderSummary>();
const operatorState = ref<AceOperatorState>();
const operatorForm = reactive({ display_name: '', bio: '', public: false });
const platformBenefitsUrl = `${getBaseUrlPlatform()}/console/coin`;
const currentTier = computed(() => Number(summary.value?.current_tier?.tier || 0));

async function load() {
  loading.value = true;
  try {
    const [summaryResponse, operatorResponse] = await Promise.all([
      aceOperator.summary(),
      aceOperator.operatorProfile()
    ]);
    summary.value = summaryResponse.data;
    operatorState.value = operatorResponse.data;
    if (operatorState.value.profile) {
      operatorForm.display_name = operatorState.value.profile.display_name;
      operatorForm.bio = operatorState.value.profile.bio;
      operatorForm.public = operatorState.value.profile.public;
    }
  } catch (error) {
    captureError(error, { source: 'ace-holder', action: 'load' });
    ElMessage.error(vm.$t('coin.holderCenter.loadError'));
  } finally {
    loading.value = false;
  }
}

async function saveOperator() {
  if (!operatorForm.display_name.trim()) {
    ElMessage.warning(vm.$t('coin.operator.nameRequired'));
    return;
  }
  saving.value = true;
  try {
    const payload = {
      display_name: operatorForm.display_name.trim(),
      bio: operatorForm.bio.trim(),
      public: operatorForm.public
    };
    const response = operatorState.value?.profile
      ? await aceOperator.updateOperator(payload)
      : await aceOperator.applyOperator(payload);
    operatorState.value = { ...operatorState.value, ...response.data } as AceOperatorState;
    ElMessage.success(
      vm.$t(operatorState.value.profile?.status === 'pending' ? 'coin.operator.applied' : 'coin.operator.saved')
    );
  } catch (error) {
    captureError(error, { source: 'ace-holder', action: 'saveOperator' });
    ElMessage.error(vm.$t('coin.operator.saveError'));
  } finally {
    saving.value = false;
  }
}

const formatNumber = (value?: number | null) =>
  Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 });
const formatCredits = (value?: number | null) =>
  `${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} Credits`;

onMounted(load);
</script>

<style scoped lang="scss">
.holder-page {
  display: grid;
  gap: 18px;
  max-width: 1040px;
  margin: 0 auto;
}
.holder-hero,
.tier-card,
.benefits-panel,
.operator-panel {
  border: 1px solid var(--app-border-subtle);
  border-radius: 18px;
  background: var(--el-bg-color);
}
.holder-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 28px;
}
.holder-hero h1,
.holder-hero p,
.operator-panel h2,
.operator-panel p {
  margin: 0;
}
.holder-hero h1 {
  margin-bottom: 8px;
  font-size: 28px;
}
.holder-hero p,
.operator-panel p,
.benefit-list p {
  color: var(--el-text-color-secondary);
  line-height: 1.6;
}
.eyebrow {
  margin: 0 0 6px;
  color: var(--el-color-primary);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.platform-link {
  flex: none;
  padding: 10px 16px;
  border: 1px solid var(--el-color-primary);
  border-radius: 999px;
  color: var(--el-color-primary);
  text-decoration: none;
}
.tier-card {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 22px;
  padding: 22px;
}
.tier-mark {
  display: grid;
  place-items: center;
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--el-color-primary) 12%, var(--el-bg-color));
}
.tier-mark span,
.tier-savings span {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
.tier-mark strong {
  color: var(--el-color-primary);
  font-size: 30px;
}
.tier-copy h2,
.tier-copy p,
.tier-savings span,
.tier-savings strong {
  margin: 0;
}
.tier-copy p {
  margin-top: 5px;
  color: var(--el-text-color-secondary);
}
.tier-savings {
  display: grid;
  justify-items: end;
  gap: 5px;
}
.tier-savings strong {
  font-size: 20px;
}
.benefits-panel,
.operator-panel {
  padding: 24px;
}
.benefit-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 18px;
}
.benefit-list article {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 15px;
  border: 1px solid var(--app-border-subtle);
  border-radius: 13px;
}
.benefit-list p {
  margin: 5px 0 0;
}
.operator-form {
  margin-top: 18px;
}
.operator-form__footer,
.operator-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.operator-form__footer > div,
.operator-status {
  display: flex;
  align-items: center;
  gap: 9px;
}
.operator-status {
  justify-content: flex-start;
  margin-top: 16px;
}
@media (max-width: 720px) {
  .holder-hero,
  .tier-card {
    align-items: flex-start;
    grid-template-columns: 1fr;
  }
  .holder-hero {
    flex-direction: column;
  }
  .tier-savings {
    justify-items: start;
  }
  .benefit-list {
    grid-template-columns: 1fr;
  }
  .operator-form__footer {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
