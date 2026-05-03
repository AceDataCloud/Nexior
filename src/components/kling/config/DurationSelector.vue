<template>
  <div class="field">
    <div class="header">
      <h2 class="title font-bold">{{ $t('kling.name.duration') }}</h2>
      <info-icon :content="$t('kling.description.duration')" class="info-icon" />
    </div>
    <el-select v-model="value" class="value" :placeholder="$t('kling.placeholder.select')">
      <el-option
        v-for="item in options"
        :key="item.value"
        :label="item.label"
        :value="item.value"
        :disabled="item.disabled"
      >
        <span :class="{ 'opt-disabled': item.disabled }">{{ item.label }}</span>
        <span v-if="item.disabled" class="opt-tip">
          {{ $t('kling.description.durationV3Only') }}
        </span>
      </el-option>
    </el-select>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSelect, ElOption } from 'element-plus';
import InfoIcon from '@/components/common/InfoIcon.vue';
import { KLING_DEFAULT_DURATION, KLING_V3_MODELS } from '@/constants';

const ALL_DURATIONS: { value: number; label: string; v3Only: boolean }[] = [
  { value: 3, label: '3s', v3Only: true },
  { value: 5, label: '5s', v3Only: false },
  { value: 8, label: '8s', v3Only: true },
  { value: 10, label: '10s', v3Only: false },
  { value: 12, label: '12s', v3Only: true },
  { value: 15, label: '15s', v3Only: true }
];

export default defineComponent({
  name: 'DurationSelector',
  components: {
    ElSelect,
    ElOption,
    InfoIcon
  },
  props: {
    modelValue: {
      type: String,
      default: undefined
    }
  },
  emits: ['update:modelValue'],
  computed: {
    selectedModel(): string {
      return this.$store.state.kling?.config?.model || '';
    },
    isV3Model(): boolean {
      return KLING_V3_MODELS.includes(this.selectedModel);
    },
    options() {
      return ALL_DURATIONS.map((d) => ({
        ...d,
        disabled: d.v3Only && !this.isV3Model
      }));
    },
    value: {
      get(): number | undefined {
        return this.$store.state.kling?.config?.duration;
      },
      set(val: number) {
        this.$store.commit('kling/setConfig', {
          ...this.$store.state.kling.config,
          duration: val
        });
      }
    }
  },
  watch: {
    isV3Model(_: boolean) {
      // Auto-correct if the currently selected duration becomes disabled.
      const current = this.value;
      const enabled = this.options.filter((o) => !o.disabled).map((o) => o.value);
      if (current !== undefined && !enabled.includes(current)) {
        this.value = KLING_DEFAULT_DURATION;
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = KLING_DEFAULT_DURATION;
    }
  }
});
</script>

<style lang="scss" scoped>
.field {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;

  .header {
    display: flex;
    flex-direction: row;
    align-items: center;
    width: 50%;

    .title {
      font-size: 14px;
      margin: 0;
    }
  }
  .value {
    width: 120px;
  }
}
.opt-disabled {
  color: var(--el-text-color-disabled);
}
.opt-tip {
  margin-left: 8px;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}
</style>
