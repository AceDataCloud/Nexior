<template>
  <div class="content-report-form">
    <p class="intro">{{ $t('common.message.reportIntro') }}</p>
    <label v-if="requestTarget" class="target">
      <span>{{ $t('common.support.reportTarget') }}</span>
      <el-input v-model="target" maxlength="255" :placeholder="$t('common.support.reportTargetPlaceholder')" />
    </label>
    <el-radio-group v-model="reason" class="reasons">
      <el-radio v-for="item in reasons" :key="item" :value="item" class="reason">
        {{ $t(`common.reportReason.${item}`) }}
      </el-radio>
    </el-radio-group>
    <el-input
      v-model="detail"
      type="textarea"
      :rows="3"
      maxlength="2000"
      show-word-limit
      class="detail"
      :placeholder="$t('common.message.reportDetailPlaceholder')"
    />
    <div class="actions">
      <el-button round :disabled="submitting" @click="$emit('cancel')">{{ $t('common.button.cancel') }}</el-button>
      <el-button type="primary" round :loading="submitting" @click="onSubmit">
        {{ $t('common.button.report') }}
      </el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton, ElInput, ElMessage, ElRadio, ElRadioGroup } from 'element-plus';
import { contentReportOperator, IContentReportReason } from '@/operators';

const REASONS: IContentReportReason[] = [
  'sexual',
  'violence',
  'hate',
  'child_safety',
  'self_harm',
  'deception',
  'illegal',
  'ip',
  'other'
];

// Keep the snapshot small — it only needs to give a moderator enough context
// to judge the content once the user's own task row is gone.
const MAX_SNAPSHOT_TEXT = 1000;

export default defineComponent({
  name: 'ContentReportForm',
  components: {
    ElButton,
    ElInput,
    ElRadio,
    ElRadioGroup
  },
  props: {
    requestTarget: { type: Boolean, default: false },
    // Capability that produced the content, e.g. 'openaiimage', 'chat'.
    service: {
      type: String,
      required: true
    },
    targetId: {
      type: String,
      required: false,
      default: ''
    },
    // Prompt / result excerpt frozen alongside the report.
    snapshot: {
      type: Object as () => Record<string, unknown> | undefined,
      required: false,
      default: undefined
    }
  },
  emits: ['cancel', 'submitted'],
  data() {
    return {
      submitting: false,
      target: this.targetId,
      reason: '' as IContentReportReason | '',
      detail: '',
      reasons: REASONS
    };
  },
  methods: {
    truncate(value: unknown): unknown {
      if (typeof value !== 'string') return value;
      return value.length > MAX_SNAPSHOT_TEXT ? `${value.slice(0, MAX_SNAPSHOT_TEXT)}…` : value;
    },
    async onSubmit() {
      if (this.submitting) return;
      if (!this.$store.getters.authenticated) {
        this.$emit('cancel');
        this.$store.dispatch('login', { redirect: this.$route.fullPath });
        return;
      }
      if (this.requestTarget && !this.target.trim()) {
        ElMessage.warning(this.$t('common.support.reportTargetRequired'));
        return;
      }
      if (!this.reason) {
        ElMessage.warning(this.$t('common.message.reportReasonRequired'));
        return;
      }
      this.submitting = true;
      try {
        const snapshot = this.snapshot
          ? Object.fromEntries(Object.entries(this.snapshot).map(([k, v]) => [k, this.truncate(v)]))
          : undefined;
        const { data } = await contentReportOperator.create({
          service: this.service,
          target_id: this.target.trim(),
          reason: this.reason,
          detail: this.detail,
          snapshot
        });
        this.$emit('submitted', data.id);
      } catch {
        ElMessage.error(this.$t('common.message.reportFailed'));
      } finally {
        this.submitting = false;
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.content-report-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.intro {
  color: var(--el-text-color-regular);
  font-size: 13px;
}
.target {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.reasons {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
}
.reason {
  width: 100%;
  min-height: 32px;
  height: auto;
  margin-right: 0;
  white-space: normal;
}
.reason :deep(.el-radio__label) {
  white-space: normal;
  padding-block: 6px;
}
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
