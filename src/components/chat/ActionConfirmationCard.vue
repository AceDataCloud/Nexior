<template>
  <div
    class="action-confirmation-card"
    :class="{
      'is-resolved': resolved,
      'is-destructive': isDestructive,
      'is-tiktok': isTikTokPublish
    }"
  >
    <div class="acc-header">
      <div class="acc-heading">
        <span v-if="isTikTokPublish" class="acc-brand-mark" aria-hidden="true">
          <font-awesome-icon :icon="faTiktok" />
        </span>
        <component
          :is="headerIcon"
          v-else
          class="header-icon"
          :size="'1em' as any"
          aria-hidden="true"
          focusable="false"
        />
        <div class="acc-heading-copy">
          <span v-if="isTikTokPublish" class="acc-eyebrow">TikTok</span>
          <span class="header-title">{{ headerTitle }}</span>
        </div>
      </div>
      <span v-if="isTikTokPublish && !resolved" class="acc-review-badge">
        {{ $t('chat.actionConfirmation.tiktok.reviewBadge') }}
      </span>
    </div>

    <p v-if="summary" class="acc-summary">{{ summary }}</p>

    <div class="acc-content" :class="{ 'has-tiktok-layout': isTikTokPublish }">
      <div v-if="payload.preview" class="acc-preview" :class="{ 'has-error': mediaFailed }">
        <div v-if="!mediaReady && !mediaFailed" class="preview-loading" aria-live="polite">
          <span class="preview-spinner" />
          <span>{{ $t('chat.actionConfirmation.mediaLoading') }}</span>
        </div>
        <video
          v-if="payload.preview.type === 'video' && !mediaFailed"
          class="preview-media"
          :class="{ 'is-ready': mediaReady }"
          :src="payload.preview.url"
          controls
          playsinline
          preload="metadata"
          @loadedmetadata="onMediaReady"
          @canplay="onMediaReady"
          @error="onMediaError"
        />
        <img
          v-else-if="payload.preview.type === 'image' && !mediaFailed"
          class="preview-media"
          :class="{ 'is-ready': mediaReady }"
          :src="payload.preview.url"
          :alt="payload.title"
          @load="onMediaReady"
          @error="onMediaError"
        />
        <div v-else class="preview-fallback" role="alert">
          <span class="fallback-icon">!</span>
          <strong>{{ $t('chat.actionConfirmation.mediaUnavailable') }}</strong>
          <span>{{ $t('chat.actionConfirmation.mediaUnavailableHint') }}</span>
          <a :href="payload.preview.url" target="_blank" rel="noopener noreferrer">
            {{ $t('chat.actionConfirmation.openMedia') }}
            <external-link-icon :size="'1em' as any" aria-hidden="true" focusable="false" />
          </a>
        </div>
        <span v-if="formattedDuration && !mediaFailed" class="preview-duration">
          {{ formattedDuration }}
        </span>
      </div>

      <div class="acc-body">
        <TikTokPublishForm
          v-if="isTikTokPublish"
          ref="tiktokForm"
          :detail="(payload.detail ?? {}) as any"
          :initial-title="initialTitle"
          :duration-sec="payload.preview?.duration_sec ?? 0"
          :disabled="resolved"
          :initial-values="submittedValues"
          @validity-change="onValidityChange"
        />
        <GenericFieldList v-else :summary="payload.summary" :fields="payload.fields ?? []" />
      </div>
    </div>

    <div v-if="!resolved" class="acc-actions">
      <p v-if="!bodyValid && validationReason" class="acc-validation" role="status">
        {{ validationReason }}
      </p>
      <div class="acc-buttons">
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
    </div>

    <div v-else class="acc-resolved-banner">
      {{ resolvedSummary }}
    </div>
  </div>
</template>

<script lang="ts">
import { ConfirmIcon, ExternalLinkIcon, WarningIcon } from '@acedatacloud/core/icons/components';
import { faTiktok } from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { ElButton } from 'element-plus';
import { defineComponent, type PropType } from 'vue';
import GenericFieldList from './GenericFieldList.vue';
import TikTokPublishForm from './TikTokPublishForm.vue';
import type { IActionConfirmationPayload, IActionConfirmationResult, ITikTokPublishValues } from '@/models';

