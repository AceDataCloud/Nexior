<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-y-auto p-[15px]">
      <extend-from-input v-if="config?.video_id || config?.video_url" class="mb-4" />
      <prompt-input class="mb-4" />
      <custom-selector v-if="!config?.video_id" class="mb-4" />
      <upload-video v-if="config?.custom" class="mb-4" />
      <start-image-input v-if="!(config?.video_id || config?.video_url) && !config?.custom" class="mb-4" />
      <end-image-input class="mb-4" />
      <enhancement-selector class="mb-4" />
      <loop-selector class="mb-4" />
    </div>
    <div class="flex flex-col items-center justify-center px-[15px] pb-[15px]">
      <consumption :value="consumption" :service="service" />
      <el-button
        v-if="config?.video_url !== undefined || config?.custom"
        type="primary"
        class="btn w-full"
        round
        @click="onGenerate"
      >
        <font-awesome-icon icon="fa-solid fa-magic" class="mr-2" />
        {{ $t('luma.button.extend') }}
      </el-button>
      <el-button v-else type="primary" class="btn w-full" round @click="onGenerate">
        <font-awesome-icon icon="fa-solid fa-magic" class="mr-2" />
        {{ $t('luma.button.generate') }}
      </el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import EnhancementSelector from './config/EnhancementSelector.vue';
import CustomSelector from './config/CustomSelector.vue';
import LoopSelector from './config/LoopSelector.vue';
import EndImageInput from './config/EndImageInput.vue';
import StartImageInput from './config/StartImageInput.vue';
// @ts-ignore
import UploadVideo from './config/UploadVideo.vue';
import PromptInput from './config/PromptInput.vue';
import ExtendFromInput from './config/ExtendFromInput.vue';
import Consumption from '../common/Consumption.vue';
import { getConsumption } from '@/utils';

export default defineComponent({
  name: 'ConfigPanel',
  components: {
    LoopSelector,
    StartImageInput,
    EndImageInput,
    EnhancementSelector,
    ElButton,
    FontAwesomeIcon,
    PromptInput,
    ExtendFromInput,
    CustomSelector,
    UploadVideo,
    Consumption
  },
  emits: ['generate'],
  computed: {
    config() {
      return this.$store.state.luma?.config;
    },
    consumption() {
      return getConsumption(this.config, this.service?.metadata?.price);
    },
    service() {
      return this.$store.state.luma?.service;
    }
  },
  methods: {
    onGenerate() {
      this.$emit('generate');
    }
  }
});
</script>
