<template>
  <span class="report-entry">
    <el-tooltip effect="dark" :content="$t('common.button.report')" placement="top">
      <button
        type="button"
        class="btn-report"
        :aria-label="$t('common.button.report')"
        :title="$t('common.button.report')"
        @click.stop="onOpen"
      >
        <warning-icon :size="'1em' as any" aria-hidden="true" focusable="false" />
        <span v-if="showLabel" class="label">{{ $t('common.button.report') }}</span>
      </button>
    </el-tooltip>

    <report-dialog v-model:visible="visible" :service="service" :target-id="targetId" :snapshot="snapshot" />
  </span>
</template>

<script lang="ts">
import { WarningIcon } from '@acedatacloud/core/icons/components';
import { defineComponent } from 'vue';
import { ElTooltip } from 'element-plus';
import ReportDialog from '@/components/common/ReportDialog.vue';

export default defineComponent({
  name: 'ReportButton',
  components: {
    WarningIcon,
    ElTooltip,
    ReportDialog
  },
  props: {
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
    },
    showLabel: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      visible: false
    };
  },
  methods: {
    onOpen() {
      // Guests can reach this from a shared conversation; send them through the
      // usual deferred-login flow rather than failing the submit with a 401.
      if (!this.$store.getters.authenticated) {
        this.$store.dispatch('login', { redirect: this.$route.fullPath });
        return;
      }
      this.visible = true;
    }
  }
});
</script>

<style lang="scss" scoped>
.report-entry {
  display: inline-flex;
  // Sibling action chips are 24px tall el-buttons and the row is
  // `align-items: baseline`; a bare icon has no text baseline to align on, so
  // it floated ~3px high. Match their box height and center within it instead.
  align-self: center;
  align-items: center;
  min-height: 24px;
  // Siblings carry this so the row stays even once it wraps.
  margin-bottom: 10px;
}
.btn-report {
  display: inline-flex;
  align-items: center;
  padding: 0 2px;
  border: 0;
  background: transparent;
  margin-left: 5px;
  cursor: pointer;
  // `inherit` picked up the card's pale body color; use the same secondary
  // token the other muted controls (delete, copy) use.
  color: var(--el-text-color-secondary);
  line-height: 1;
  font-size: 15px;
  transition: color 0.15s ease;
  &:hover {
    color: var(--el-color-danger);
  }
  .label {
    margin-left: 4px;
    font-size: 12px;
  }
}
</style>
