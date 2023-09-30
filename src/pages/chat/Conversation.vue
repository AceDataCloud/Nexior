<template>
  <div class="page">
    <div v-for="(message, messageIndex) in messages" :key="messageIndex">
      <message :message="message" class="message" />
    </div>
  </div>
</template>

<script lang="ts">
import { IMessage, ROLE_ASSISTANT, ROLE_SYSTEM, ROLE_USER } from '@/operators/message/models';
import { defineComponent } from 'vue';
import Message from '@/components/chat/Message.vue';
export interface IData {
  messages: IMessage[];
}

export default defineComponent({
  name: 'ChatConversation',
  components: {
    // Introduction,
    // InputBox,
    // ModelSelector,
    Message
  },
  data(): IData {
    return {
      messages: [
        {
          role: ROLE_USER,
          content: 'hello'
        },
        {
          role: ROLE_ASSISTANT,
          content: 'hello, how can I assist you?'
        }
      ]
    };
  }
});
</script>

<style lang="scss" scoped>
.page {
  padding: 20px;
  .message {
    margin-bottom: 10px;
  }
}
</style>
