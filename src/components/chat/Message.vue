<template>
  <div :class="'message ' + message.role" :role="message.role">
    <div class="content">
      <markdown-renderer v-if="!Array.isArray(message.content)" :content="message?.content" />
      <div v-else>
        <div v-for="(item, index) in message.content" :key="index">
          <img v-if="item.type === 'image_url'" :src="item.image_url" fit="cover" class="image" />
          <markdown-renderer v-if="item.type === 'text'" :key="index" :content="item.text" />
        </div>
      </div>
      <answering-mark v-if="message.state === messageState.PENDING" />
    </div>
    <div class="operations">
      <copy-to-clipboard v-if="!Array.isArray(message.content)" :content="message.content" class="btn-copy" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import AnsweringMark from './AnsweringMark.vue';
import copy from 'copy-to-clipboard';
import { ElImage } from 'element-plus';
import MarkdownRenderer from '@/components/common/MarkdownRenderer.vue';
import { IChatMessage, IChatMessageState } from '@/operators';
import CopyToClipboard from '../common/CopyToClipboard.vue';
interface IData {
  copied: boolean;
  messageState: typeof IChatMessageState;
}

export default defineComponent({
  name: 'Message',
  components: {
    CopyToClipboard,
    AnsweringMark,
    MarkdownRenderer,
    ElImage
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
      messageState: IChatMessageState
    };
  },
  computed: {
    // conversationId() {
    //   return this.$route.params?.id?.toString();
    // }
  },
  methods: {
    onCopy() {
      copy(this.message.content.toString(), {
        debug: true
      });
      this.copied = true;
      setTimeout(() => {
        this.copied = false;
      }, 3000);
    }
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
  &[role='system'] {
    display: none;
  }
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
    max-width: 800px;
    .image {
      max-width: 100%;
      max-height: 300px;
      margin: 5px 0;
      border-radius: 10px;
    }
  }

  .operations {
    display: block;
    .btn-copy {
      color: var(--el-text-color-regular);
      font-size: 14px;
    }
  }
}
</style>
