<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-y-auto p-[15px]">
      <model-selector class="mb-4" />
      <action-selector class="mb-4" />
      <duration-selector class="mb-4" />
      <size-selector class="mb-4" />
      <orientation-selector class="mb-4" />
      <prompt-input class="mb-4" />
      <start-end-image v-show="config?.action === 'image2video'" class="mb-2" />
    </div>
    <div class="flex flex-col items-center justify-center px-[15px] pb-[15px]">
      <consumption :value="consumption" :service="service" />
      <el-button type="primary" class="btn w-full" round @click="onGenerate">
        <font-awesome-icon icon="fa-solid fa-magic" class="mr-2" />
        {{ $t('sora.button.generate') }}
      </el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import ModelSelector from './config/ModelSelector.vue';
import ActionSelector from './config/ActionSelector.vue';
import DurationSelector from './config/DurationSelector.vue';
import OrientationSelector from './config/OrientationSelector.vue';
import StartEndImage from './config/StartEndImage.vue';
import SizeSelector from './config/SizeSelector.vue';
import Consumption from '../common/Consumption.vue';
import PromptInput from './config/PromptInput.vue';
import { getConsumption } from '@/utils';

export default defineComponent({
  name: 'ConfigPanel',
  components: {
    ElButton,
    Consumption,
    FontAwesomeIcon,
    PromptInput,
    ModelSelector,
    StartEndImage,
    SizeSelector,
    ActionSelector,
    OrientationSelector,
    DurationSelector
  },
  emits: ['generate'],
  computed: {
    config() {
      return this.$store.state.sora?.config;
    },
    consumption() {
      return getConsumption(this.config, this.service?.cost);
    },
    service() {
      return this.$store.state.sora?.service;
    }
  },
  methods: {
    onGenerate() {
      this.$emit('generate');
    }
  }
});
</script>
