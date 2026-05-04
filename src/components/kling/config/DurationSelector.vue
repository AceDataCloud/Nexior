<template>
  <div class="field">
    <div class="header">
      <h2 class="title font-bold">{{ $t('kling.name.duration') }}</h2>
      <info-icon :content="$t('kling.description.duration')" class="info-icon ml-1" />
      <span class="value-display">{{ value }}s</span>
    </div>
    <el-slider
      :key="revertKey"
      :model-value="sliderValue"
      class="slider"
      :min="sliderMin"
      :max="sliderMax"
      :step="sliderStep"
      :marks="marks"
      :show-tooltip="false"
      @change="onChange"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSlider, ElMessage, ElMessageBox } from 'element-plus';
import InfoIcon from '@/components/common/InfoIcon.vue';
import { KLING_DEFAULT_DURATION, KLING_V3_MODELS } from '@/constants';
import { findKlingConflicts, clearKlingConflicts } from '@/utils/kling/capabilities';

const V3_VALUES = [3, 5, 8, 10, 12, 15];
const STANDARD_VALUES = [5, 10];

export default defineComponent({
  name: 'DurationSelector',
  components: {
    ElSlider,
    InfoIcon
  },
  props: {
    modelValue: {
      type: Number,
      default: undefined
    }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      revertKey: 0
    };
  },
  computed: {
    selectedModel(): string {
      return this.$store.state.kling?.config?.model || '';
    },
    isV3Model(): boolean {
      return KLING_V3_MODELS.includes(this.selectedModel);
    },
    sliderMin(): number {
      return this.isV3Model ? 3 : 5;
    },
    sliderMax(): number {
      return this.isV3Model ? 15 : 10;
    },
    sliderStep(): number {
      return this.isV3Model ? 1 : 5;
    },
    marks() {
      const values = this.isV3Model ? V3_VALUES : STANDARD_VALUES;
      const m: Record<number, string> = {};
      for (const v of values) m[v] = `${v}s`;
      return m;
    },
    value(): number {
      return this.$store.state.kling?.config?.duration ?? KLING_DEFAULT_DURATION;
    },
    sliderValue(): number {
      const v = this.value;
      if (v < this.sliderMin) return this.sliderMin;
      if (v > this.sliderMax) return this.sliderMax;
      return v;
    }
  },
  watch: {
    isV3Model(_: boolean) {
      const valid = this.isV3Model ? V3_VALUES : STANDARD_VALUES;
      if (!valid.includes(this.value)) {
        this.applyDuration(KLING_DEFAULT_DURATION);
      }
    }
  },
  mounted() {
    if (!this.$store.state.kling?.config?.duration) {
      this.applyDuration(KLING_DEFAULT_DURATION);
    }
  },
  methods: {
    async onChange(raw: number | number[]) {
      // ElSlider supports range mode (number[]); we only use single mode.
      const val = Array.isArray(raw) ? raw[0] : raw;
      const config = this.$store.state.kling?.config || {};
      const conflicts = findKlingConflicts(config, { duration: val });
      if (conflicts.length === 0) {
        this.applyDuration(val);
        return;
      }
      const fields = conflicts.map((c) => this.$t(c.i18nLabel)).join('、');
      try {
        await ElMessageBox.confirm(
          this.$t('kling.message.featureNotSupportedBody', { fields }),
          this.$t('kling.message.featureNotSupportedTitle'),
          {
            confirmButtonText: this.$t('kling.button.confirmContinue'),
            cancelButtonText: this.$t('kling.button.cancelSwitch'),
            type: 'warning'
          }
        );
        const cleared = clearKlingConflicts({ ...config, duration: val }, conflicts);
        this.$store.commit('kling/setConfig', cleared);
        ElMessage.success(this.$t('kling.message.featureRemovedNotice', { fields }));
      } catch {
        // User cancelled — repaint slider with the previous value.
        this.revertKey += 1;
      }
    },
    applyDuration(val: number) {
      this.$store.commit('kling/setConfig', {
        ...this.$store.state.kling.config,
        duration: val
      });
    }
  }
});
</script>

<style lang="scss" scoped>
.field {
  display: flex;
  flex-direction: column;

  .header {
    display: flex;
    flex-direction: row;
    align-items: center;

    .title {
      font-size: 14px;
      margin: 0;
    }
    .value-display {
      margin-left: auto;
      font-size: 13px;
      font-weight: 600;
      color: var(--el-color-primary);
      min-width: 40px;
      text-align: right;
    }
  }
  .slider {
    margin: 4px 8px 18px;
  }
}
</style>
