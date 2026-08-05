<template>
  <div class="tiktok-publish-form">
    <div class="tpf-account" :class="{ 'is-missing': !hasCreator }">
      <img v-if="detail.creator_avatar_url" class="tpf-avatar" :src="detail.creator_avatar_url" alt="" />
      <span v-else class="tpf-avatar tpf-avatar-fallback" aria-hidden="true">
        {{ creatorInitial }}
      </span>
      <div class="tpf-account-copy">
        <span>{{ $t('chat.actionConfirmation.tiktok.postingTo') }}</span>
        <strong>{{ creatorName }}</strong>
      </div>
      <span v-if="hasCreator" class="tpf-connected">{{ $t('chat.actionConfirmation.tiktok.connected') }}</span>
    </div>

    <div v-if="metadataMissing" class="tpf-blocking-error" role="alert">
      <strong>{{ $t('chat.actionConfirmation.tiktok.detailsUnavailable') }}</strong>
      <span>{{ $t('chat.actionConfirmation.tiktok.detailsUnavailableHint') }}</span>
    </div>

    <div v-if="tooLong" class="tpf-blocking-error" role="alert">
      <strong>{{ $t('chat.actionConfirmation.tiktok.videoTooLongTitle') }}</strong>
      <span>{{ $t('chat.actionConfirmation.tiktok.tooLong', { max: detail.max_video_post_duration_sec }) }}</span>
    </div>

    <section class="tpf-section">
      <div class="tpf-section-heading">
        <span>{{ $t('chat.actionConfirmation.tiktok.postDetails') }}</span>
        <span class="tpf-required-note">{{ $t('chat.actionConfirmation.tiktok.requiredNote') }}</span>
      </div>

      <div class="tpf-field">
        <label class="tpf-label" for="tpf-caption">{{ $t('chat.actionConfirmation.tiktok.caption') }}</label>
        <el-input
          id="tpf-caption"
          v-model="form.title"
          type="textarea"
          :rows="3"
          :maxlength="2200"
          :show-word-limit="!disabled"
          :disabled="disabled || metadataMissing"
          resize="none"
          :placeholder="$t('chat.actionConfirmation.tiktok.captionPlaceholder')"
        />
      </div>

      <div class="tpf-field">
        <label class="tpf-label" for="tpf-privacy">
          {{ $t('chat.actionConfirmation.tiktok.privacy') }}
          <span class="tpf-required">*</span>
        </label>
        <el-select
          v-if="hasPrivacyOptions"
          id="tpf-privacy"
          v-model="form.privacy_level"
          :placeholder="$t('chat.actionConfirmation.tiktok.privacyPlaceholder')"
          :disabled="disabled"
          class="tpf-select"
          popper-class="tiktok-privacy-popper"
        >
          <el-option
            v-for="opt in privacyOptions"
            :key="opt"
            :label="privacyLabel(opt)"
            :value="opt"
            :disabled="isPrivacyDisabled(opt)"
          />
        </el-select>
        <div v-else class="tpf-empty-control">
          {{ $t('chat.actionConfirmation.tiktok.noPrivacyOptions') }}
        </div>
        <p v-if="selfOnlyBlocked" class="tpf-hint is-warning">
          {{ $t('chat.actionConfirmation.tiktok.brandedNotPrivate') }}
        </p>
      </div>
    </section>

    <section class="tpf-section">
      <div class="tpf-section-heading">{{ $t('chat.actionConfirmation.tiktok.interactions') }}</div>
      <p class="tpf-section-description">{{ $t('chat.actionConfirmation.tiktok.interactionsHint') }}</p>
      <div class="tpf-checks">
        <el-checkbox v-model="form.allow_comment" :disabled="disabled || metadataMissing || detail.comment_disabled">
          {{ $t('chat.actionConfirmation.tiktok.allowComment') }}
        </el-checkbox>
        <template v-if="!detail.is_photo_post">
          <el-checkbox v-model="form.allow_duet" :disabled="disabled || metadataMissing || detail.duet_disabled">
            {{ $t('chat.actionConfirmation.tiktok.allowDuet') }}
          </el-checkbox>
          <el-checkbox v-model="form.allow_stitch" :disabled="disabled || metadataMissing || detail.stitch_disabled">
            {{ $t('chat.actionConfirmation.tiktok.allowStitch') }}
          </el-checkbox>
        </template>
      </div>
      <p v-if="disabledInteractions" class="tpf-hint">
        {{ $t('chat.actionConfirmation.tiktok.disabledByAccount', { list: disabledInteractions }) }}
      </p>
    </section>

    <section class="tpf-section">
      <div class="tpf-section-heading">{{ $t('chat.actionConfirmation.tiktok.disclosure') }}</div>
      <el-checkbox v-model="form.commercial" :disabled="disabled || metadataMissing">
        {{ $t('chat.actionConfirmation.tiktok.commercial') }}
      </el-checkbox>
      <p class="tpf-section-description">{{ $t('chat.actionConfirmation.tiktok.commercialHint') }}</p>
      <div v-if="form.commercial" class="tpf-commercial-options">
        <el-checkbox v-model="form.brand_organic_toggle" :disabled="disabled">
          <span class="tpf-option-copy">
            <strong>{{ $t('chat.actionConfirmation.tiktok.yourBrand') }}</strong>
            <small>{{ $t('chat.actionConfirmation.tiktok.yourBrandHint') }}</small>
          </span>
        </el-checkbox>
        <el-checkbox v-model="form.brand_content_toggle" :disabled="disabled || brandedContentBlocked">
          <span class="tpf-option-copy">
            <strong>{{ $t('chat.actionConfirmation.tiktok.brandedContent') }}</strong>
            <small>{{ $t('chat.actionConfirmation.tiktok.brandedContentHint') }}</small>
          </span>
        </el-checkbox>
        <p v-if="commercialLabel" class="tpf-hint is-info">{{ commercialLabel }}</p>
        <p v-if="brandedContentBlocked" class="tpf-hint is-warning">
          {{ $t('chat.actionConfirmation.tiktok.brandedNotPrivate') }}
        </p>
      </div>
    </section>

    <aside class="tpf-policy">
      <div class="tpf-policy-icon" aria-hidden="true">✓</div>
      <div>
        <strong>{{ $t('chat.actionConfirmation.tiktok.beforePublishing') }}</strong>
        <p>{{ policyIntro }}</p>
        <div class="tpf-policy-links">
          <a :href="musicUsageUrl" target="_blank" rel="noopener noreferrer">
            {{ $t('chat.actionConfirmation.tiktok.musicUsageLink') }}
          </a>
          <a v-if="form.brand_content_toggle" :href="brandedContentUrl" target="_blank" rel="noopener noreferrer">
            {{ $t('chat.actionConfirmation.tiktok.brandedPolicyLink') }}
          </a>
        </div>
      </div>
    </aside>
  </div>
