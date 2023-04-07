<template>
  <markdown-renderer :content="content.value" />
  <el-alert v-if="error" :title="error?.detail" type="error" />
</template>

<script lang="ts">
import { IContent, IError } from '@/operators/message/models';
import { defineComponent } from 'vue';
import MarkdownRenderer from '@/components/common/MarkdownRenderer.vue';
import { ElAlert } from 'element-plus';

export default defineComponent({
  name: 'MessageContent',
  components: {
    MarkdownRenderer,
    ElAlert
  },
  props: {
    content: {
      type: Object as () => IContent,
      required: true
    },
    error: {
      type: Object as () => IError | undefined,
      required: false,
      default() {
        return undefined;
      }
    }
  },
  computed: {
    conversationId() {
      return this.$route.params?.id?.toString();
    }
  }
});
</script>
