<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-y-auto p-5">
      <model-selector class="mb-4" />
      <size-selector class="mb-4" />
      <max-images-selector class="mb-4" />
      <output-format-selector class="mb-4" />
      <advanced-options class="mb-4" />
      <seed-input class="mb-4" />
      <guidance-scale-input class="mb-4" />
      <prompt-input class="mb-4" />
      <image-input v-if="capabilities.image" class="mb-4" />
    </div>
    <div class="flex flex-col items-center justify-center px-5 pb-5">
      <service-pricing-summary :value="consumption" :service="service" />
      <el-button type="primary" class="btn w-full" round :disabled="!canGenerate" @click="onGenerate">
        <magic-icon class="mr-2" :size="'1em' as any" aria-hidden="true" focusable="false" />
        {{ $t('seedream.button.generate') }}
      </el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { MagicIcon } from '@acedatacloud/core/icons/components';
import { defineComponent } from 'vue';
import { ElButton } from 'element-plus';
import PromptInput from './config/PromptInput.vue';
import ImageInput from './config/ImageInput.vue';
import ServicePricingSummary from '../common/ServicePricingSummary.vue';
import { getConsumption } from '@/utils';
import ModelSelector from './config/ModelSelector.vue';
import SizeSelector from './config/SizeSelector.vue';
import MaxImagesSelector from './config/MaxImagesSelector.vue';
import OutputFormatSelector from './config/OutputFormatSelector.vue';
import AdvancedOptions from './config/AdvancedOptions.vue';
import SeedInput from './config/SeedInput.vue';
import GuidanceScaleInput from './config/GuidanceScaleInput.vue';
import { getSeedreamShortModel } from '@/constants';
import { getSeedreamAction, getSeedreamCapabilities } from '@/utils/seedream/capabilities';
import { buildSeedreamRequest } from '@/utils/seedream/request';
import { canSubmitGeneration } from '@/utils/generationInput';

export default defineComponent({
  name: 'SeedreamConfigPanel',
  components: {
    MagicIcon,
    ElButton,
    PromptInput,
    ServicePricingSummary,
    ImageInput,
    ModelSelector,
    SizeSelector,
    MaxImagesSelector,
    OutputFormatSelector,
    AdvancedOptions,
    SeedInput,
    GuidanceScaleInput
  },
  emits: ['generate'],
  computed: {
    action(): 'generate' | 'edit' {
      const image = this.config?.image;
      return getSeedreamAction(this.config?.model, typeof image === 'string' ? [image] : image);
    },
    capabilities() {
      return getSeedreamCapabilities(this.config?.model);
    },
    canGenerate(): boolean {
      const request = buildSeedreamRequest(this.config);
      if (request.layer_decomposition) return request.image?.length === 1;
      return canSubmitGeneration('seedream', request);
    },
    config() {
      return this.$store.state.seedream?.config;
    },
    consumption() {
      const request = buildSeedreamRequest(this.config);
      // Per-image billing: cost/api/86ad30f3-…json multiplies the unit price by
      // `count`. When the user opts into group generation we forward the
      // selected `max_images`; otherwise default to 1 to match the upstream.
      const requestedCount =
        request.sequential_image_generation === 'auto'
          ? Math.max(1, Math.floor(request.sequential_image_generation_options?.max_images || 1))
          : 1;
      const pixels =
        typeof request.size === 'string' && /^\d+x\d+$/i.test(request.size)
          ? request.size
              .split('x')
              .map(Number)
              .reduce((width, height) => width * height)
          : request.size === '2K'
            ? 4_194_304
            : 1_000_000;
      const pro = request.model === 'doubao-seedream-5-0-pro-260628';
      return getConsumption(
        {
          ...request,
          action: this.action,
          model: getSeedreamShortModel(request.model),
          input_image_count: Array.isArray(request.image) ? request.image.length : request.image ? 1 : 0,
          count: requestedCount,
          layer_decomposition: request.layer_decomposition === true,
          layer_low_count: request.layer_decomposition ? 1 : 0,
          regular_low_count: pro && !request.layer_decomposition && pixels <= 2_610_000 ? 1 : 0,
          regular_high_count: pro && !request.layer_decomposition && pixels > 2_610_000 ? 1 : 0
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
