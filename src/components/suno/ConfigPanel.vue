<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-y-auto p-[15px]">
      <type-selector class="mb-4" />
      <upload-audio class="mb-4" />
      <prompt-input v-if="!config?.custom" class="mb-4" />
      <lyric-input v-if="config?.custom && !config.instrumental" class="mb-4" />
      <style-input v-if="config?.custom" class="mb-4" />
      <title-input v-if="config?.custom" class="mb-4" />
      <extend-from-input v-if="config?.action === 'extend'" class="mb-4" />
      <cover-from-input v-if="config?.action === 'cover'" class="mb-4" />
    </div>
    <div class="flex flex-col items-center justify-center px-[15px] pb-[15px]">
      <consumption :value="consumption" :service="service" />
      <el-button v-if="config?.action !== 'extend'" type="primary" class="btn w-full" round @click="onGenerate">
        <font-awesome-icon icon="fa-solid fa-magic" class="mr-2" />
        {{ $t('suno.button.generate') }}
      </el-button>
      <el-button v-else type="primary" class="btn w-full" round @click="onGenerate">
        <font-awesome-icon icon="fa-solid fa-magic" class="mr-2" />
        {{ $t('suno.button.extend') }}
      </el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton } from 'element-plus';
import TypeSelector from './config/TypeSelector.vue';
import UploadAudio from './config/UploadAudio.vue';
import PromptInput from './config/PromptInput.vue';
import LyricInput from './config/LyricInput.vue';
import StyleInput from './config/StyleInput.vue';
import TitleInput from './config/TitleInput.vue';
import ExtendFromInput from './config/ExtendFromInput.vue';
import CoverFromInput from './config/CoverFromInput.vue';
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
    FontAwesomeIcon,
    ElButton,
    Consumption
  },
  emits: ['generate'],
  computed: {
    config() {
      return this.$store.state.suno?.config;
    },
    consumption() {
      return getConsumption(this.config, this.service?.metadata?.price);
    },
    service() {
      return this.$store.state.suno?.service;
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
.panel {
  height: 100%;
  padding: 15px;
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
