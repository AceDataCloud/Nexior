<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-y-auto p-5">
      <mode-selector class="mb-4" />
      <url-input class="mb-4" @submit="onRun" />
      <template v-if="isExtract">
        <expected-type-selector class="mb-4" />
        <llm-toggle class="mb-4" />
      </template>
      <advanced-options class="mb-4" />
    </div>
    <div class="flex flex-col items-center justify-center px-5 pb-5">
      <consumption :value="consumption" :service="service" />
      <el-button type="primary" class="w-full" round :loading="running" :disabled="!canRun" @click="onRun">
        <font-awesome-icon icon="fa-solid fa-bolt" class="mr-2" />
        {{ $t(isExtract ? 'webextrator.button.extract' : 'webextrator.button.render') }}
      </el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import ModeSelector from './config/ModeSelector.vue';
import UrlInput from './config/UrlInput.vue';
import ExpectedTypeSelector from './config/ExpectedTypeSelector.vue';
import LlmToggle from './config/LlmToggle.vue';
import AdvancedOptions from './config/AdvancedOptions.vue';
import Consumption from '../common/Consumption.vue';
import { getConsumption } from '@/utils';
import { Status } from '@/models';

export default defineComponent({
  name: 'WebextratorConfigPanel',
  components: {
    ElButton,
    FontAwesomeIcon,
    ModeSelector,
    UrlInput,
    ExpectedTypeSelector,
    LlmToggle,
    AdvancedOptions,
    Consumption
  },
  emits: ['run'],
  computed: {
    config() {
      return this.$store.state.webextrator?.config;
    },
    service() {
      return this.$store.state.webextrator?.service;
    },
    consumption(): number | undefined {
      return getConsumption(this.config || {}, this.service?.cost);
    },
    running(): boolean {
      return this.$store.state.webextrator?.status?.run === Status.Request;
    },
    isExtract(): boolean {
      return (this.config?.mode || 'extract') === 'extract';
    },
    canRun(): boolean {
      const url = (this.config?.url || '').trim();
      // Don't fight the API with an in-browser regex; just require a scheme.
      return /^https?:\/\//i.test(url);
    }
  },
  methods: {
    onRun() {
      if (this.canRun) {
        this.$emit('run');
      }
    }
  }
});
</script>
