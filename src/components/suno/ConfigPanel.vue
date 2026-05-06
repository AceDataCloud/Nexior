<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-y-auto p-5">
      <el-tabs v-model="mode" class="suno-mode-tabs" stretch>
        <el-tab-pane :label="$t('suno.mode.simple')" name="simple">
          <div class="pt-2 px-1">
            <type-selector class="mb-4" />
            <upload-audio class="mb-4" />
            <prompt-input class="mb-4" />
            <extend-from-input v-if="config?.action === 'extend'" class="mb-4" />
            <cover-from-input v-if="config?.action === 'cover'" class="mb-4" />
            <replace-section-input v-if="config?.action === 'replace_section'" class="mb-4" />
            <overpainting-input v-if="config?.action === 'overpainting'" class="mb-4" />
            <underpainting-input v-if="config?.action === 'underpainting'" class="mb-4" />
            <samples-input v-if="config?.action === 'samples'" class="mb-4" />
            <adjust-speed-input v-if="config?.action === 'adjust_speed'" class="mb-4" />
            <advanced-params class="mb-4" />
          </div>
        </el-tab-pane>
        <el-tab-pane :label="$t('suno.mode.custom')" name="custom">
          <div class="pt-2 px-1">
            <type-selector class="mb-4" />
            <upload-audio class="mb-4" />
            <lyric-input v-if="!config?.instrumental" class="mb-4" />
            <style-input class="mb-4" />
            <title-input class="mb-4" />
            <vocal-gender-selector v-if="!config?.instrumental && supportsVocalGender" class="mb-4" />
            <persona-input v-if="supportsPersona" class="mb-4" />
            <extend-from-input v-if="config?.action === 'extend'" class="mb-4" />
            <cover-from-input v-if="config?.action === 'cover'" class="mb-4" />
            <replace-section-input v-if="config?.action === 'replace_section'" class="mb-4" />
            <overpainting-input v-if="config?.action === 'overpainting'" class="mb-4" />
            <underpainting-input v-if="config?.action === 'underpainting'" class="mb-4" />
            <samples-input v-if="config?.action === 'samples'" class="mb-4" />
            <adjust-speed-input v-if="config?.action === 'adjust_speed'" class="mb-4" />
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
          {{ $t('suno.button.clear_all') }}
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
import OverpaintingInput from './config/OverpaintingInput.vue';
import UnderpaintingInput from './config/UnderpaintingInput.vue';
import SamplesInput from './config/SamplesInput.vue';
import AdjustSpeedInput from './config/AdjustSpeedInput.vue';
import PersonaInput from './config/PersonaInput.vue';
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
    OverpaintingInput,
    UnderpaintingInput,
    SamplesInput,
    AdjustSpeedInput,
    PersonaInput,
    FontAwesomeIcon,
    ElButton,
    ElTabs,
    ElTabPane,
    Consumption
  },
  emits: ['generate'],
  computed: {
    config() {
      return this.$store.state.suno?.config;
    },
    mode: {
      get(): 'simple' | 'custom' {
        return this.$store.state.suno?.config?.custom ? 'custom' : 'simple';
      },
      set(val: 'simple' | 'custom') {
        this.$store.commit('suno/setConfig', {
          ...this.$store.state.suno?.config,
          custom: val === 'custom'
        });
      }
    },
    consumption() {
      return getConsumption(this.config, this.service?.cost);
    },
    service() {
      return this.$store.state.suno?.service;
    },
    supportsVocalGender() {
      const model = this.config?.model || '';
      return ['chirp-v4-5-plus', 'chirp-v5', 'chirp-v5-5'].includes(model);
    },
    supportsPersona() {
      const action = this.config?.action;
      return !action || action === 'generate' || action === 'artist_consistency' || action === 'artist_consistency_vox';
    },
    generateButtonText() {
      const action = this.config?.action;
      if (action === 'extend') return this.$t('suno.button.extend');
      if (action === 'cover') return this.$t('suno.button.cover_music');
      if (action === 'remaster') return this.$t('suno.button.remaster');
      if (action === 'replace_section') return this.$t('suno.button.replace_section');
      if (action === 'mashup') return this.$t('suno.button.mashup');
      if (action === 'stems') return this.$t('suno.button.get_stems');
      if (action === 'concat') return this.$t('suno.button.concat_music');
      if (action === 'upload_cover') return this.$t('suno.button.upload_cover');
      if (action === 'artist_consistency') return this.$t('suno.button.artist_consistency');
      if (action === 'artist_consistency_vox') return this.$t('suno.button.artist_consistency_vox');
      if (action === 'overpainting') return this.$t('suno.button.overpainting');
      if (action === 'underpainting') return this.$t('suno.button.underpainting');
      if (action === 'samples') return this.$t('suno.button.samples');
      if (action === 'adjust_speed') return this.$t('suno.button.adjust_speed');
      return this.$t('suno.button.generate');
    }
  },
  methods: {
    onGenerate() {
      this.$emit('generate');
    },
    onClearAll() {
      this.$store.commit('suno/setConfig', {
        custom: false,
        sounds: false,
        instrumental: false,
        lyric: '',
        style: '',
        title: '',
        lyrics_mode: 'manual',
        model: this.$store.state.suno?.config?.model
      });
    }
  }
});
</script>

<style lang="scss" scoped>
.panel {
  height: 100%;
  padding: 20px;
  display: flex;
  flex-direction: column;
  .config {
    width: 100%;
    height: calc(100% - 50px);
    flex: 1;
    position: relative;
  }
  .actions {
    height: 50px;
    display: flex;
    justify-content: center;
    align-items: center;
    .btn {
      width: 100%;
    }
  }
}
</style>
