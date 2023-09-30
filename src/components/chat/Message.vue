<template>
  <div :class="'message ' + message.role">
    <div class="content">
      <markdown-renderer :content="message?.content" />
    </div>
  </div>
</template>

<script lang="ts">
import { IContent, IError, IMessage, IMessageState } from '@/operators/message/models';
import { defineComponent } from 'vue';
// import MessageContent from './MessageContent.vue';
import { ElImage, ElButton } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import copy from 'copy-to-clipboard';
import MarkdownRenderer from '@/components/common/MarkdownRenderer.vue';
import { IChatMessage } from '@/operators';

interface IData {
  copied: boolean;
  messageState: typeof IMessageState;
}

export default defineComponent({
  name: 'Message',
  components: {
    // MessageContent,
    // ElImage,
    // ElButton,
    // FontAwesomeIcon
    MarkdownRenderer
  },
  props: {
    message: {
      type: Object as () => IChatMessage,
      required: true
    }
  },
  emits: ['stop'],
  data(): IData {
    return {
      copied: false,
      messageState: IMessageState
    };
  },
  computed: {
    // conversationId() {
    //   return this.$route.params?.id?.toString();
    // }
  },
  methods: {
    // onCopy() {
    //   copy(this.content.value, {
    //     debug: true
    //   });
    //   this.copied = true;
    //   setTimeout(() => {
    //     this.copied = false;
    //   }, 3000);
    // },
    // onStop() {
    //   this.$emit('stop');
    // }
  }
});
</script>

<style lang="scss" scoped>
.message {
  display: flex;
  flex-direction: column;
  &.assistant {
    align-items: start;
    .content {
      background-color: var(--el-bg-color-page);
      color: var(--el-color-black);
      border-bottom-left-radius: 0;
    }
  }
  &.user {
    align-items: end;
    .content {
      background-color: var(--el-color-primary);
      color: var(--el-color-white);
      border-bottom-right-radius: 0;
    }
  }
  .content {
    border-radius: 10px;
    padding: 8px 15px;
    // background-color: aqua;
  }
}
</style>
