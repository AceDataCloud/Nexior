<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-y-auto p-5">
      <div class="mb-4">
        <field-title :title="$t('minimax.name.model')" :description="$t('minimax.description.model')" />
        <el-input model-value="minimax-h3" disabled />
      </div>
      <prompt-textarea
        v-model="form.prompt"
        class="mb-4"
        :title="$t('minimax.name.prompt')"
        :info="$t('minimax.description.prompt')"
        :placeholder="$t('minimax.placeholder.prompt')"
        :min-rows="4"
      />
      <reference-media-input
        v-model="form.imageUrls"
        class="mb-4"
        kind="image"
        :title="$t('minimax.name.referenceImages')"
        :description="$t('minimax.description.referenceImages')"
        :limit="9"
      />
      <reference-media-input
        v-model="form.audioUrls"
        class="mb-4"
        kind="audio"
        :title="$t('minimax.name.referenceAudios')"
        :description="$t('minimax.description.referenceAudios')"
        :limit="3"
      />
      <div class="mb-4">
        <field-title :title="$t('minimax.name.resolution')" :description="$t('minimax.description.resolution')" />
        <div class="option-grid">
          <button
            v-for="resolution in resolutions"
            :key="resolution"
            type="button"
            class="option-button"
            :class="{ active: form.resolution === resolution }"
            :aria-pressed="form.resolution === resolution"
            @click="form.resolution = resolution"
          >
            {{ resolution }}
          </button>
        </div>
      </div>
      <div class="mb-4">
        <field-title :title="$t('minimax.name.ratio')" :description="$t('minimax.description.ratio')" />
        <div class="option-grid">
          <button
            v-for="ratio in ratios"
            :key="ratio.value"
            type="button"
            class="ratio-button"
            :class="{ active: form.ratio === ratio.value }"
            :aria-pressed="form.ratio === ratio.value"
            @click="form.ratio = ratio.value"
          >
            <span class="ratio-preview" :style="{ width: ratio.width, height: ratio.height }" aria-hidden="true" />
            <span>{{ ratio.value }}</span>
          </button>
        </div>
      </div>
      <div class="setting-row mb-4">
        <field-title inline :title="$t('minimax.name.duration')" :description="$t('minimax.description.duration')" />
        <el-input-number v-model="form.duration" :min="4" :max="15" :step="1" controls-position="right" />
      </div>
      <div class="setting-row">
        <field-title inline :title="$t('minimax.name.watermark')" :description="$t('minimax.description.watermark')" />
        <el-switch v-model="form.aigcWatermark" />
      </div>
    </div>
    <div class="flex flex-col items-center justify-center px-5 pb-5">
      <consumption :value="consumption" :service="service" />
      <el-button type="primary" class="btn w-full" round @click="onGenerate">
        <magic-icon class="mr-2" :size="'1em' as any" aria-hidden="true" focusable="false" />
        {{ $t('minimax.button.generate') }}
      </el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { MagicIcon } from '@acedatacloud/core/icons/components';
import { defineComponent } from 'vue';
import { ElButton, ElInput, ElInputNumber, ElMessage, ElSwitch } from 'element-plus';
import PromptTextarea from '@/components/common/PromptTextarea.vue';
import FieldTitle from './config/FieldTitle.vue';
import ReferenceMediaInput from './config/ReferenceMediaInput.vue';
import Consumption from '../common/Consumption.vue';
import { IMinimaxConfig } from '@/models';
import { getConsumption } from '@/utils';
import { validateMinimaxConfig } from '@/utils/minimax';

export default defineComponent({
  name: 'MinimaxConfigPanel',
  components: {
    MagicIcon,
    Consumption,
    ElButton,
    ElInput,
    ElInputNumber,
    ElSwitch,
    FieldTitle,
    PromptTextarea,
    ReferenceMediaInput
  },
  emits: ['generate'],
  data() {
    return {
      form: {
        prompt: '',
        imageUrls: [] as string[],
        audioUrls: [] as string[],
        resolution: '2K' as '768P' | '2K',
        ratio: '16:9' as '16:9' | '9:16',
        duration: 4,
        aigcWatermark: false
      },
      resolutions: ['768P', '2K'] as const,
      ratios: [
        { value: '16:9' as const, width: '32px', height: '18px' },
        { value: '9:16' as const, width: '18px', height: '32px' }
      ]
    };
  },
  computed: {
    config(): IMinimaxConfig {
      return {
        model: 'minimax-h3',
        prompt: this.form.prompt.trim() || undefined,
        image_urls: this.form.imageUrls.length ? this.form.imageUrls : undefined,
        audio_urls: this.form.audioUrls.length ? this.form.audioUrls : undefined,
        resolution: this.form.resolution,
        ratio: this.form.ratio,
        duration: this.form.duration,
        aigc_watermark: this.form.aigcWatermark
      };
    },
    consumption() {
      return getConsumption(this.config, this.service?.cost);
    },
    service() {
      return this.$store.state.minimax?.service;
    }
  },
  watch: {
    config: {
      handler(value: IMinimaxConfig) {
        this.$store.commit('minimax/setConfig', value);
      },
      deep: true,
      immediate: true
    }
  },
  methods: {
    onGenerate() {
      const error = validateMinimaxConfig(this.config);
      if (error) {
        ElMessage.warning(this.$t(`minimax.message.${error}`));
        return;
      }
      this.$emit('generate');
    }
  }
});
</script>

<style scoped>
.option-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.option-button,
.ratio-button {
  min-height: 36px;
  color: var(--el-text-color-regular);
  font-size: 13px;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
  cursor: pointer;
  transition:
    color 0.15s ease,
    border-color 0.15s ease,
    background-color 0.15s ease;
}

.option-button:hover,
.ratio-button:hover {
  border-color: var(--el-border-color-hover);
  background: var(--el-fill-color);
}

.option-button.active,
.ratio-button.active {
  color: var(--el-color-primary);
  font-weight: 600;
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.ratio-button {
  display: flex;
  min-height: 64px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.ratio-preview {
  display: block;
  border: 1.5px solid currentColor;
  border-radius: 2px;
}

.setting-row {
  display: flex;
  min-height: 40px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.setting-row :deep(.el-input-number) {
  width: 100px;
}
</style>
