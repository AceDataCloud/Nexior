<template>
  <div class="resolution">
    <div class="field">
      <div class="label">
        <div class="box">
          <h2 class="title font-bold">{{ $t('openaiimage.name.size') }}</h2>
          <info-icon :content="$t('openaiimage.description.size')" class="info" />
        </div>
      </div>
      <el-select
        v-model="presetValue"
        class="value"
        :placeholder="$t('openaiimage.placeholder.select')"
        :disabled="useCustom"
      >
        <el-option-group v-for="group in presetGroups" :key="group.label" :label="group.label">
          <el-option v-for="item in group.options" :key="item" :label="item" :value="item" />
        </el-option-group>
      </el-select>
    </div>
    <template v-if="customSupported">
      <div class="field custom-toggle">
        <div class="label">
          <div class="box">
            <h2 class="title font-bold">{{ $t('openaiimage.name.customSize') }}</h2>
            <info-icon :content="$t('openaiimage.description.customSize')" class="info" />
          </div>
        </div>
        <el-switch v-model="useCustom" class="value-switch" />
      </div>
      <div v-if="useCustom" class="custom-inputs">
        <div class="row">
          <span class="row-label">{{ $t('openaiimage.name.width') }}</span>
          <el-input-number
            v-model="customWidth"
            class="row-input"
            :min="minSide"
            :max="maxSide"
            :step="multiple"
            :step-strictly="true"
            controls-position="right"
          />
        </div>
        <div class="row">
          <span class="row-label">{{ $t('openaiimage.name.height') }}</span>
          <el-input-number
            v-model="customHeight"
            class="row-input"
            :min="minSide"
            :max="maxSide"
            :step="multiple"
            :step-strictly="true"
            controls-position="right"
          />
        </div>
        <div v-if="customError" class="error">{{ customError }}</div>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSelect, ElOption, ElOptionGroup, ElSwitch, ElInputNumber } from 'element-plus';
import InfoIcon from '@/components/common/InfoIcon.vue';
import {
  OPENAIIMAGE_CUSTOM_SIZE_MAX,
  OPENAIIMAGE_CUSTOM_SIZE_MAX_PIXELS,
  OPENAIIMAGE_CUSTOM_SIZE_MIN,
  OPENAIIMAGE_CUSTOM_SIZE_MODELS,
  OPENAIIMAGE_CUSTOM_SIZE_MULTIPLE,
  OPENAIIMAGE_DEFAULT_MODEL,
  OPENAIIMAGE_MODEL_GPT_IMAGE_2,
  OPENAIIMAGE_MODEL_SIZES,
  OPENAIIMAGE_SIZE_1024,
  OPENAIIMAGE_SIZES_GPT_IMAGE_2_1K,
  OPENAIIMAGE_SIZES_GPT_IMAGE_2_2K,
  OPENAIIMAGE_SIZES_GPT_IMAGE_2_4K
} from '@/constants';

interface IGroup {
  label: string;
  options: string[];
}

interface IData {
  customWidth: number;
  customHeight: number;
}

function parseSize(size: string | undefined): { w: number; h: number } | undefined {
  if (!size) return undefined;
  const m = /^(\d+)x(\d+)$/.exec(size);
  if (!m) return undefined;
  return { w: Number(m[1]), h: Number(m[2]) };
}

