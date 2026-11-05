<template>
  <el-dialog
    :model-value="visible"
    :title="$t('common.title.reportContent')"
    width="min(460px, calc(100vw - 32px))"
    align-center
    append-to-body
    class="report-dialog"
    @update:model-value="$emit('update:visible', $event)"
    @click.stop
  >
    <content-report-form
      v-if="visible"
      :service="service"
      :target-id="targetId"
      :snapshot="snapshot"
      @cancel="$emit('update:visible', false)"
      @submitted="onSubmitted"
    />
  </el-dialog>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import { ElDialog, ElMessage } from 'element-plus';
import ContentReportForm from './ContentReportForm.vue';

export default defineComponent({
  name: 'ReportDialog',
  components: { ElDialog, ContentReportForm },
  props: {
    visible: { type: Boolean, default: false },
    service: { type: String, required: true },
    targetId: { type: String, default: '' },
    snapshot: { type: Object as PropType<Record<string, unknown>>, default: undefined }
  },
  emits: ['update:visible'],
  methods: {
    onSubmitted() {
      this.$emit('update:visible', false);
      ElMessage.success(this.$t('common.message.reportSuccess'));
    }
  }
});
</script>
