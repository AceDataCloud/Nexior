<template>
  <el-tooltip effect="dark" :content="tooltipContent" placement="top">
    <el-button
      class="auto-translate-toggle"
      :class="{ 'is-on': enabled, 'is-off': !enabled }"
      :loading="busy"
      :disabled="isDisabled"
      circle
      size="small"
      :type="enabled ? 'primary' : 'default'"
      @click="onClick"
    >
      <span class="icon-wrap">
        <font-awesome-icon icon="fa-solid fa-globe" />
        <span v-if="enabled" class="dot" />
      </span>
    </el-button>
  </el-tooltip>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import { ElButton, ElMessage, ElMessageBox, ElTooltip } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { translationOperator } from '@/operators/translation';
import type { ITranslationDisableResponse, ITranslationEnableResponse } from '@/operators/translation';

export default defineComponent({
  name: 'AutoTranslateToggle',
  components: {
    ElButton,
    ElTooltip,
    FontAwesomeIcon
  },
  props: {
    model: {
      type: String,
      required: true
    },
    objectId: {
      type: String as PropType<string | undefined>,
      default: undefined
    },
    field: {
      type: String,
      required: true
    },
    enabled: {
      type: Boolean,
      default: false
    },
    currentValue: {
      type: String,
      default: ''
    },
    disabledReason: {
      type: String,
      default: ''
    }
  },
  emits: ['update:enabled', 'enabled-success', 'disabled-success'],
  data() {
    return {
      busy: false
    };
  },
  computed: {
    isDisabled(): boolean {
      return !this.objectId;
    },
    tooltipContent(): string {
      if (this.isDisabled) {
        return this.disabledReason || (this.$t('site.autoTranslate.tooltipDisabledNotSaved') as string);
      }
      return this.enabled
        ? (this.$t('site.autoTranslate.tooltipOn') as string)
        : (this.$t('site.autoTranslate.tooltipOff') as string);
    }
  },
  methods: {
    async onClick(): Promise<void> {
      if (this.busy || this.isDisabled || !this.objectId) return;
      if (this.enabled) {
        await this.onDisable();
      } else {
        await this.onEnable();
      }
    },
    async onEnable(): Promise<void> {
      if (!this.objectId) return;
      const content = (this.currentValue ?? '').trim();
      if (!content) {
        ElMessage.warning(this.$t('site.autoTranslate.empty') as string);
        return;
      }
      try {
        await ElMessageBox.confirm(
          this.$t('site.autoTranslate.confirmEnable') as string,
          this.$t('site.autoTranslate.tooltipOff') as string,
          {
            type: 'info',
            confirmButtonText: this.$t('common.button.confirm') as string,
            cancelButtonText: this.$t('common.button.cancel') as string
          }
        );
      } catch {
        return;
      }
      this.busy = true;
      try {
        const { data } = await translationOperator.enable({
          model: this.model,
          object_id: this.objectId,
          field: this.field,
          content
        });
        this.$emit('update:enabled', true);
        const payload: { source: string; fieldValue: string } = {
          source: (data as ITranslationEnableResponse).source,
          fieldValue: (data as ITranslationEnableResponse).field_value
        };
        this.$emit('enabled-success', payload);
      } catch (err) {
        this.handleError(err);
      } finally {
        this.busy = false;
      }
    },
    async onDisable(): Promise<void> {
      if (!this.objectId) return;
      try {
        await ElMessageBox.confirm(
          this.$t('site.autoTranslate.confirmDisable') as string,
          this.$t('site.autoTranslate.tooltipOn') as string,
          {
            type: 'warning',
            confirmButtonText: this.$t('common.button.confirm') as string,
            cancelButtonText: this.$t('common.button.cancel') as string
          }
        );
      } catch {
        return;
      }
      this.busy = true;
      try {
        const { data } = await translationOperator.disable({
          model: this.model,
          object_id: this.objectId,
          field: this.field
        });
        this.$emit('update:enabled', false);
        const payload: { fieldValue: string | null } = {
          fieldValue: (data as ITranslationDisableResponse).field_value
        };
        this.$emit('disabled-success', payload);
      } catch (err) {
        this.handleError(err);
      } finally {
        this.busy = false;
      }
    },
    handleError(err: unknown): void {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      ElMessage.error(detail || (this.$t('site.autoTranslate.error') as string));
    }
  }
});
</script>

<style lang="scss" scoped>
.auto-translate-toggle {
  // Sized to sit alongside ``<edit-text>``'s edit button on each
  // settings row without dominating it — height matches a small
  // Element Plus button glyph.
  width: 26px;
  height: 26px;
  padding: 0;
  margin-left: 6px;

  .icon-wrap {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
  }

  &.is-off {
    color: var(--el-text-color-secondary);
  }

  .dot {
    position: absolute;
    top: -2px;
    right: -3px;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--el-color-success);
    box-shadow: 0 0 0 1px var(--el-color-white);
  }
}
</style>
