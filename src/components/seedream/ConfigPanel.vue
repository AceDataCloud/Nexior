<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-y-auto p-5">
      <scenario-segmented
        class="mb-4"
        :model-value="action"
        :options="actionOptions"
        :accessible-label="$t('seedream.name.action')"
        @update:model-value="onActionChange"
      />
      <model-selector class="mb-4" />
      <size-selector class="mb-4" />
      <max-images-selector class="mb-4" />
      <output-format-selector class="mb-4" />
      <seed-input class="mb-4" />
      <guidance-scale-input class="mb-4" />
      <watermark-switch class="mb-4" />
      <prompt-input class="mb-4" />
      <image-input class="mb-4" />
    </div>
    <div class="flex flex-col items-center justify-center px-5 pb-5">
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
import MaxImagesSelector from './config/MaxImagesSelector.vue';
import OutputFormatSelector from './config/OutputFormatSelector.vue';
import SeedInput from './config/SeedInput.vue';
import GuidanceScaleInput from './config/GuidanceScaleInput.vue';
import WatermarkSwitch from './config/WatermarkSwitch.vue';
import { getSeedreamShortModel } from '@/constants';
import { ScenarioSegmented, type ScenarioSegmentedOption, type ScenarioSegmentedValue } from '@/components/scenario';
import { getSeedreamCapabilities } from '@/utils/seedream/capabilities';

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
    MaxImagesSelector,
    OutputFormatSelector,
    SeedInput,
    GuidanceScaleInput,
    WatermarkSwitch,
    ScenarioSegmented
  },
  emits: ['generate'],
  computed: {
    action(): 'generate' | 'edit' {
      return this.config?.action === 'edit' ? 'edit' : 'generate';
    },
    actionOptions(): ScenarioSegmentedOption[] {
      const capabilities = getSeedreamCapabilities(this.config?.model);
      return [
        {
          value: 'generate',
          label: this.$t('seedream.name.generate'),
          disabled: capabilities.imageRequired
        },
        {
          value: 'edit',
          label: this.$t('seedream.name.edits'),
          disabled: !capabilities.image
        }
      ];
    },
    config() {
      return this.$store.state.seedream?.config;
    },
    consumption() {
      const cfg: any = { ...(this.config || {}) };
      // Per-image billing: cost/api/86ad30f3-…json multiplies the unit price by
      // `count`. When the user opts into group generation we forward the
      // selected `max_images`; otherwise default to 1 to match the upstream.
      const requestedCount =
        cfg?.sequential_image_generation === 'auto'
          ? Math.max(1, Math.floor(cfg?.sequential_image_generation_options?.max_images || 1))
          : 1;
      return getConsumption(
        {
          ...cfg,
          action: this.action,
          model: getSeedreamShortModel(cfg?.model),
          count: requestedCount
        },
        this.service?.cost
      );
    },
    service() {
      return this.$store.state.seedream?.service;
    }
  },
  methods: {
    onActionChange(action: ScenarioSegmentedValue) {
      if (action !== 'generate' && action !== 'edit') return;
      this.$store.commit('seedream/setConfig', { ...this.config, action });
    },
    onGenerate() {
      this.$emit('generate');
    }
  }
});
</script>
