<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-y-auto p-[15px]">
      <model-selector class="mb-4" />
      <resolution-selector class="mb-4" />
      <prompt-input class="mb-4" />
      <aspect-ratio-selector class="mb-4" />
      <image-urls-input class="mb-4" />
    </div>
    <div class="flex flex-col items-center justify-center px-[15px] pb-[15px]">
      <consumption :value="consumption" :service="service" />
      <el-button type="primary" class="btn w-full" round @click="onGenerate">
        <font-awesome-icon icon="fa-solid fa-magic" class="mr-2" />
        {{ $t('nanobanana.button.generate') }}
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
import AspectRatioSelector from './config/AspectRatioSelector.vue';
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
    AspectRatioSelector,
    ModelSelector,
    ResolutionSelector
  },
  emits: ['generate'],
  computed: {
    config() {
      return this.$store.state.nanobanana?.config;
    },
    consumption() {
      const cfg: any = { ...(this.config || {}) };
      const hasReferenceImages = Array.isArray(cfg?.image_urls) && cfg.image_urls.length > 0;
      return getConsumption(
        {
          ...cfg,
          action: hasReferenceImages ? 'edit' : 'generate'
        },
        this.service?.cost
      );
    },
    service() {
      return this.$store.state.nanobanana?.service;
    }
  },
  methods: {
    onGenerate() {
      this.$emit('generate');
    }
  }
});
</script>
