<template>
  <div class="field">
    <div class="header">
      <h2 class="title font-bold">{{ $t('kling.name.mode') }}</h2>
      <info-icon :content="$t('kling.description.mode')" class="info-icon" />
    </div>
    <el-select
      :key="revertKey"
      :model-value="value"
      class="value"
      :placeholder="$t('kling.placeholder.select')"
      :clearable="true"
      @change="onChange"
    >
      <el-option
        v-for="item in options"
        :key="item.value"
        :label="item.label"
        :value="item.value"
        :disabled="item.disabled"
      >
        <span :class="{ 'opt-disabled': item.disabled }">{{ item.label }}</span>
        <span v-if="item.disabled && item.disabledReason" class="opt-tip">
          {{ item.disabledReason }}
        </span>
      </el-option>
    </el-select>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSelect, ElOption, ElMessage, ElMessageBox } from 'element-plus';
import InfoIcon from '@/components/common/InfoIcon.vue';
import { KLING_DEFAULT_MODE, KLING_V3_MODELS } from '@/constants';
import { findKlingConflicts, clearKlingConflicts } from '@/utils/kling/capabilities';

export default defineComponent({
  name: 'ModeSelector',
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
  data() {
    return {
      revertKey: 0
    };
  },
  computed: {
    selectedModel(): string {
      return this.$store.state.kling?.config?.model || '';
    },
    cameraControlSet(): boolean {
      const cc = this.$store.state.kling?.config?.camera_control;
      return Boolean(cc?.type);
    },
    fourKReason(): string {
      if (!KLING_V3_MODELS.includes(this.selectedModel)) {
        return this.$t('kling.description.mode4kRequiresV3');
      }
      if (this.cameraControlSet) {
        return this.$t('kling.description.mode4kIncompatibleCamera');
      }
      return '';
    },
    options() {
      return [
        { value: 'std', label: this.$t('kling.name.modeStd'), disabled: false, disabledReason: '' },
        { value: 'pro', label: this.$t('kling.name.modePro'), disabled: false, disabledReason: '' },
        {
          value: '4k',
          label: this.$t('kling.name.mode4k'),
          disabled: Boolean(this.fourKReason),
          disabledReason: this.fourKReason
        }
      ];
    },
    value(): string | undefined {
      return this.$store.state.kling?.config?.mode;
    }
  },
  watch: {
    fourKReason(reason: string) {
      // If 4k becomes invalid (e.g. user switched model away from v3), revert to default.
      if (reason && this.value === '4k') {
        this.applyMode(KLING_DEFAULT_MODE);
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.applyMode(KLING_DEFAULT_MODE);
    }
  },
  methods: {
    async onChange(val: string) {
      const config = this.$store.state.kling?.config || {};
      const conflicts = findKlingConflicts(config, { mode: val });
      if (conflicts.length === 0) {
        this.applyMode(val);
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
        const cleared = clearKlingConflicts({ ...config, mode: val }, conflicts);
        this.$store.commit('kling/setConfig', cleared);
        ElMessage.success(this.$t('kling.message.featureRemovedNotice', { fields }));
      } catch {
        this.revertKey += 1;
      }
    },
    applyMode(val: string) {
      this.$store.commit('kling/setConfig', {
        ...this.$store.state.kling.config,
        mode: val
      });
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