</template>

<script lang="ts">
import { ElCheckbox, ElInput, ElOption, ElSelect } from 'element-plus';
import { defineComponent, type PropType } from 'vue';
import type { ITikTokPublishDetail, ITikTokPublishValues } from '@/models';

interface IForm {
  title: string;
  privacy_level: string;
  allow_comment: boolean;
  allow_duet: boolean;
  allow_stitch: boolean;
  commercial: boolean;
  brand_organic_toggle: boolean;
  brand_content_toggle: boolean;
}

const SELF_ONLY = 'SELF_ONLY';
const MUSIC_USAGE_URL = 'https://www.tiktok.com/legal/page/global/music-usage-confirmation/en';
const BRANDED_CONTENT_URL = 'https://www.tiktok.com/legal/page/global/bc-policy/en';

export default defineComponent({
  name: 'TikTokPublishForm',
  components: { ElCheckbox, ElInput, ElOption, ElSelect },
  props: {
    detail: {
      type: Object as PropType<ITikTokPublishDetail>,
      required: true
    },
    initialTitle: {
      type: String,
      default: ''
    },
    durationSec: {
      type: Number,
      default: 0
    },
    disabled: {
      type: Boolean,
      default: false
    },
    initialValues: {
      type: Object as PropType<ITikTokPublishValues | null>,
      default: null
    }
  },
  emits: ['validity-change'],
  data(): { form: IForm } {
    const submitted = this.initialValues;
    return {
      form: {
        title: submitted?.title ?? this.initialTitle,
        privacy_level: submitted?.privacy_level ?? '',
        allow_comment: submitted ? !submitted.disable_comment : false,
        allow_duet: submitted ? !submitted.disable_duet : false,
        allow_stitch: submitted ? !submitted.disable_stitch : false,
        commercial: Boolean(submitted?.brand_organic_toggle || submitted?.brand_content_toggle),
        brand_organic_toggle: Boolean(submitted?.brand_organic_toggle),
        brand_content_toggle: Boolean(submitted?.brand_content_toggle)
      }
    };
  },
  computed: {
    privacyOptions(): string[] {
      return Array.isArray(this.detail?.privacy_level_options)
        ? this.detail.privacy_level_options.filter((option): option is string => typeof option === 'string' && !!option)
        : [];
    },
    hasPrivacyOptions(): boolean {
      return this.privacyOptions.length > 0;
    },
    hasCreator(): boolean {
      return typeof this.detail?.creator_nickname === 'string' && !!this.detail.creator_nickname.trim();
    },
    creatorName(): string {
      return this.hasCreator
        ? this.detail.creator_nickname
        : (this.$t('chat.actionConfirmation.tiktok.unknownAccount') as string);
    },
    creatorInitial(): string {
      return this.hasCreator ? this.detail.creator_nickname.trim().charAt(0).toUpperCase() : '?';
    },
    metadataMissing(): boolean {
      return !this.hasCreator || !this.hasPrivacyOptions;
    },
    tooLong(): boolean {
      const max = this.detail?.max_video_post_duration_sec ?? 0;
      return max > 0 && this.durationSec > max;
    },
    brandedContentBlocked(): boolean {
      return this.form.privacy_level === SELF_ONLY;
    },
    selfOnlyBlocked(): boolean {
      return this.form.commercial && this.form.brand_content_toggle;
    },
    commercialLabel(): string {
      if (this.form.brand_content_toggle) {
        return this.$t('chat.actionConfirmation.tiktok.labelPaidPartnership') as string;
      }
      if (this.form.brand_organic_toggle) {
        return this.$t('chat.actionConfirmation.tiktok.labelPromotional') as string;
      }
      return '';
    },
    disabledInteractions(): string {
      const labels: string[] = [];
      if (this.detail?.comment_disabled) labels.push(this.$t('chat.actionConfirmation.tiktok.allowComment') as string);
      if (!this.detail?.is_photo_post && this.detail?.duet_disabled) {
        labels.push(this.$t('chat.actionConfirmation.tiktok.allowDuet') as string);
      }
      if (!this.detail?.is_photo_post && this.detail?.stitch_disabled) {
        labels.push(this.$t('chat.actionConfirmation.tiktok.allowStitch') as string);
      }
      return labels.join('、');
    },
    policyIntro(): string {
      const key = this.form.brand_content_toggle
        ? 'chat.actionConfirmation.tiktok.policyIntroBranded'
        : 'chat.actionConfirmation.tiktok.policyIntro';
      return this.$t(key) as string;
    },
    musicUsageUrl(): string {
      return MUSIC_USAGE_URL;
    },
    brandedContentUrl(): string {
      return BRANDED_CONTENT_URL;
    },
    validationReason(): string {
      if (this.metadataMissing) return this.$t('chat.actionConfirmation.tiktok.fixDetailsFirst') as string;
      if (this.tooLong) return this.$t('chat.actionConfirmation.tiktok.useShorterVideo') as string;
      if (!this.form.privacy_level) return this.$t('chat.actionConfirmation.tiktok.selectPrivacyFirst') as string;
      if (this.form.commercial && !this.form.brand_organic_toggle && !this.form.brand_content_toggle) {
        return this.$t('chat.actionConfirmation.tiktok.selectDisclosureType') as string;
      }
      return '';
    },
    isValid(): boolean {
      return !this.validationReason;
    },
    values(): ITikTokPublishValues {
      return {
        title: this.form.title,
        privacy_level: this.form.privacy_level,
        disable_comment: !this.form.allow_comment,
        disable_duet: !this.form.allow_duet,
        disable_stitch: !this.form.allow_stitch,
        brand_organic_toggle: this.form.commercial ? this.form.brand_organic_toggle : false,
        brand_content_toggle: this.form.commercial ? this.form.brand_content_toggle : false
      };
    }
  },
  watch: {
    validationReason: {
      immediate: true,
      handler(reason: string) {
        this.$emit('validity-change', !reason, reason);
      }
    },
    'form.privacy_level'(level: string) {
      if (level === SELF_ONLY) this.form.brand_content_toggle = false;
    },
    'form.commercial'(on: boolean) {
      if (!on) {
        this.form.brand_organic_toggle = false;
        this.form.brand_content_toggle = false;
      }
    }
  },
  methods: {
    isPrivacyDisabled(option: string): boolean {
      return option === SELF_ONLY && this.selfOnlyBlocked;
    },
    privacyLabel(option: string): string {
      const known: Record<string, string> = {
        PUBLIC_TO_EVERYONE: 'chat.actionConfirmation.tiktok.privacyPublic',
        MUTUAL_FOLLOW_FRIENDS: 'chat.actionConfirmation.tiktok.privacyFriends',
        FOLLOWER_OF_CREATOR: 'chat.actionConfirmation.tiktok.privacyFollowers',
        SELF_ONLY: 'chat.actionConfirmation.tiktok.privacySelf'
      };
      return known[option] ? (this.$t(known[option]) as string) : option;
    },
    collect(): ITikTokPublishValues {
      return this.values;
    }
  }
});
</script>

