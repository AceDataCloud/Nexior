<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-y-auto p-5">
      <prompt-input class="mb-4" />
      <model-selector class="mb-4" />
      <resolution-selector v-if="supportsResolution" class="mb-4" />
      <duration-selector v-if="supportsDuration" class="mb-4" />
      <image-url-input v-if="supportsImageUrl" class="mb-2" />
    </div>
    <div class="flex flex-col items-center justify-center px-5 pb-5">
      <consumption :value="consumption" :service="service" />
      <el-button type="primary" class="btn w-full" round @click="onGenerate">
        <font-awesome-icon icon="fa-solid fa-magic" class="mr-2" />
        {{ $t('wan.button.generate') }}
      </el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import ModelSelector from './config/ModelSelector.vue';
import ResolutionSelector from './config/ResolutionSelector.vue';
import DurationSelector from './config/DurationSelector.vue';
import ImageUrlInput from './config/ImageUrlInput.vue';
import PromptInput from './config/PromptInput.vue';
import Consumption from '../common/Consumption.vue';
import { getConsumption } from '@/utils';

export default defineComponent({
  name: 'PresetPanel',
  components: {
    ElButton,
    FontAwesomeIcon,
    PromptInput,
    ImageUrlInput,
    ModelSelector,
    ResolutionSelector,
    DurationSelector,
    Consumption
  },
  emits: ['generate'],
  computed: {
    config() {
      return this.$store.state.wan?.config;
    },
    consumption() {
      return getConsumption(this.config, this.service?.cost);
    },
    service() {
      return this.$store.state.wan?.service;
    },
    supportsResolution() {
      const model = this.config?.model;
      return model === 'wan2.6-t2v' || model === 'wan2.6-i2v' || model === 'wan2.6-i2v-flash';
    },
    supportsDuration() {
      return this.config?.model === 'wan2.6-t2v';
    },
    supportsImageUrl() {
      const model = this.config?.model;
      return model === 'wan2.6-i2v' || model === 'wan2.6-i2v-flash';
    }
  },
  methods: {
    onGenerate() {
      this.$emit('generate');
    }
  }
});
</script>
