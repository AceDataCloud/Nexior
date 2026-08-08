<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-y-auto p-5">
      <query-input class="mb-4" />
      <type-selector class="mb-4" />
      <country-input class="mb-4" />
      <language-input class="mb-4" />
    </div>
    <div class="flex flex-col items-center justify-center px-5 pb-5">
      <scenario-payment-mode scenario="serp" />
      <consumption v-if="!walletMode" :value="consumption" :service="service" />
      <el-button type="primary" class="btn w-full" round :loading="searching" @click="onSearch">
        <search-icon class="mr-2" :size="'1em' as any" aria-hidden="true" focusable="false" />
        {{ $t('serp.button.search') }}
      </el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { SearchIcon } from '@acedatacloud/core/icons/components';
import { defineComponent } from 'vue';
import { ElButton } from 'element-plus';
import QueryInput from './config/QueryInput.vue';
import TypeSelector from './config/TypeSelector.vue';
import CountryInput from './config/CountryInput.vue';
import LanguageInput from './config/LanguageInput.vue';
import Consumption from '../common/Consumption.vue';
import { getConsumption } from '@/utils';
import { Status } from '@/models';
import ScenarioPaymentMode from '../common/ScenarioPaymentMode.vue';
import { isScenarioX402Enabled, scenarioPaymentState } from '@/utils/x402/scenarioPayment';
import { buildSerpRequest, serpOperator } from '@/operators/serp';

export default defineComponent({
  name: 'SearchPanel',
  components: {
    SearchIcon,
    ElButton,
    QueryInput,
    TypeSelector,
    CountryInput,
    LanguageInput,
    Consumption,
    ScenarioPaymentMode
  },
  emits: ['search'],
  data() {
    return { quoteTimer: 0, quoteRunId: 0 };
  },
  computed: {
    config() {
      return this.$store.state.serp?.config;
    },
    consumption() {
      return getConsumption(this.config, this.service?.cost);
    },
    service() {
      return this.$store.state.serp?.service;
    },
    searching() {
      return this.$store.state.serp?.status?.search === Status.Request;
    },
    walletMode(): boolean {
      return isScenarioX402Enabled() && scenarioPaymentState('serp').mode === 'wallet';
    }
  },
  watch: {
    walletMode: {
      handler(enabled: boolean) {
        if (enabled) this.scheduleQuote();
      },
      immediate: true
    },
    config: {
      handler() {
        if (this.walletMode) this.scheduleQuote();
      },
      deep: true
    }
  },
  beforeUnmount() {
    window.clearTimeout(this.quoteTimer);
    this.quoteRunId += 1;
  },
  methods: {
    scheduleQuote() {
      window.clearTimeout(this.quoteTimer);
      this.quoteTimer = window.setTimeout(this.refreshQuote, 350);
    },
    async refreshQuote() {
      const state = scenarioPaymentState('serp');
      const runId = ++this.quoteRunId;
      state.quoteLoading = true;
      state.quoteUsdc = undefined;
      try {
        const quote = await serpOperator.quote(buildSerpRequest(this.config));
        if (runId === this.quoteRunId && state.mode === 'wallet') state.quoteUsdc = quote.amountUsdc;
      } catch (error) {
        console.warn('x402 quote failed', error);
      } finally {
        if (runId === this.quoteRunId) state.quoteLoading = false;
      }
    },
    onSearch() {
      this.$emit('search');
    }
  }
});
</script>
