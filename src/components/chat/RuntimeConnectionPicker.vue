<template>
  <div class="runtime-connection-picker">
    <el-popover placement="top-start" trigger="click" :width="300" @show="load">
      <template #reference>
        <el-button size="small" :disabled="disabled"
          >{{ $t('chat.runtime.connections')
          }}<span v-if="modelValue.length"> ({{ modelValue.length }})</span></el-button
        >
      </template>
      <p>{{ $t('chat.runtime.scope') }}</p>
      <p v-if="error" role="alert">{{ $t('chat.runtime.unavailable') }}</p>
      <el-checkbox-group v-else :model-value="modelValue" @update:model-value="update">
        <div v-for="option in options" :key="option.connection_id" class="runtime-option">
          <el-checkbox :value="option.connection_id">{{ option.label || option.connector_identifier }}</el-checkbox>
          <small>{{ option.permissions.join(' · ') }}</small>
        </div>
      </el-checkbox-group>
      <p v-if="!loading && !error && options.length === 0">{{ $t('chat.runtime.empty') }}</p>
    </el-popover>
  </div>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue';
import { ElButton, ElPopover, ElCheckbox, ElCheckboxGroup } from 'element-plus';
import { connectionRuntime, type RuntimeConnectionOption } from '@/operators/connectionRuntime';
const props = defineProps<{ modelValue: string[]; disabled?: boolean; userId?: string }>();
const emit = defineEmits<{ 'update:modelValue': [value: string[]] }>();
const options = ref<RuntimeConnectionOption[]>([]);
const loading = ref(false);
const error = ref(false);
let sequence = 0;
watch(
  () => props.userId,
  () => {
    sequence++;
    options.value = [];
    emit('update:modelValue', []);
  }
);
async function load() {
  const id = ++sequence;
  loading.value = true;
  error.value = false;
  try {
    const values = await connectionRuntime.options();
    if (id !== sequence) return;
    options.value = values;
    emit(
      'update:modelValue',
      props.modelValue.filter((v) => values.some((o) => o.connection_id === v))
    );
  } catch {
    if (id === sequence) {
      error.value = true;
      options.value = [];
      emit('update:modelValue', []);
    }
  } finally {
    if (id === sequence) loading.value = false;
  }
}
function update(values: unknown) {
  if (Array.isArray(values))
    emit(
      'update:modelValue',
      values.filter((v): v is string => typeof v === 'string' && options.value.some((o) => o.connection_id === v))
    );
}
</script>
<style scoped>
.runtime-option {
  display: flex;
  flex-direction: column;
  margin-top: 8px;
  overflow-wrap: anywhere;
}
.runtime-option small {
  color: var(--el-text-color-secondary);
}
p {
  margin: 0 0 8px;
}
</style>
