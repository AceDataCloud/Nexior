<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-y-auto p-5 space-y-4">
      <div>
        <b>{{ $t('qwenimage.name.model') }}</b
        ><el-select v-model="model" class="w-full"
          ><el-option value="qwen-image-3.0" label="qwen-image-3.0" /><el-option
            value="qwen-image-3.0-pro"
            label="qwen-image-3.0-pro"
        /></el-select>
      </div>
      <prompt-input /><image-input />
      <div>
        <b>{{ $t('qwenimage.name.size') }}</b
        ><el-input v-model="size" placeholder="1024*1024" />
      </div>
      <div>
        <b>{{ $t('qwenimage.name.count') }}</b
        ><el-input-number v-model="n" :min="1" :max="6" />
      </div>
      <el-checkbox v-model="thinking">{{ $t('qwenimage.name.thinking') }}</el-checkbox>
    </div>
    <div class="px-5 pb-5">
      <service-pricing-summary :value="consumption" :service="service" /><el-button
        type="primary"
        class="w-full"
        round
        @click="$emit('generate')"
        >{{ $t('qwenimage.button.generate') }}</el-button
      >
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton, ElSelect, ElOption, ElInput, ElInputNumber, ElCheckbox } from 'element-plus';
import PromptInput from './config/PromptInput.vue';
import ImageInput from './config/ImageInput.vue';
import ServicePricingSummary from '../common/ServicePricingSummary.vue';
import { getConsumption } from '@/utils';
import { buildQwenImageRequest } from '@/utils/qwenimage/request';
export default defineComponent({
  name: 'QwenImageConfigPanel',
  components: {
    ElButton,
    ElSelect,
    ElOption,
    ElInput,
    ElInputNumber,
    ElCheckbox,
    PromptInput,
    ImageInput,
    ServicePricingSummary
  },
  emits: ['generate'],
  computed: {
    config() {
      return this.$store.state.qwenimage?.config;
    },
    service() {
      return this.$store.state.qwenimage?.service;
    },
    consumption() {
      return getConsumption(buildQwenImageRequest(this.config), this.service?.cost);
    },
    model: {
      get(): string {
        return this.config?.model || 'qwen-image-3.0';
      },
      set(model: string) {
        this.set({ model });
      }
    },
    size: {
      get(): string {
        return this.config?.size || '1024*1024';
      },
      set(size: string) {
        this.set({ size });
      }
    },
    n: {
      get(): number {
        return this.config?.n || 1;
      },
      set(n: number) {
        this.set({ n });
      }
    },
    thinking: {
      get(): boolean {
        return this.config?.enable_thinking !== false;
      },
      set(enable_thinking: boolean) {
        this.set({ enable_thinking });
      }
    }
  },
  methods: {
    set(value: object) {
      this.$store.commit('qwenimage/setConfig', { ...this.config, ...value });
    }
  }
});
</script>
