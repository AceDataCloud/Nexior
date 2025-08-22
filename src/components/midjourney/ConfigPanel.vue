<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-y-auto p-[15px]">
      <el-tabs v-model="type" class="demo-tabs" stretch>
        <el-tab-pane :label="$t('midjourney.tab.images')" name="imagine">
          <div class="pt-2">
            <model-selector class="mb-2" />
            <prompt-input class="mb-4" />
            <reference-image class="mb-2" />
            <ratio-selector class="mb-4" />
            <quality-selector class="mb-4" />
            <version-selector class="mb-4" />
            <elements-selector class="mb-2" />
            <advanced-selector class="mb-2" />
            <div v-show="config?.advanced">
              <stylize-selector class="mb-2" />
              <weird-selector class="mb-2" />
              <chaos-selector class="mb-2" />
              <image-weight-selector class="mb-2" />
              <style-selector class="mb-2" />
            </div>
          </div>
        </el-tab-pane>
        <el-tab-pane :label="$t('midjourney.tab.videos')" name="videos">
          <div class="pt-2">
            <video-from-input v-show="config?.action === 'extend'" class="mb-4" />
            <image-url-input class="mb-2" />
            <end-image-url-input class="mb-2" />
            <loop-selector class="mb-2" />
            <resolution-selector class="mb-4" />
            <prompt-input class="mb-4" />
          </div>
        </el-tab-pane>
        <el-tab-pane :label="$t('midjourney.tab.describe')" name="describe">
          <div class="pt-2">
            <image-url-input2 class="mb-2" />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
    <div class="flex flex-col px-[15px] pb-[15px]">
      <consumption :value="consumption" :service="service" />
      <div class="flex gap-1">
        <mode-selector v-if="type !== 'describe'" />
        <el-button v-if="config.action === 'extend'" type="primary" class="btn w-full" round @click="$emit('generate')">
          {{ $t('midjourney.button.extend') }}
        </el-button>
        <el-button v-else type="primary" class="btn w-full" round @click="$emit('generate')">
          {{ $t('midjourney.button.generate') }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import RatioSelector from './config/RatioSelector.vue';
import AdvancedSelector from './config/AdvancedSelector.vue';
import LoopSelector from './config/LoopSelector.vue';
import VersionSelector from './config/VersionSelector.vue';
import ImageUrlInput from './config/ImageUrlInput.vue';
import EndImageUrlInput from './config/EndImageUrlInput.vue';
import ImageUrlInput2 from './config/ImageUrlInput2.vue';
import StylizeSelector from './config/StylizeSelector.vue';
import ChaosSelector from './config/ChaosSelector.vue';
import ModelSelector from './config/ModelSelector.vue';
import QualitySelector from './config/QualitySelector.vue';
import ResolutionSelector from './config/ResolutionSelector.vue';
import ImageWeightSelector from './config/ImageWeightSelector.vue';
import WeirdSelector from './config/WeirdSelector.vue';
import VideoFromInput from './config/VideoFromInput.vue';
import StyleSelector from './config/StyleSelector.vue';
import ElementsSelector from './config/ElementsSelector.vue';
import ModeSelector from './config/ModeSelector2.vue';
import PromptInput from './config/PromptInput.vue';
import ReferenceImage from './config/ReferenceImage.vue';
import { ElButton, ElTabs, ElTabPane } from 'element-plus';
import Consumption from '../common/Consumption.vue';
import { getConsumption } from '@/utils';
import { MIDJOURNEY_DEFAULT_TYPE } from '@/constants';

export default defineComponent({
  name: 'ConfigPanel',
  components: {
    ElButton,
    PromptInput,
    ModeSelector,
    ModelSelector,
    ElementsSelector,
    StyleSelector,
    QualitySelector,
    RatioSelector,
    VersionSelector,
    StylizeSelector,
    AdvancedSelector,
    ChaosSelector,
    WeirdSelector,
    ImageWeightSelector,
    ReferenceImage,
    ImageUrlInput,
    EndImageUrlInput,
    LoopSelector,
    ResolutionSelector,
    ImageUrlInput2,
    Consumption,
    VideoFromInput,
    ElTabs,
    ElTabPane
  },
  emits: ['generate'],
  computed: {
    config() {
      return this.$store.state.midjourney.config;
    },
    type: {
      get() {
        return this.$store.state.midjourney.config.type || MIDJOURNEY_DEFAULT_TYPE;
      },
      set(val: string) {
        console.debug('set type', val);
        this.$store.commit('midjourney/setConfig', {
          ...this.$store.state.midjourney.config,
          type: val
        });
      }
    },
    consumption() {
      return getConsumption(this.config, this.service?.metadata?.price);
    },
    service() {
      return this.$store.state.midjourney?.service;
    }
  },
  mounted() {
    if (!this.config.type) {
      this.type = MIDJOURNEY_DEFAULT_TYPE;
    }
  }
});
</script>
