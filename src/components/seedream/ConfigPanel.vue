<template>
  <div class="config-panel flex flex-col h-full">
    <div class="config-scroll flex-1 overflow-y-auto p-5">
      <model-selector class="mb-4" />
      <size-selector class="mb-4" />
      <max-images-selector class="mb-4" />
      <output-format-selector class="mb-4" />
      <seed-input class="mb-4" />
      <guidance-scale-input class="mb-4" />
      <watermark-switch class="mb-4" />
      <prompt-input class="mb-4" />
      <image-input v-if="capabilities.image" class="mb-4" />
    </div>
    <div class="config-footer flex flex-col items-center justify-center px-5 pb-5">
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
import WatermarkSwitch from './config/WatermarkSwitch.vue';
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
    GuidanceScaleInput,
    WatermarkSwitch
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

<style lang="scss" scoped>
.config-scroll {
  scrollbar-gutter: stable;
}

.config-footer {
  padding-top: 12px;
  border-top: 1px solid var(--app-border-subtle);
  background: var(--app-sidebar-bg);
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.04);
}

.config-panel :deep(.field) {
  display: grid;
  grid-template-columns: 148px minmax(140px, 1fr);
  gap: 12px;
  align-items: center;
}

.config-panel :deep(.field .label),
.config-panel :deep(.field .value) {
  width: 100%;
  min-width: 0;
}

.config-panel :deep(.field .label .box) {
  min-width: 0;
}

.config-panel :deep(.field .label .title) {
  line-height: 1.35;
}

.config-panel :deep(.field .value) {
  justify-content: flex-end;
}

.config-panel :deep(.field .value > *) {
  max-width: 100%;
}

@media (max-width: 767px) {
  .config-panel :deep(.field) {
    grid-template-columns: minmax(0, 1fr);
    gap: 6px;
  }

  .config-panel :deep(.field .value) {
    justify-content: flex-start;
  }

  .config-panel :deep(.field .value > *) {
    width: 100%;
  }
}
</style>