<style lang="scss" scoped>
.tiktok-publish-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tpf-account {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  background: var(--el-fill-color-extra-light);

  &.is-missing {
    border-color: var(--el-color-danger-light-5);
  }
}

.tpf-avatar {
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  border-radius: 50%;
  object-fit: cover;
}

.tpf-avatar-fallback {
  display: grid;
  place-items: center;
  color: #fff;
  font-weight: 700;
  background: linear-gradient(135deg, #25f4ee, #111 48%, #fe2c55);
}

.tpf-account-copy {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;

  span {
    color: var(--el-text-color-secondary);
    font-size: 11px;
  }

  strong {
    overflow: hidden;
    color: var(--el-text-color-primary);
    font-size: 13px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.tpf-connected {
  color: var(--el-color-success);
  font-size: 11px;
  font-weight: 600;
}

.tpf-blocking-error {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 10px 12px;
  border: 1px solid var(--el-color-danger-light-5);
  border-radius: 10px;
  color: var(--el-color-danger);
  font-size: 12px;
  line-height: 1.45;
  background: var(--el-color-danger-light-9);
}

.tpf-section {
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  background: color-mix(in srgb, var(--el-bg-color) 92%, var(--el-fill-color-light) 8%);
}

.tpf-section-heading {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
  color: var(--el-text-color-primary);
  font-size: 12px;
  font-weight: 650;
}

.tpf-required-note,
.tpf-section-description {
  color: var(--el-text-color-secondary);
  font-size: 10px;
  font-weight: 400;
}

.tpf-section-description {
  margin: -5px 0 9px;
  line-height: 1.45;
}

.tpf-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;

  & + & {
    margin-top: 11px;
  }
}

.tpf-label {
  color: var(--el-text-color-regular);
  font-size: 11px;
  font-weight: 500;
}

.tpf-required {
  color: var(--el-color-danger);
}

.tpf-select {
  width: 100%;
  min-width: 0;
}

.tpf-empty-control {
  padding: 10px 12px;
  border: 1px dashed var(--el-color-danger-light-5);
  border-radius: 8px;
  color: var(--el-color-danger);
  font-size: 12px;
  background: var(--el-color-danger-light-9);
}

.tpf-checks {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 18px;
}

.tpf-commercial-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
  padding: 10px;
  border-radius: 9px;
  background: var(--el-fill-color-light);
}

.tpf-option-copy {
  display: inline-flex;
  flex-direction: column;
  vertical-align: middle;

  strong {
    color: var(--el-text-color-primary);
    font-size: 12px;
    font-weight: 550;
  }

  small {
    color: var(--el-text-color-secondary);
    font-size: 10px;
  }
}

.tpf-hint {
  margin: 5px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 10px;
  line-height: 1.4;

  &.is-warning {
    color: var(--el-color-warning-dark-2);
  }

  &.is-info {
    color: var(--el-color-primary);
  }
}

.tpf-policy {
  display: flex;
  gap: 10px;
  padding: 11px 12px;
  border-radius: 12px;
  color: var(--el-text-color-regular);
  background: var(--el-color-info-light-9);

  strong {
    color: var(--el-text-color-primary);
    font-size: 12px;
  }

  p {
    margin: 3px 0 6px;
    font-size: 10px;
    line-height: 1.5;
  }
}

.tpf-policy-icon {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  flex: 0 0 22px;
  border-radius: 50%;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  background: var(--el-color-primary);
}

.tpf-policy-links {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 12px;

  a {
    color: var(--el-color-primary);
    font-size: 10px;
    font-weight: 600;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}

:deep(.el-textarea__inner),
:deep(.el-select__wrapper) {
  border-radius: 9px;
}

:deep(.el-checkbox) {
  height: auto;
  margin-right: 0;
}
</style>
