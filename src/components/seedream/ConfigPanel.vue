<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-y-auto p-5">
      <model-selector class="mb-4" />
      <size-selector class="mb-4" />
      <max-images-selector class="mb-4" />
      <output-format-selector class="mb-4" />
      <seed-input class="mb-4" />
      <guidance-scale-input class="mb-4" />
      <prompt-input class="mb-4" />
      <image-input v-if="capabilities.image" class="mb-4" />
    </div>
    <div class="flex flex-col items-center justify-center px-5 pb-5">
      <consumption :value="consumption" :service="service" />
      <el-button type="primary" class="btn w-full" round @click="onGenerate">
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
import Consumption from '../common/Consumption.vue';
import { getConsumption } from '@/utils';
import ModelSelector from './config/ModelSelector.vue';
import SizeSelector from './config/SizeSelector.vue';
import MaxImagesSelector from './config/MaxImagesSelector.vue';
import OutputFormatSelector from './config/OutputFormatSelector.vue';
import SeedInput from './config/SeedInput.vue';
import GuidanceScaleInput from './config/GuidanceScaleInput.vue';
import { getSeedreamShortModel } from '@/constants';
import { getSeedreamAction, getSeedreamCapabilities } from '@/utils/seedream/capabilities';
import { buildSeedreamRequest } from '@/utils/seedream/request';

export default defineComponent({
  name: 'SeedreamConfigPanel',
  components: {
    MagicIcon,
    ElButton,
    PromptInput,
    Consumption,
    ImageInput,
    ModelSelector,
    SizeSelector,
    MaxImagesSelector,
    OutputFormatSelector,
    SeedInput,
    GuidanceScaleInput
  },
  emits: ['generate'],
  computed: {
    action(): 'generate' | 'edit' {
      return getSeedreamAction(this.config?.model, this.config?.image);
    },
    capabilities() {
      return getSeedreamCapabilities(this.config?.model);
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
      return getConsumption(
        {
          ...request,
          action: this.action,
          model: getSeedreamShortModel(request.model),
          input_image_count: request.image?.length || 0,
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
    onGenerate() {
      this.$emit('generate');
    }
  }
});
</script>
