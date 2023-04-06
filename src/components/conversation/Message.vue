<template>
  <div class="message">
    <el-image :src="author.avatar" class="icon" />
    <message-content :content="content" class="content" :error="error" />
  </div>
</template>

<script lang="ts">
import { IBot, IUser } from '@/operators';
import { IContent, IError } from '@/operators/message/models';
import { defineComponent } from 'vue';
import MessageContent from './MessageContent.vue';
import { ElImage } from 'element-plus';

export default defineComponent({
  name: 'Message',
  components: {
    MessageContent,
    ElImage
  },
  props: {
    content: {
      type: Object as () => IContent,
      required: true
    },
    author: {
      type: Object as () => IUser | IBot,
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

<style lang="scss" scoped>
.message {
  display: flex;
  flex-direction: row;
  .icon {
    width: 30px;
    height: 30px;
    margin-right: 20px;
    border-radius: 3px;
    min-width: 30px;
  }
  .content {
    flex: 1;
  }
}
</style>
