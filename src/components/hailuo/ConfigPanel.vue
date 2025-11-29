<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-y-auto p-[15px]">
      <prompt-input class="mb-4" />
      <model-selector class="mb-4" />
      <start-image-url-input v-if="config?.model === 'minimax-i2v'" class="mb-2" />
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
        {{ $t('hailuo.button.extend') }}
      </el-button>
      <el-button v-else type="primary" class="btn w-full" round @click="onGenerate">
        <font-awesome-icon icon="fa-solid fa-magic" class="mr-2" />
        {{ $t('hailuo.button.generate') }}
      </el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import ModelSelector from './config/ModelSelector.vue';
import StartImageUrlInput from './config/StartImageUrlInput.vue';
import PromptInput from './config/PromptInput.vue';
import Consumption from '../common/Consumption.vue';
import { getConsumption } from '@/utils';

export default defineComponent({
  name: 'PresetPanel',
  components: {
    ElButton,
    FontAwesomeIcon,
    PromptInput,
    StartImageUrlInput,
    ModelSelector,
    Consumption
  },
  emits: ['generate'],
  computed: {
    config() {
      return this.$store.state.hailuo?.config;
    },
    consumption() {
      return getConsumption(this.config, this.service?.cost);
    },
    service() {
      return this.$store.state.hailuo?.service;
    }
  },
  methods: {
    onGenerate() {
      this.$emit('generate');
    }
  }
});
</script>
