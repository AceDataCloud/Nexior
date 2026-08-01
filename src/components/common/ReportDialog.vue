<template>
  <el-dialog
    :model-value="visible"
    :title="$t('common.title.reportContent')"
    width="460"
    align-center
    append-to-body
    class="report-dialog"
    @update:model-value="$emit('update:visible', $event)"
    @click.stop
  >
    <p class="intro">{{ $t('common.message.reportIntro') }}</p>
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
    <template #footer>
      <el-button round @click="$emit('update:visible', false)">{{ $t('common.button.cancel') }}</el-button>
      <el-button type="primary" round :loading="submitting" @click="onSubmit">
        {{ $t('common.button.report') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton, ElDialog, ElInput, ElMessage, ElRadio, ElRadioGroup } from 'element-plus';
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
  name: 'ReportDialog',
  components: {
    ElButton,
    ElDialog,
    ElInput,
    ElRadio,
    ElRadioGroup
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
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
  emits: ['update:visible'],
  data() {
    return {
      submitting: false,
      reason: '' as IContentReportReason | '',
      detail: '',
      reasons: REASONS
    };
  },
  watch: {
    visible(value: boolean) {
      if (value) {
        this.reason = '';
        this.detail = '';
      }
    }
  },
  methods: {
    truncate(value: unknown): unknown {
      if (typeof value !== 'string') return value;
      return value.length > MAX_SNAPSHOT_TEXT ? `${value.slice(0, MAX_SNAPSHOT_TEXT)}…` : value;
    },
    async onSubmit() {
      if (!this.reason) {
        ElMessage.warning(this.$t('common.message.reportReasonRequired'));
        return;
      }
      this.submitting = true;
      try {
        const snapshot = this.snapshot
          ? Object.fromEntries(Object.entries(this.snapshot).map(([k, v]) => [k, this.truncate(v)]))
          : undefined;
        await contentReportOperator.create({
          service: this.service,
          target_id: this.targetId,
          reason: this.reason,
          detail: this.detail,
          snapshot
        });
        this.$emit('update:visible', false);
        ElMessage.success(this.$t('common.message.reportSuccess'));
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
.report-dialog {
  .intro {
    color: var(--el-text-color-regular);
    font-size: 13px;
    margin-bottom: 12px;
  }
  .reasons {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
    .reason {
      width: 100%;
      margin-right: 0;
    }
  }
  .detail {
    margin-top: 12px;
  }
}
</style>