export default defineComponent({
  name: 'OpenAIImageSizeSelector',
  components: {
    ElSelect,
    ElOption,
    ElOptionGroup,
    ElSwitch,
    ElInputNumber,
    InfoIcon
  },
  data(): IData {
    return {
      customWidth: 1024,
      customHeight: 1024
    };
  },
  computed: {
    model(): string {
      return this.$store.state.openaiimage?.config?.model || OPENAIIMAGE_DEFAULT_MODEL;
    },
    storedSize(): string | undefined {
      return this.$store.state.openaiimage?.config?.size;
    },
    customSupported(): boolean {
      return OPENAIIMAGE_CUSTOM_SIZE_MODELS.includes(this.model);
    },
    presets(): string[] {
      return OPENAIIMAGE_MODEL_SIZES[this.model] ?? OPENAIIMAGE_MODEL_SIZES[OPENAIIMAGE_DEFAULT_MODEL] ?? [];
    },
    presetGroups(): IGroup[] {
      if (this.model === OPENAIIMAGE_MODEL_GPT_IMAGE_2) {
        return [
          { label: this.$t('openaiimage.sizeGroup.standard1k'), options: OPENAIIMAGE_SIZES_GPT_IMAGE_2_1K },
          { label: this.$t('openaiimage.sizeGroup.preset2k'), options: OPENAIIMAGE_SIZES_GPT_IMAGE_2_2K },
          { label: this.$t('openaiimage.sizeGroup.preset4k'), options: OPENAIIMAGE_SIZES_GPT_IMAGE_2_4K }
        ];
      }
      return [{ label: this.$t('openaiimage.sizeGroup.standard1k'), options: this.presets }];
    },
    useCustom: {
      get(): boolean {
        if (!this.customSupported) return false;
        const size = this.storedSize;
        if (!size) return false;
        return !this.presets.includes(size);
      },
      set(val: boolean) {
        if (val) {
          this.commitSize(`${this.customWidth}x${this.customHeight}`);
        } else {
          const fallback = this.presets[0] ?? OPENAIIMAGE_SIZE_1024;
          this.commitSize(fallback);
        }
      }
    },
    presetValue: {
      get(): string {
        const size = this.storedSize;
        if (size && this.presets.includes(size)) return size;
        return this.presets[0] ?? OPENAIIMAGE_SIZE_1024;
      },
      set(val: string) {
        this.commitSize(val);
      }
    },
    multiple(): number {
      return OPENAIIMAGE_CUSTOM_SIZE_MULTIPLE;
    },
    minSide(): number {
      return OPENAIIMAGE_CUSTOM_SIZE_MIN;
    },
    maxSide(): number {
      return OPENAIIMAGE_CUSTOM_SIZE_MAX;
    },
    customError(): string {
      const w = this.customWidth;
      const h = this.customHeight;
      if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
        return this.$t('openaiimage.error.customSizePositive') as string;
      }
      if (w % this.multiple !== 0 || h % this.multiple !== 0) {
        return this.$t('openaiimage.error.customSizeMultiple', { multiple: this.multiple }) as string;
      }
      if (w < this.minSide || h < this.minSide) {
        return this.$t('openaiimage.error.customSizeMin', { min: this.minSide }) as string;
      }
      if (Math.max(w, h) > this.maxSide) {
        return this.$t('openaiimage.error.customSizeMax', { max: this.maxSide }) as string;
      }
      if (w * h > OPENAIIMAGE_CUSTOM_SIZE_MAX_PIXELS) {
        return this.$t('openaiimage.error.customSizePixels', {
          pixels: OPENAIIMAGE_CUSTOM_SIZE_MAX_PIXELS.toLocaleString()
        }) as string;
      }
      return '';
    }
  },
  watch: {
    model: {
      immediate: false,
      handler() {
        // When switching to a model whose preset list doesn't include the
        // current size and which doesn't support custom, snap to the model's
        // first preset to avoid sending a size the model rejects.
        const size = this.storedSize;
        if (!size) {
          this.commitSize(this.presets[0] ?? OPENAIIMAGE_SIZE_1024);
          return;
        }
        if (this.presets.includes(size)) return;
        if (this.customSupported && parseSize(size)) {
          const parsed = parseSize(size);
          if (parsed) {
            this.customWidth = parsed.w;
            this.customHeight = parsed.h;
          }
          return;
        }
        this.commitSize(this.presets[0] ?? OPENAIIMAGE_SIZE_1024);
      }
    },
    customWidth() {
      this.syncCustomToStore();
    },
    customHeight() {
      this.syncCustomToStore();
    }
  },
  mounted() {
    if (!this.storedSize) {
      this.commitSize(this.presets[0] ?? OPENAIIMAGE_SIZE_1024);
      return;
    }
    const parsed = parseSize(this.storedSize);
    if (parsed && !this.presets.includes(this.storedSize) && this.customSupported) {
      this.customWidth = parsed.w;
      this.customHeight = parsed.h;
    }
  },
  methods: {
    commitSize(size: string) {
      this.$store.commit('openaiimage/setConfig', {
        ...this.$store.state.openaiimage?.config,
        size
      });
    },
    syncCustomToStore() {
      if (!this.useCustom) return;
      if (this.customError) return;
      this.commitSize(`${this.customWidth}x${this.customHeight}`);
    }
  }
});
</script>

<style lang="scss" scoped>
.resolution {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;

  .label {
    width: 30%;
    display: flex;
    align-items: center;

    .box {
      display: flex;
      flex-direction: row;
      align-items: center;

      .title {
        font-size: 14px;
        margin: 0;
      }

      .info {
        margin-left: 6px;
      }
    }
  }

  .value {
    width: 160px;
  }
}

.custom-toggle .value-switch {
  margin-right: 4px;
}

.custom-inputs {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-left: 30%;

  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;

    .row-label {
      font-size: 13px;
      color: var(--el-text-color-regular);
    }

    .row-input {
      width: 160px;
    }
  }

  .error {
    color: var(--el-color-danger);
    font-size: 12px;
    margin-top: 2px;
  }
}
</style>
