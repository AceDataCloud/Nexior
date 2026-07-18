<template>
  <div class="scenario-field" :class="{ 'scenario-field--inline': inline }">
    <div class="scenario-field__head">
      <label v-if="label" :for="forId" class="scenario-field__label">
        {{ label }}<span v-if="required" aria-hidden="true" class="scenario-field__required">*</span>
      </label>
      <info-icon v-if="help" :content="help" />
    </div>
    <div class="scenario-field__control">
      <slot />
    </div>
    <p v-if="error" class="scenario-field__message scenario-field__message--error" role="alert">
      {{ error }}
    </p>
    <p v-else-if="disabledReason" class="scenario-field__message">
      {{ disabledReason }}
    </p>
  </div>
</template>

<script setup lang="ts">
import InfoIcon from '@/components/common/InfoIcon.vue';

withDefaults(
  defineProps<{
    label?: string;
    forId: string;
    help?: string;
    error?: string;
    disabledReason?: string;
    required?: boolean;
    inline?: boolean;
  }>(),
  {
    label: undefined,
    help: undefined,
    error: undefined,
    disabledReason: undefined,
    required: false,
    inline: false
  }
);
</script>

<style lang="scss" scoped>
.scenario-field + .scenario-field {
  margin-top: 16px;
}

.scenario-field__head {
  display: flex;
  align-items: center;
  min-width: 0;
  margin-bottom: 8px;
}

.scenario-field__label {
  min-width: 0;
  color: var(--el-text-color-primary);
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
}

.scenario-field__required,
.scenario-field__message--error {
  color: var(--el-color-danger);
}

.scenario-field__required {
  margin-left: 2px;
}

.scenario-field__control {
  min-width: 0;
}

.scenario-field__message {
  margin: 6px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 18px;
}

.scenario-field--inline {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
}

.scenario-field--inline .scenario-field__head {
  margin-bottom: 0;
}

.scenario-field--inline .scenario-field__message {
  grid-column: 1 / -1;
}
</style>
