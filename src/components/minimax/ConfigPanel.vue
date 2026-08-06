<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-y-auto p-5">
      <el-form label-position="top">
        <el-form-item :label="$t('minimax.name.model')">
          <el-input model-value="minimax-h3" disabled />
        </el-form-item>
        <el-form-item :label="$t('minimax.name.prompt')">
          <el-input v-model="form.prompt" type="textarea" :rows="4" :placeholder="$t('minimax.placeholder.prompt')" />
        </el-form-item>
        <el-form-item :label="$t('minimax.name.imageUrls')">
          <el-input
            v-model="form.imageText"
            type="textarea"
            :rows="3"
            :placeholder="$t('minimax.placeholder.imageUrls')"
          />
          <div class="hint">{{ $t('minimax.description.imageUrls') }}</div>
        </el-form-item>
        <el-form-item :label="$t('minimax.name.audioUrls')">
          <el-input
            v-model="form.audioText"
            type="textarea"
            :rows="3"
            :placeholder="$t('minimax.placeholder.audioUrls')"
          />
          <div class="hint">{{ $t('minimax.description.audioUrls') }}</div>
        </el-form-item>
        <div class="grid grid-cols-2 gap-3">
          <el-form-item :label="$t('minimax.name.ratio')">
            <el-select v-model="form.ratio" class="w-full">
              <el-option label="16:9" value="16:9" />
              <el-option label="9:16" value="9:16" />
            </el-select>
          </el-form-item>
          <el-form-item :label="$t('minimax.name.duration')">
            <el-input-number v-model="form.duration" :min="4" :max="15" :step="1" class="w-full" />
          </el-form-item>
        </div>
        <el-alert :closable="false" type="info" show-icon>
          {{ $t('minimax.description.mode', { mode: $t(`minimax.mode.${mode}`) }) }}
        </el-alert>
      </el-form>
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
import {
  ElAlert,
  ElButton,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElOption,
  ElSelect
} from 'element-plus';
import Consumption from '../common/Consumption.vue';
import { IMinimaxConfig, IMinimaxMode } from '@/models';
import { getConsumption } from '@/utils';
import { deriveMinimaxMode, parseMinimaxUrls, validateMinimaxConfig } from '@/utils/minimax';

export default defineComponent({
  name: 'MinimaxConfigPanel',
  components: {
    MagicIcon,
    Consumption,
    ElAlert,
    ElButton,
    ElForm,
    ElFormItem,
    ElInput,
    ElInputNumber,
    ElOption,
    ElSelect
  },
  emits: ['generate'],
  data() {
    return {
      form: { prompt: '', imageText: '', audioText: '', ratio: '16:9' as const, duration: 4 }
    };
  },
  computed: {
    imageUrls(): string[] {
      return parseMinimaxUrls(this.form.imageText);
    },
    audioUrls(): string[] {
      return parseMinimaxUrls(this.form.audioText);
    },
    mode(): IMinimaxMode {
      return deriveMinimaxMode(this.imageUrls, this.audioUrls);
    },
    config(): IMinimaxConfig {
      return {
        model: 'minimax-h3',
        prompt: this.form.prompt.trim() || undefined,
        image_urls: this.imageUrls.length ? this.imageUrls : undefined,
        audio_urls: this.audioUrls.length ? this.audioUrls : undefined,
        ratio: this.form.ratio,
        duration: this.form.duration
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
.hint {
  margin-top: 6px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.5;
}
</style>
