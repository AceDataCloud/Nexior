<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-y-auto p-5">
      <model-selector class="mb-4" />
      <resolution-selector class="mb-4" />
      <prompt-input class="mb-4" />
      <image-urls-input class="mb-4" />
    </div>
    <div class="flex flex-col items-center justify-center px-5 pb-5">
      <consumption :value="consumption" :service="service" />
      <el-button type="primary" class="btn w-full" round @click="onGenerate">
        <font-awesome-icon icon="fa-solid fa-magic" class="mr-2" />
        {{ $t('openaiimage.button.generate') }}
      </el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import PromptInput from './config/PromptInput.vue';
import ImageUrlsInput from './config/ImageUrlsInput.vue';
import Consumption from '../common/Consumption.vue';
import { getConsumption } from '@/utils';
import ModelSelector from './config/ModelSelector.vue';
import ResolutionSelector from './config/ResolutionSelector.vue';

export default defineComponent({
  name: 'ConfigPanel',
  components: {
    ElButton,
    FontAwesomeIcon,
    PromptInput,
    Consumption,
    ImageUrlsInput,
    ModelSelector,
    ResolutionSelector
  },
  emits: ['generate'],
  computed: {
    config() {
      return this.$store.state.openaiimage?.config;
    },
    consumption() {
      const cfg: any = { ...(this.config || {}) };
      return getConsumption(
        {
          ...cfg
        },
        this.service?.cost
      );
    },
    service() {
      return this.$store.state.openaiimage?.service;
    }
  },
  methods: {
    onGenerate() {
      this.$emit('generate');
    }
  }
});
</script>
