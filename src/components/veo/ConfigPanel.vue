<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-y-auto p-5">
      <action-selector class="mb-5" />

      <model-selector class="mb-4" />
      <start-end-image
        v-if="showsImages"
        :key="config?.action"
        class="mb-4"
        :limit="imageLimit"
        :ingredients="config?.action === 'ingredients2video'"
      />
      <prompt-input class="mb-4" />
      <aspect-ratio-selector class="mb-4" />
      <translation-selector class="mb-2" />
    </div>
    <div class="flex flex-col items-center justify-center px-5 pb-5">
      <consumption :value="consumption" :service="service" />
      <el-button type="primary" class="btn w-full" round @click="onGenerate">
        <font-awesome-icon icon="fa-solid fa-magic" class="mr-2" />
        {{ $t('veo.button.generate') }}
      </el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import ModelSelector from './config/ModelSelector.vue';
import ActionSelector from './config/ActionSelector.vue';
import TranslationSelector from './config/TranslationSelector.vue';
import AspectRatioSelector from './config/AspectRatioSelector.vue';
import StartEndImage from './config/StartEndImage.vue';
import Consumption from '../common/Consumption.vue';
import PromptInput from './config/PromptInput.vue';
import { getConsumption } from '@/utils';

export default defineComponent({
  name: 'ConfigPanel',
  components: {
    ElButton,
    Consumption,
    FontAwesomeIcon,
    PromptInput,
    ModelSelector,
    StartEndImage,
    ActionSelector,
    TranslationSelector,
    AspectRatioSelector
  },
  emits: ['generate'],
  computed: {
    config() {
      return this.$store.state.veo?.config;
    },
    showsImages() {
      return this.config?.action === 'image2video' || this.config?.action === 'ingredients2video';
    },
    imageLimit() {
      return this.config?.action === 'ingredients2video' ? 3 : 2;
    },
    consumption() {
      return getConsumption(this.config, this.service?.cost);
    },
    service() {
      return this.$store.state.veo?.service;
    }
  },
  methods: {
    onGenerate() {
      this.$emit('generate');
    }
  }
});
</script>
