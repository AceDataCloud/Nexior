<template>
  <div class="page">
    <model-selector v-model="model" class="model-selector" />
    <div class="main">
      <introduction v-if="messages && messages.length === 0" />
      <div v-else class="messages">
        <div v-for="(message, messageIndex) in messages" :key="messageIndex">
          <message :message="message" class="message" />
        </div>
      </div>
    </div>
    <div class="bottom">
      <input-box v-model="question" @submit="onSubmitQuestion" />
    </div>
  </div>
</template>

<script lang="ts">
import { IMessage, ROLE_ASSISTANT, ROLE_USER } from '@/operators/message/models';
import { defineComponent } from 'vue';
import Message from '@/components/chat/Message.vue';
import { IChatModel, IChatMessage, CHAT_MODEL_CHATGPT, IChatResponse } from '@/operators';
import InputBox from '@/components/chat/InputBox.vue';
import ModelSelector from '@/components/chat/ModelSelector.vue';
import { chatOperator } from '@/operators';

export interface IData {
  messages: IChatMessage[];
  model: IChatModel;
  question: '';
}

export default defineComponent({
  name: 'ChatConversation',
  components: {
    // Introduction,
    InputBox,
    ModelSelector,
    Message
  },
  data(): IData {
    return {
      question: '',
      model: CHAT_MODEL_CHATGPT,
      messages: [
        {
          role: ROLE_USER,
          content: 'hello'
        },
        {
          role: ROLE_ASSISTANT,
          content: '## ok \n\n hello, how can I assist you? \n ```python\nprint("hello")\n```'
        },
        {
          role: ROLE_USER,
          content: 'hello'
        },
        {
          role: ROLE_ASSISTANT,
          content: '## ok \n\n hello, how can I assist you? \n ```python\nprint("hello")\n```'
        },
        {
          role: ROLE_USER,
          content: 'hello'
        },
        {
          role: ROLE_ASSISTANT,
          content: '## ok \n\n hello, how can I assist you? \n ```python\nprint("hello")\n```'
        },
        {
          role: ROLE_USER,
          content: 'hello'
        },
        {
          role: ROLE_ASSISTANT,
          content: '## ok \n\n hello, how can I assist you? \n ```python\nprint("hello")\n```'
        },
        {
          role: ROLE_USER,
          content: 'hello'
        },
        {
          role: ROLE_ASSISTANT,
          content: '## ok \n\n hello, how can I assist you? \n ```python\nprint("hello")\n```'
        }
      ]
    };
  },
  computed: {
    conversationId(): string | undefined {
      return this.$route.params.id?.toString();
    }
  },
  methods: {
    onSubmitQuestion() {
      this.messages.push({
        content: this.question,
        role: ROLE_USER
      });
      this.question = '';
    },
    async onFetchAnswer() {
      const apiId = this.model;
      const { data: response }: IChatResponse = await chatOperator.request(
        {
          question: this.question,
          conversation_id: this.conversationId,
          stateful: true
        },
        {
          api_id: apiId,
          stream: (response: IChatResponse) => {
            console.log('response', response);
          }
        }
      );
      console.log('this.response', response);
    }
  }
});
</script>

<style lang="scss" scoped>
.page {
  padding: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: 100%;
  .main {
    flex: 1;
    width: 100%;
    overflow-y: scroll;
    padding: 15px 0;
  }
  .bottom {
    width: 100%;
    height: 70px;
  }
}
</style>
