<template>
  <div class="action-confirmation-card" :class="{ 'is-resolved': resolved, 'is-destructive': isDestructive }">
    <div class="acc-header">
      <component :is="headerIcon" class="header-icon" :size="'1em' as any" aria-hidden="true" focusable="false" />
      <span class="header-title">{{ payload.title }}</span>
    </div>

    <div v-if="payload.preview" class="acc-preview">
      <video
        v-if="payload.preview.type === 'video'"
        class="preview-media"
        :src="payload.preview.url"
        controls
        preload="metadata"
      />
      <img v-else class="preview-media" :src="payload.preview.url" :alt="payload.title" />
      <span v-if="payload.preview.duration_sec" class="preview-duration">
        {{ formattedDuration }}
      </span>
    </div>

    <div class="acc-body">
      <!-- Kind-specific bodies register here. Unknown kinds fall through to
           the generic list so a worker that ships a new kind first still
           renders something actionable. -->
      <TikTokPublishForm
        v-if="isTikTokPublish"
        ref="tiktokForm"
        :detail="payload.detail as any"
        :initial-title="initialTitle"
        :duration-sec="payload.preview?.duration_sec ?? 0"
        @validity-change="onValidityChange"
      />
      <GenericFieldList v-else :summary="payload.summary" :fields="payload.fields ?? []" />
    </div>

    <div v-if="!resolved" class="acc-actions">
      <el-button text :disabled="submitting" @click="onCancel">
        {{ $t('chat.actionConfirmation.cancel') }}
      </el-button>
      <el-button
        :type="isDestructive ? 'danger' : 'primary'"
        :loading="submitting"
        :disabled="!bodyValid"
        @click="onConfirm"
      >
        {{ confirmLabel }}
      </el-button>
    </div>

    <div v-else class="acc-resolved-banner">
      {{ resolvedSummary }}
    </div>
  </div>
</template>

<script lang="ts">
import { ConfirmIcon, WarningIcon } from '@acedatacloud/core/icons/components';
import { defineComponent, type PropType } from 'vue';
import GenericFieldList from './GenericFieldList.vue';
import TikTokPublishForm from './TikTokPublishForm.vue';
import type { IActionConfirmationPayload, IActionConfirmationResult } from '@/models';

interface IData {
  submitting: boolean;
  resolvedConfirmed: boolean | null;
  bodyValid: boolean;
}

/**
 * Gate for an irreversible external action. Rendered inline on a
 * `tool_use` block paused with `pending_action_confirmation`.
 *
 * Not to be confused with `<ConnectorConsentCard>`: that one asks "do you
 * have permission for this connector?" once, when the capability is
 * missing. This asks "should I do this, this time?" and fires before
 * every such action — a user with TikTok already connected still gets
 * this card for each video.
 */
export default defineComponent({
  name: 'ActionConfirmationCard',
  components: { GenericFieldList, TikTokPublishForm, ConfirmIcon, WarningIcon },
  props: {
    payload: {
      type: Object as PropType<IActionConfirmationPayload>,
      required: true
    },
    resolved: {
      type: Boolean,
      default: false
    },
    /** Prior `output` JSON when replaying a resolved block from history. */
    previousOutput: {
      type: String,
      default: ''
    }
  },
  emits: ['submit'],
  data(): IData {
    return {
      submitting: false,
      resolvedConfirmed: null,
      // Kind bodies that collect input flip this via `validity-change`;
      // bodies without input leave it true so the button stays enabled.
      bodyValid: true
    };
  },
  computed: {
    isTikTokPublish(): boolean {
      return this.payload?.kind === 'tiktok.publish' && !!this.payload?.detail;
    },
    /** Model-suggested caption, editable by the user in the kind body. */
    initialTitle(): string {
      const detail = this.payload?.detail as Record<string, unknown> | undefined;
      return typeof detail?.suggested_title === 'string' ? detail.suggested_title : '';
    },
    isDestructive(): boolean {
      return this.payload?.severity === 'destructive';
    },
    headerIcon() {
      return this.isDestructive ? WarningIcon : ConfirmIcon;
    },
    confirmLabel(): string {
      return this.payload?.confirm_label || (this.$t('chat.actionConfirmation.confirm') as string);
    },
    formattedDuration(): string {
      const total = Math.round(this.payload?.preview?.duration_sec ?? 0);
      const mm = Math.floor(total / 60);
      const ss = total % 60;
      return `${mm}:${String(ss).padStart(2, '0')}`;
    },
    resolvedSummary(): string {
      const key = this.resolvedConfirmed
        ? 'chat.actionConfirmation.resolvedConfirmed'
        : 'chat.actionConfirmation.resolvedCancelled';
      return this.$t(key) as string;
    }
  },
  watch: {
    resolved: {
      immediate: true,
      handler(value: boolean) {
        if (!value) return;
        this.submitting = false;
        this.resolvedConfirmed = this.parsePreviousConfirmed();
      }
    }
  },
  methods: {
    /** Recover the confirm/cancel outcome when re-rendering history. */
    parsePreviousConfirmed(): boolean {
      if (!this.previousOutput) return false;
      try {
        const parsed = JSON.parse(this.previousOutput) as IActionConfirmationResult;
        return parsed?.confirmed === true;
      } catch {
        return false;
      }
    },
    emitResult(confirmed: boolean, values?: Record<string, unknown>): void {
      if (this.submitting || this.resolved) return;
      this.submitting = true;
      const result: IActionConfirmationResult = {
        action_confirmation_id: this.payload.action_confirmation_id,
        confirmed
      };
      if (confirmed && values) result.values = values;
      this.$emit('submit', result);
    },
    onValidityChange(valid: boolean): void {
      this.bodyValid = valid;
    },
    /** Pull the edited values out of the active kind body, if any. */
    collectValues(): Record<string, unknown> | undefined {
      const form = this.$refs.tiktokForm as { collect?: () => Record<string, unknown> } | undefined;
      return form?.collect ? form.collect() : undefined;
    },
    onConfirm(): void {
      this.emitResult(true, this.collectValues());
    },
    onCancel(): void {
      this.emitResult(false);
    }
  }
});
</script>

<style lang="scss" scoped>
.action-confirmation-card {
  border: 1px solid var(--el-border-color);
  border-radius: 10px;
  padding: 14px 16px;
  margin: 8px 0;
  background: var(--el-bg-color);

  &.is-destructive {
    border-color: var(--el-color-danger-light-5);
  }

  &.is-resolved {
    opacity: 0.72;
  }

  .acc-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;

    .header-icon {
      color: var(--el-color-primary);
      flex-shrink: 0;
    }

    .header-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      min-width: 0;
      word-break: break-word;
    }
  }

  &.is-destructive .acc-header .header-icon {
    color: var(--el-color-danger);
  }

  .acc-preview {
    position: relative;
    margin-bottom: 12px;
    border-radius: 8px;
    overflow: hidden;
    background: var(--el-fill-color-light);
    max-width: 240px;

    .preview-media {
      display: block;
      width: 100%;
      max-height: 320px;
      object-fit: contain;
    }

    .preview-duration {
      position: absolute;
      right: 6px;
      bottom: 6px;
      padding: 1px 6px;
      border-radius: 4px;
      font-size: 11px;
      color: #fff;
      background: rgb(0 0 0 / 60%);
    }
  }

  .acc-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 14px;
  }

  .acc-resolved-banner {
    margin-top: 12px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}
</style>
