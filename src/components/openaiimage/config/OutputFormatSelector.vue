<template>
  <div v-if="visible">
    <div class="field">
      <div class="label">
        <h2 class="title font-bold">{{ $t('openaiimage.name.outputFormat') }}</h2>
        <info-icon :content="$t('openaiimage.description.outputFormat')" class="info" />
      </div>
      <el-select v-model="format" class="value">
        <el-option
          v-for="item in formats"
          :key="item"
          :value="item"
          :label="item === 'gif' ? $t('openaiimage.format.gif') : item.toUpperCase()"
        />
      </el-select>
    </div>
    <template v-if="format === 'gif'">
      <p class="hint">{{ $t('openaiimage.description.gifSize') }}</p>
      <div class="field">
        <h2 class="title font-bold">{{ $t('openaiimage.name.frameCount') }}</h2>
        <el-input-number v-model="frameCount" class="value" :min="1" :precision="0" controls-position="right" />
      </div>
      <div class="field">
        <h2 class="title font-bold">{{ $t('openaiimage.name.frameDuration') }}</h2>
        <el-input-number
          v-model="frameDuration"
          class="value"
          :min="1"
          :step="10"
          :precision="0"
          controls-position="right"
        />
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElInputNumber, ElOption, ElSelect } from 'element-plus';
import InfoIcon from '@/components/common/InfoIcon.vue';
import { isOpenAIImage26Model, OPENAIIMAGE_GIF_MODELS, OPENAIIMAGE_GIF_SIZE, OPENAIIMAGE_SIZE_AUTO } from '@/constants';
import type { IOpenAIImageConfig, OpenAIImageOutputFormat } from '@/models';

export default defineComponent({
  name: 'OpenAIImageOutputFormatSelector',
  components: { ElInputNumber, ElOption, ElSelect, InfoIcon },
  data() {
    return { previousRasterSize: undefined as string | undefined };
  },
  computed: {
    config(): IOpenAIImageConfig {
      return this.$store.state.openaiimage?.config || {};
    },
    model(): string {
      return this.config.model || '';
    },
    visible(): boolean {
      return isOpenAIImage26Model(this.model);
    },
    formats(): OpenAIImageOutputFormat[] {
      const formats: OpenAIImageOutputFormat[] = ['png', 'jpeg', 'webp'];
      return OPENAIIMAGE_GIF_MODELS.includes(this.model) ? [...formats, 'gif'] : formats;
    },
    format: {
      get(): OpenAIImageOutputFormat {
        return this.config.output_format || 'png';
      },
      set(value: OpenAIImageOutputFormat) {
        if (!this.formats.includes(value)) return;
        const previous = this.config.output_format;
        const next: IOpenAIImageConfig = { ...this.config, output_format: value };
        if (value === 'gif') {
          if (previous !== 'gif') this.previousRasterSize = this.config.size;
          next.size = OPENAIIMAGE_GIF_SIZE;
          next.frame_count = this.config.frame_count || 9;
          next.frame_duration_ms = this.config.frame_duration_ms || 200;
        } else {
          next.frame_count = undefined;
          next.frame_duration_ms = undefined;
          if (previous === 'gif') next.size = this.previousRasterSize || OPENAIIMAGE_SIZE_AUTO;
        }
        this.$store.commit('openaiimage/setConfig', next);
      }
    },
    frameCount: {
      get(): number {
        return this.config.frame_count || 9;
      },
      set(value: number | undefined) {
        this.$store.commit('openaiimage/setConfig', { ...this.config, frame_count: value || 9 });
      }
    },
    frameDuration: {
      get(): number {
        return this.config.frame_duration_ms || 200;
      },
      set(value: number | undefined) {
        this.$store.commit('openaiimage/setConfig', { ...this.config, frame_duration_ms: value || 200 });
      }
    }
  },
  watch: {
    model: {
      immediate: true,
      handler() {
        const format = this.config.output_format;
        if (!format || (this.visible && this.formats.includes(format))) return;
        this.previousRasterSize = undefined;
        this.$store.commit('openaiimage/setConfig', {
          ...this.config,
          output_format: this.visible ? 'png' : undefined,
          frame_count: undefined,
          frame_duration_ms: undefined,
          size: this.config.size === OPENAIIMAGE_GIF_SIZE ? OPENAIIMAGE_SIZE_AUTO : this.config.size
        });
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.field {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
}
.label {
  display: flex;
  align-items: center;
  gap: 6px;
}
.title {
  font-size: 14px;
  margin: 0;
}
.value {
  width: 160px;
  flex-shrink: 0;
}
.hint {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.5;
  margin: 8px 0 12px;
}
</style>
