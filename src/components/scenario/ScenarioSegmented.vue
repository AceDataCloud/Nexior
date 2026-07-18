<template>
  <el-radio-group
    class="scenario-segmented"
    :model-value="modelValue"
    :aria-label="ariaLabel"
    @update:model-value="onUpdate"
  >
    <el-radio-button
      v-for="option in options"
      :key="String(option.value)"
      :value="option.value"
      :disabled="option.disabled"
    >
      {{ option.label }}
    </el-radio-button>
  </el-radio-group>
</template>

<script setup lang="ts">
import { ElRadioButton, ElRadioGroup } from 'element-plus';

export type ScenarioSegmentedValue = string | number;

export interface ScenarioSegmentedOption {
  label: string;
  value: ScenarioSegmentedValue;
  disabled?: boolean;
}

defineProps<{
  modelValue: ScenarioSegmentedValue;
  options: readonly ScenarioSegmentedOption[];
  ariaLabel: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: ScenarioSegmentedValue];
}>();

const onUpdate = (value: string | number | boolean | undefined) => {
  if (typeof value === 'string' || typeof value === 'number') {
    emit('update:modelValue', value);
  }
};
</script>

<style lang="scss" scoped>
.scenario-segmented {
  display: flex;
  width: 100%;
}

.scenario-segmented :deep(.el-radio-button) {
  flex: 1;
  min-width: 0;
}

.scenario-segmented :deep(.el-radio-button__inner) {
  width: 100%;
  min-height: 40px;
  padding: 8px 12px;
  overflow: hidden;
  line-height: 22px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
