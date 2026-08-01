<template>
  <div class="tiktok-publish-form">
    <p class="tpf-account">
      {{ $t('chat.actionConfirmation.tiktok.postingTo') }}
      <strong>{{ detail.creator_nickname }}</strong>
    </p>

    <p v-if="tooLong" class="tpf-error">
      {{ $t('chat.actionConfirmation.tiktok.tooLong', { max: detail.max_video_post_duration_sec }) }}
    </p>

    <div class="tpf-field">
      <label class="tpf-label" for="tpf-caption">{{ $t('chat.actionConfirmation.tiktok.caption') }}</label>
      <el-input
        id="tpf-caption"
        v-model="form.title"
        type="textarea"
        :rows="3"
        :maxlength="2200"
        :show-word-limit="!disabled"
        :disabled="disabled"
        :placeholder="$t('chat.actionConfirmation.tiktok.captionPlaceholder')"
      />
    </div>

    <!-- No default value: TikTok's guidelines require the user to pick the
         privacy level manually from the exact options creator_info returned. -->
    <div class="tpf-field">
      <label class="tpf-label" for="tpf-privacy">
        {{ $t('chat.actionConfirmation.tiktok.privacy') }}
        <span class="tpf-required">*</span>
      </label>
      <el-select
        id="tpf-privacy"
        v-model="form.privacy_level"
        :placeholder="$t('chat.actionConfirmation.tiktok.privacyPlaceholder')"
        :disabled="disabled"
        class="tpf-select"
      >
        <el-option
          v-for="opt in privacyOptions"
          :key="opt"
          :label="privacyLabel(opt)"
          :value="opt"
          :disabled="isPrivacyDisabled(opt)"
        />
      </el-select>
      <p v-if="selfOnlyBlocked" class="tpf-hint">
        {{ $t('chat.actionConfirmation.tiktok.brandedNotPrivate') }}
      </p>
    </div>

    <div class="tpf-field">
      <span class="tpf-label">{{ $t('chat.actionConfirmation.tiktok.interactions') }}</span>
      <div class="tpf-checks">
        <el-checkbox v-model="form.allow_comment" :disabled="disabled || detail.comment_disabled">
          {{ $t('chat.actionConfirmation.tiktok.allowComment') }}
        </el-checkbox>
        <!-- Duet and Stitch do not apply to photo posts. -->
        <template v-if="!detail.is_photo_post">
          <el-checkbox v-model="form.allow_duet" :disabled="disabled || detail.duet_disabled">
            {{ $t('chat.actionConfirmation.tiktok.allowDuet') }}
          </el-checkbox>
          <el-checkbox v-model="form.allow_stitch" :disabled="disabled || detail.stitch_disabled">
            {{ $t('chat.actionConfirmation.tiktok.allowStitch') }}
          </el-checkbox>
        </template>
      </div>
    </div>

    <div class="tpf-field">
      <el-checkbox v-model="form.commercial" :disabled="disabled">
        {{ $t('chat.actionConfirmation.tiktok.commercial') }}
      </el-checkbox>
      <div v-if="form.commercial" class="tpf-checks tpf-indent">
        <el-checkbox v-model="form.brand_organic_toggle" :disabled="disabled">
          {{ $t('chat.actionConfirmation.tiktok.yourBrand') }}
        </el-checkbox>
        <el-checkbox v-model="form.brand_content_toggle" :disabled="disabled || brandedContentBlocked">
          {{ $t('chat.actionConfirmation.tiktok.brandedContent') }}
        </el-checkbox>
        <p v-if="commercialLabel" class="tpf-hint">{{ commercialLabel }}</p>
        <p v-if="brandedContentBlocked" class="tpf-hint">
          {{ $t('chat.actionConfirmation.tiktok.brandedNotPrivate') }}
        </p>
      </div>
    </div>

    <p class="tpf-declaration">{{ musicDeclaration }}</p>
  </div>
</template>

<script lang="ts">
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

/**
 * `kind === 'tiktok.publish'` body for `<ActionConfirmationCard>`.
 *
 * The constraints here are TikTok guideline requirements, not preferences:
 * privacy options come from `creator_info` with no default, interaction
 * toggles start unchecked and grey out when the creator disabled them, and
 * branded content cannot be combined with a private post.
 */
export default defineComponent({
  name: 'TikTokPublishForm',
  props: {
    detail: {
      type: Object as PropType<ITikTokPublishDetail>,
      required: true
    },
    /** Suggested caption from the model; the user can edit it. */
    initialTitle: {
      type: String,
      default: ''
    },
    /** Video length, checked against `max_video_post_duration_sec`. */
    durationSec: {
      type: Number,
      default: 0
    },
    /** Resolved replay: freeze every control so history stays read-only. */
    disabled: {
      type: Boolean,
      default: false
    },
    /** Values the user actually submitted, replayed from the tool output. */
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
      return this.detail?.privacy_level_options ?? [];
    },
    tooLong(): boolean {
      const max = this.detail?.max_video_post_duration_sec ?? 0;
      return max > 0 && this.durationSec > max;
    },
    /** Branded content may not be private, so block it while SELF_ONLY. */
    brandedContentBlocked(): boolean {
      return this.form.privacy_level === SELF_ONLY;
    },
    /** …and symmetrically, block SELF_ONLY once branded content is on. */
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
    /** Two strings only — "branded content" and "both" share one. */
    musicDeclaration(): string {
      const branded = this.form.commercial && this.form.brand_content_toggle;
      const key = branded ? 'chat.actionConfirmation.tiktok.musicBranded' : 'chat.actionConfirmation.tiktok.music';
      return this.$t(key) as string;
    },
    isValid(): boolean {
      if (!this.form.privacy_level) return false;
      if (this.tooLong) return false;
      // Disclosure on ⇒ at least one of the two must be picked.
      if (this.form.commercial && !this.form.brand_organic_toggle && !this.form.brand_content_toggle) {
        return false;
      }
      return true;
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
    isValid: {
      immediate: true,
      handler(valid: boolean) {
        this.$emit('validity-change', valid);
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
      // Unknown option: show the raw value rather than dropping it — the
      // list must mirror what creator_info returned.
      return known[option] ? (this.$t(known[option]) as string) : option;
    },
    /** Read by the parent card on confirm. */
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

  .tpf-account {
    margin: 0;
    font-size: 13px;
    color: var(--el-text-color-regular);
  }

  .tpf-error {
    margin: 0;
    font-size: 12px;
    color: var(--el-color-danger);
  }

  .tpf-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }

  .tpf-label {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .tpf-required {
    color: var(--el-color-danger);
  }

  .tpf-select {
    width: 100%;
    min-width: 0;
  }

  .tpf-checks {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .tpf-indent {
    margin-top: 6px;
    padding-left: 20px;
    flex-direction: column;
    gap: 6px;
  }

  .tpf-hint {
    margin: 0;
    font-size: 11px;
    color: var(--el-text-color-secondary);
  }

  .tpf-declaration {
    margin: 0;
    font-size: 11px;
    line-height: 1.6;
    color: var(--el-text-color-secondary);
  }
}
</style>
