<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-y-auto p-[15px]">
      <model-selector class="mb-4" />
      <size-selector class="mb-4" />
      <prompt-input class="mb-4" />
      <watermark-switch class="mb-4" />
      <image-input class="mb-4" />
    </div>
    <div class="flex flex-col items-center justify-center px-[15px] pb-[15px]">
      <consumption :value="consumption" :service="service" />
      <el-button type="primary" class="btn w-full" round @click="onGenerate">
        <font-awesome-icon icon="fa-solid fa-magic" class="mr-2" />
        {{ $t('seedream.button.generate') }}
      </el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import PromptInput from './config/PromptInput.vue';
import ImageInput from './config/ImageInput.vue';
import Consumption from '../common/Consumption.vue';
import { getConsumption } from '@/utils';
import ModelSelector from './config/ModelSelector.vue';
import SizeSelector from './config/SizeSelector.vue';
import WatermarkSwitch from './config/WatermarkSwitch.vue';
import { getSeedreamShortModel } from '@/constants';

export default defineComponent({
  name: 'SeedreamConfigPanel',
  components: {
    ElButton,
    FontAwesomeIcon,
    PromptInput,
    Consumption,
    ImageInput,
    ModelSelector,
    SizeSelector,
    WatermarkSwitch
  },
  emits: ['generate'],
  computed: {
    config() {
      return this.$store.state.seedream?.config;
    },
    consumption() {
      const cfg: any = { ...(this.config || {}) };
      const hasReferenceImages = Array.isArray(cfg?.image) && cfg.image.length > 0;
      return getConsumption(
        {
          ...cfg,
          action: hasReferenceImages ? 'edit' : 'generate',
          model: getSeedreamShortModel(cfg?.model),
          count: 1
        },
        this.service?.cost
      );
    },
    service() {
      return this.$store.state.seedream?.service;
    }
  },
  methods: {
    onGenerate() {
      this.$emit('generate');
    }
  }
});
</script>