interface IData {
  submitting: boolean;
  resolvedConfirmed: boolean | null;
  bodyValid: boolean;
  validationReason: string;
  mediaReady: boolean;
  mediaFailed: boolean;
}

export default defineComponent({
  name: 'ActionConfirmationCard',
  components: {
    GenericFieldList,
    TikTokPublishForm,
    ConfirmIcon,
    ExternalLinkIcon,
    WarningIcon,
    FontAwesomeIcon,
    ElButton
  },
  props: {
    payload: {
      type: Object as PropType<IActionConfirmationPayload>,
      required: true
    },
    resolved: {
      type: Boolean,
      default: false
    },
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
      bodyValid: true,
      validationReason: '',
      mediaReady: false,
      mediaFailed: false
    };
  },
  computed: {
    faTiktok() {
      return faTiktok;
    },
    isTikTokPublish(): boolean {
      return this.payload?.kind === 'tiktok.publish';
    },
    headerTitle(): string {
      return this.isTikTokPublish
        ? (this.$t('chat.actionConfirmation.tiktok.publishTitle') as string)
        : this.payload.title;
    },
    summary(): string {
      return this.isTikTokPublish
        ? (this.$t('chat.actionConfirmation.tiktok.publishSummary') as string)
        : this.payload.summary || '';
    },
    initialTitle(): string {
      const detail = this.payload?.detail as Record<string, unknown> | undefined;
      return typeof detail?.suggested_title === 'string' ? detail.suggested_title : '';
    },
    submittedValues(): ITikTokPublishValues | null {
      if (!this.resolved || !this.previousOutput) return null;
      try {
        const parsed = JSON.parse(this.previousOutput) as IActionConfirmationResult;
        return (parsed?.values as unknown as ITikTokPublishValues) ?? null;
      } catch {
        return null;
      }
    },
    isDestructive(): boolean {
      return this.payload?.severity === 'destructive';
    },
    headerIcon() {
      return this.isDestructive ? WarningIcon : ConfirmIcon;
    },
    confirmLabel(): string {
      if (this.isTikTokPublish) return this.$t('chat.actionConfirmation.tiktok.publishButton') as string;
      return this.payload?.confirm_label || (this.$t('chat.actionConfirmation.confirm') as string);
    },
    formattedDuration(): string {
      const value = this.payload?.preview?.duration_sec;
      if (!value || !Number.isFinite(value)) return '';
      const total = Math.round(value);
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
    },
    'payload.preview.url'() {
      this.mediaReady = false;
      this.mediaFailed = false;
    }
  },
  methods: {
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
    onValidityChange(valid: boolean, reason = ''): void {
      this.bodyValid = valid;
      this.validationReason = reason;
    },
    onMediaReady(): void {
      this.mediaReady = true;
      this.mediaFailed = false;
    },
    onMediaError(): void {
      this.mediaReady = false;
      this.mediaFailed = true;
    },
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
  width: min(100%, 760px);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 18px;
  padding: 18px;
  margin: 10px 0;
  font-size: 14px;
  background: var(--el-bg-color);
  box-shadow: 0 14px 40px -28px rgb(0 0 0 / 45%);
  animation: actionConfirmationEnter 280ms cubic-bezier(0.16, 1, 0.3, 1);

  &.is-tiktok {
    border-color: color-mix(in srgb, var(--el-border-color) 72%, #25f4ee 28%);
  }

  &.is-destructive {
    border-color: var(--el-color-danger-light-5);
  }

  &.is-resolved {
    background: var(--el-fill-color-light);
    box-shadow: none;
    animation: none;
  }
}

.acc-header,
.acc-heading,
.acc-buttons {
  display: flex;
  align-items: center;
}

.acc-header {
  justify-content: space-between;
  gap: 12px;
}

.acc-heading {
  gap: 10px;
  min-width: 0;
}

.header-icon {
  color: var(--el-color-primary);
  font-size: 17px;
  flex-shrink: 0;
}

.acc-brand-mark {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  border-radius: 11px;
  color: #fff;
  font-size: 20px;
  font-weight: 800;
  background: #111;
  box-shadow:
    -2px 0 #25f4ee,
    2px 0 #fe2c55;
}

.acc-heading-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.acc-eyebrow {
  color: var(--el-text-color-secondary);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.header-title {
  color: var(--el-text-color-primary);
  font-size: 16px;
  font-weight: 650;
  line-height: 1.35;
  word-break: break-word;
}

.acc-review-badge {
  padding: 4px 9px;
  flex-shrink: 0;
  border-radius: 999px;
  color: var(--el-color-warning-dark-2);
  font-size: 11px;
  font-weight: 600;
  background: var(--el-color-warning-light-9);
}

.acc-summary {
  margin: 12px 0 0;
  color: var(--el-text-color-regular);
  font-size: 13px;
  line-height: 1.55;
}

.acc-content {
  margin-top: 14px;

  &.has-tiktok-layout {
    display: grid;
    grid-template-columns: minmax(190px, 0.72fr) minmax(300px, 1.28fr);
    gap: 18px;
    align-items: start;
  }
}

.acc-preview {
  position: relative;
  min-height: 270px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
  overflow: hidden;
  background: linear-gradient(145deg, rgb(37 244 238 / 8%), rgb(254 44 85 / 7%)), #0d0f12;

  .preview-media {
    display: block;
    width: 100%;
    height: 100%;
    min-height: 270px;
    max-height: 440px;
    opacity: 0;
    object-fit: contain;
    transition: opacity 180ms ease;

    &.is-ready {
      opacity: 1;
    }
  }
}

.preview-loading,
.preview-fallback {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 10px;
  padding: 22px;
  color: rgb(255 255 255 / 68%);
  text-align: center;
  font-size: 12px;
}

.preview-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid rgb(255 255 255 / 20%);
  border-top-color: #25f4ee;
  border-radius: 50%;
  animation: previewSpin 700ms linear infinite;
}

.preview-fallback {
  position: relative;
  min-height: 270px;

  strong {
    color: #fff;
    font-size: 14px;
  }

  a {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    margin-top: 4px;
    color: #25f4ee;
    font-weight: 600;
    text-decoration: none;
  }
}

.fallback-icon {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border: 1px solid rgb(255 255 255 / 25%);
  border-radius: 50%;
  color: #fff;
  font-weight: 700;
}

.preview-duration {
  position: absolute;
  right: 9px;
  bottom: 9px;
  padding: 3px 7px;
  border-radius: 6px;
  color: #fff;
  font-size: 11px;
  background: rgb(0 0 0 / 70%);
  backdrop-filter: blur(8px);
}

.acc-body {
  min-width: 0;
}

.acc-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.acc-validation {
  margin: 0;
  color: var(--el-color-warning-dark-2);
  font-size: 12px;
  line-height: 1.4;
}

.acc-buttons {
  justify-content: flex-end;
  gap: 8px;
  margin-left: auto;
  flex-shrink: 0;
}

.acc-resolved-banner {
  margin-top: 12px;
  padding: 9px 12px;
  border-radius: 9px;
  background: var(--el-color-info-light-9);
  color: var(--el-text-color-regular);
  font-size: 13px;
  line-height: 1.5;
}

@media (max-width: 680px) {
  .action-confirmation-card {
    padding: 15px;
    border-radius: 16px;
  }

  .acc-content.has-tiktok-layout {
    grid-template-columns: minmax(0, 1fr);
  }

  .acc-preview,
  .acc-preview .preview-media,
  .preview-fallback {
    min-height: 220px;
    max-height: 360px;
  }

  .acc-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .acc-buttons {
    width: 100%;

    :deep(.el-button) {
      flex: 1;
    }
  }
}

@keyframes actionConfirmationEnter {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.985);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes previewSpin {
  to {
    transform: rotate(360deg);
  }
}
</style>
