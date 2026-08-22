<template>
  <div class="locale-editor">
    <div v-for="(row, index) in modelValue" :key="index" class="locale-row">
      <el-select
        :model-value="row.locale"
        class="locale-select"
        @update:model-value="updateRow(index, 'locale', $event)"
      >
        <el-option
          v-for="locale in localeOptions(index)"
          :key="locale.value"
          :label="locale.label"
          :value="locale.value"
          :disabled="locale.disabled"
        />
      </el-select>
      <el-input
        :model-value="row.value"
        :placeholder="placeholder"
        maxlength="500"
        @update:model-value="updateRow(index, 'value', $event)"
      />
      <el-button circle :aria-label="$t('common.button.delete')" @click="removeRow(index)">
        <close-icon :size="'1em' as any" aria-hidden="true" focusable="false" />
      </el-button>
    </div>
    <el-button size="small" round :disabled="modelValue.length >= availableLocales.length" @click="addRow">
      <add-icon :size="'1em' as any" aria-hidden="true" focusable="false" />
      {{ $t('site.banner.addLanguage') }}
    </el-button>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import { ElButton, ElInput, ElOption, ElSelect } from 'element-plus';
import { AddIcon, CloseIcon } from '@acedatacloud/core/icons/components';
import { getSiteLocaleOptions } from '@/utils/siteLocales';

export interface ILocaleRow {
  locale: string;
  value: string;
}

export default defineComponent({
  name: 'LocaleRows',
  components: { AddIcon, CloseIcon, ElButton, ElInput, ElOption, ElSelect },
  props: {
    modelValue: { type: Array as PropType<ILocaleRow[]>, required: true },
    placeholder: { type: String, default: '' }
  },
  emits: ['update:modelValue'],
  computed: {
    availableLocales() {
      return getSiteLocaleOptions(this.$store.state.site?.supported_locales);
    }
  },
  methods: {
    localeOptions(current: number) {
      const used = new Set(this.modelValue.filter((_, index) => index !== current).map((row) => row.locale));
      return this.availableLocales.map((locale) => ({ ...locale, disabled: used.has(locale.value) }));
    },
    updateRow(index: number, field: keyof ILocaleRow, value: string) {
      const rows = this.modelValue.map((row, current) => (current === index ? { ...row, [field]: value } : row));
      this.$emit('update:modelValue', rows);
    },
    addRow() {
      const used = new Set(this.modelValue.map((row) => row.locale));
      const preferred = String(this.$i18n.locale || 'en');
      const locale = !used.has(preferred)
        ? preferred
        : this.availableLocales.find((item) => !used.has(item.value))?.value || '';
      this.$emit('update:modelValue', [...this.modelValue, { locale, value: '' }]);
    },
    removeRow(index: number) {
      this.$emit(
        'update:modelValue',
        this.modelValue.filter((_, current) => current !== index)
      );
    }
  }
});
</script>

<style lang="scss" scoped>
.locale-editor {
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}
.locale-row {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 8px;
}
.locale-select {
  flex: 0 0 140px;
  width: 140px;
}
@media (max-width: 560px) {
  .locale-row {
    align-items: flex-start;
  }
  .locale-select {
    flex-basis: 112px;
    width: 112px;
  }
}
</style>
