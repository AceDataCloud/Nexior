<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-y-auto p-[15px]">
      <video-from-input v-show="config?.action === 'get_1080p'" class="mb-4" />
      <action-selector class="mb-4" />
      <prompt-input v-show="config?.action !== 'get_1080p'" class="mb-4" />
      <model-selector v-show="config?.action !== 'get_1080p'" class="mb-4" />
      <start-end-image v-show="config?.action === 'image2video'" class="mb-2" />
    </div>
    <div class="flex flex-col items-center justify-center px-[15px] pb-[15px]">
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
import VideoFromInput from './config/VideoFromInput.vue';
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
    VideoFromInput
  },
  emits: ['generate'],
  computed: {
    config() {
      return this.$store.state.veo?.config;
    },
    consumption() {
      return getConsumption(this.config, this.service?.metadata?.price);
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
