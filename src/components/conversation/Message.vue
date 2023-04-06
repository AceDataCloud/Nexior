<template>
  <div class="message">
    <el-image :src="author.avatar" class="icon" />
    <message-content :content="content" class="content" />
  </div>
</template>

<script lang="ts">
import { IBot, IUser } from '@/operators';
import { IContent } from '@/operators/message/models';
import { defineComponent } from 'vue';
import MessageContent from './MessageContent.vue';

export default defineComponent({
  name: 'Message',
  components: {
    MessageContent
  },
  props: {
    content: {
      type: Object as () => IContent,
      required: true
    },
    author: {
      type: Object as () => IUser | IBot,
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

<style lang="scss" scoped>
.message {
  display: flex;
  flex-direction: row;
  .icon {
    width: 100px;
  }
  .content {
    flex: 1;
  }
}
</style>
