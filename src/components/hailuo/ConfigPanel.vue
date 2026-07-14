<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-y-auto p-5">
      <prompt-input class="mb-4" />
      <model-selector class="mb-4" />
      <start-image-url-input v-if="config?.model === 'minimax-i2v'" class="mb-4" />
    </div>
    <div class="flex flex-col items-center justify-center px-5 pb-5">
      <consumption :value="consumption" :service="service" />
      <el-button
        v-if="config?.video_url !== undefined || config?.custom"
        type="primary"
        class="btn w-full"
        round
        @click="onGenerate"
      >
        <magic-icon class="mr-2" :size="'1em' as any" aria-hidden="true" focusable="false" />
        {{ $t('hailuo.button.extend') }}
      </el-button>
      <el-button v-else type="primary" class="btn w-full" round @click="onGenerate">
        <magic-icon class="mr-2" :size="'1em' as any" aria-hidden="true" focusable="false" />
        {{ $t('hailuo.button.generate') }}
      </el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { MagicIcon } from '@acedatacloud/core/icons/components';
import { defineComponent } from 'vue';
import { ElButton } from 'element-plus';
import ModelSelector from './config/ModelSelector.vue';
import StartImageUrlInput from './config/StartImageUrlInput.vue';
import PromptInput from './config/PromptInput.vue';
import Consumption from '../common/Consumption.vue';
import { getConsumption } from '@/utils';

export default defineComponent({
  name: 'PresetPanel',
  components: {
    MagicIcon,
    ElButton,
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
