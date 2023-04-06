<template>
  <markdown-renderer :content="content.value" />
</template>

<script lang="ts">
import { IContent } from '@/operators/message/models';
import { defineComponent } from 'vue';
import MarkdownRenderer from '@/components/common/MarkdownRenderer.vue';

export default defineComponent({
  name: 'MessageContent',
  components: {
    MarkdownRenderer
  },
  props: {
    content: {
      type: Object as () => IContent,
      required: true
    }
  },
  data() {
    return {};
  },
  computed: {
    conversationId() {
      return this.$route.params?.id?.toString();
    }
  }
});
</script>
