<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-y-auto p-[15px]">
      <el-tabs v-model="activeTab" class="demo-tabs" stretch>
        <el-tab-pane :label="$t('midjourney.tab.images')" name="image">
          <div class="pt-2">
            <model-selector class="mb-2" />
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
            <prompt-input class="mb-4" />
          </div>
        </el-tab-pane>

        <el-tab-pane :label="$t('midjourney.tab.videos')" name="video">
          <div class="pt-2">
            <video-from-input v-show="config?.action === 'extend'" class="mb-4" />
            <image-url-input class="mb-2" />
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
        <mode-selector v-if="activeTab !== 'describe'" />
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
import VersionSelector from './config/VersionSelector.vue';
import ImageUrlInput from './config/ImageUrlInput.vue';
import ImageUrlInput2 from './config/ImageUrlInput2.vue';
import StylizeSelector from './config/StylizeSelector.vue';
import ChaosSelector from './config/ChaosSelector.vue';
import ModelSelector from './config/ModelSelector.vue';
import QualitySelector from './config/QualitySelector.vue';
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
    activeTab: {
      get() {
        return this.$store.state.midjourney.config.active_tab || 'image';
      },
      set(val: string) {
        console.debug('set active_tab', val);
        this.$store.commit('midjourney/setConfig', {
          ...this.$store.state.midjourney.config,
          active_tab: val
        });
      }
    },
    consumption() {
      return getConsumption(this.config, this.service?.metadata?.price);
    },
    service() {
      return this.$store.state.midjourney?.service;
    }
  }
});
</script>
