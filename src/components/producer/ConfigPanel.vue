<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-y-auto p-5">
      <el-tabs v-model="mode" class="producer-mode-tabs" stretch>
        <el-tab-pane :label="$t('producer.mode.simple')" name="simple">
          <div class="pt-2 px-1">
            <type-selector class="mb-4" />
            <upload-audio class="mb-4" />
            <prompt-input class="mb-4" />
            <extend-from-input v-if="config?.action === 'extend'" class="mb-4" />
            <cover-from-input v-if="config?.action === 'cover'" class="mb-4" />
            <replace-section-input v-if="config?.action === 'replace_section'" class="mb-4" />
            <advanced-params class="mb-4" />
          </div>
        </el-tab-pane>
        <el-tab-pane :label="$t('producer.mode.custom')" name="custom">
          <div class="pt-2 px-1">
            <type-selector class="mb-4" />
            <upload-audio class="mb-4" />
            <lyric-input v-if="!config?.instrumental" class="mb-4" />
            <style-input class="mb-4" />
            <title-input class="mb-4" />
            <vocal-gender-selector v-if="!config?.instrumental" class="mb-4" />
            <extend-from-input v-if="config?.action === 'extend'" class="mb-4" />
            <cover-from-input v-if="config?.action === 'cover'" class="mb-4" />
            <replace-section-input v-if="config?.action === 'replace_section'" class="mb-4" />
            <advanced-params class="mb-4" />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
    <div class="flex flex-col items-center justify-center px-5 pb-5 gap-2">
      <consumption :value="consumption" :service="service" />
      <div class="flex gap-2 w-full">
        <el-button class="flex-1" @click="onClearAll">
          <font-awesome-icon icon="fa-solid fa-broom" class="mr-1" />
          {{ $t('producer.button.clear_all') }}
        </el-button>
        <el-button type="primary" class="flex-1" round @click="onGenerate">
          <font-awesome-icon icon="fa-solid fa-magic" class="mr-2" />
          {{ generateButtonText }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton, ElTabs, ElTabPane } from 'element-plus';
import TypeSelector from './config/TypeSelector.vue';
import UploadAudio from './config/UploadAudio.vue';
import PromptInput from './config/PromptInput.vue';
import LyricInput from './config/LyricInput.vue';
import StyleInput from './config/StyleInput.vue';
import TitleInput from './config/TitleInput.vue';
import ExtendFromInput from './config/ExtendFromInput.vue';
import CoverFromInput from './config/CoverFromInput.vue';
import VocalGenderSelector from './config/VocalGenderSelector.vue';
import AdvancedParams from './config/AdvancedParams.vue';
import ReplaceSectionInput from './config/ReplaceSectionInput.vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import Consumption from '../common/Consumption.vue';
import { getConsumption } from '@/utils';

export default defineComponent({
  name: 'PresetPanel',
  components: {
    TypeSelector,
    PromptInput,
    LyricInput,
    StyleInput,
    TitleInput,
    ExtendFromInput,
    CoverFromInput,
    UploadAudio,
    VocalGenderSelector,
    AdvancedParams,
    ReplaceSectionInput,
    FontAwesomeIcon,
    ElButton,
    ElTabs,
    ElTabPane,
    Consumption
  },
  emits: ['generate'],
  computed: {
    config() {
      return this.$store.state.producer?.config;
    },
    mode: {
      get(): 'simple' | 'custom' {
        return this.$store.state.producer?.config?.custom ? 'custom' : 'simple';
      },
      set(val: 'simple' | 'custom') {
        this.$store.commit('producer/setConfig', {
          ...this.$store.state.producer?.config,
          custom: val === 'custom'
        });
      }
    },
    consumption() {
      return getConsumption(this.config, this.service?.cost);
    },
    service() {
      return this.$store.state.producer?.service;
    },
    generateButtonText() {
      const action = this.config?.action;
      if (action === 'extend' || action === 'upload_extend') return this.$t('producer.button.extend');
      if (action === 'cover' || action === 'upload_cover') return this.$t('producer.button.cover_music');
      if (action === 'variation') return this.$t('producer.button.variation');
      if (action === 'replace_section') return this.$t('producer.button.replace_section');
      if (action === 'stems') return this.$t('producer.button.get_stems');
      if (action === 'swap_vocals') return this.$t('producer.button.swap_vocals');
      if (action === 'swap_instrumentals') return this.$t('producer.button.swap_instrumentals');
      return this.$t('producer.button.generate');
    }
  },
  methods: {
    onGenerate() {
      this.$emit('generate');
    },
    onClearAll() {
      this.$store.commit('producer/setConfig', {
        custom: this.$store.state.producer?.config?.custom || false,
        instrumental: false,
        prompt: '',
        lyric: '',
        style: '',
        title: '',
        model: this.$store.state.producer?.config?.model
      });
    }
  }
});
</script>

<style lang="scss" scoped>
.producer-mode-tabs {
  :deep(.el-tabs__nav-wrap::after) {
    height: 1px;
  }
  :deep(.el-tabs__item) {
    font-size: 14px;
    font-weight: 500;
  }
}
</style>
