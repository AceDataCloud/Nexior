<template>
  <el-dialog
    class="dialog-policy"
    :model-value="visible"
    :title="$t('application.message.policy')"
    width="700px"
    @close="$emit('update:visible', false)"
  >
    <markdown-renderer :content="policyText" />
  </el-dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElDialog } from 'element-plus';
import policyText from '../../assets/mds/policy.md';
import MarkdownRenderer from '@/components/common/MarkdownRenderer.vue';

export default defineComponent({
  name: 'ApplicationPolicy',
  components: {
    ElDialog,
    MarkdownRenderer
  },
  props: {
    visible: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  emits: ['update:visible'],
  data() {
    return {
      policyText
    };
  },
  methods: {}
});
</script>

<style lang="scss">
.dialog-policy {
  height: 400px;
  overflow-y: scroll;
}
</style>
