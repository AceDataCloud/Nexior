<template>
  <div class="page">
    <model-selector v-model="model" class="model-selector" @select="onLoadModel" />
    <api-status v-if="application" :application="application" :initializing="initializing" />
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
import { IMessage, IMessageState, ROLE_ASSISTANT, ROLE_USER } from '@/operators/message/models';
import { defineComponent } from 'vue';
import Message from '@/components/chat/Message.vue';
import {
  IChatModel,
  IChatMessage,
  CHAT_MODEL_CHATGPT,
  IChatResponse,
  API_ID_CHATGPT,
  applicationOperator,
  IApplication,
  IChatMessageState
} from '@/operators';
import InputBox from '@/components/chat/InputBox.vue';
import ModelSelector from '@/components/chat/ModelSelector.vue';
import { chatOperator } from '@/operators';
import { ERROR_CODE_CANCELED, ERROR_CODE_UNKNOWN } from '@/constants/errorCode';
import axios from 'axios';
import ApiStatus from '@/components/common/ApiStatus.vue';
import { ROUTE_CHAT_CONVERSATION } from '@/router';

export interface IData {
  messages: IChatMessage[];
  model: IChatModel;
  application: IApplication | undefined;
  question: '';
  initializing: boolean;
  applied: boolean | undefined;
}

export default defineComponent({
  name: 'ChatConversation',
  components: {
    // Introduction,
    InputBox,
    ModelSelector,
    Message,
    ApiStatus
  },
  data(): IData {
    return {
      model: CHAT_MODEL_CHATGPT,
      question: '',
      initializing: false,
      applied: undefined,
      application: undefined,
      messages: []
    };
  },
  computed: {
    conversationId(): string | undefined {
      return this.$route.params.id?.toString();
    }
  },
  mounted() {
    console.log('mounted');
    this.onLoadModel();
  },
  methods: {
    async onLoadModel() {
      this.initializing = true;
      const { data: applications } = await applicationOperator.getAll({
        user_id: this.$store.state.user.id,
        api_id: this.model.apiId
      });
      this.initializing = false;
      if (!applications || applications?.items?.length === 0) {
        this.applied = false;
        return;
      }
      this.application = applications.items[0];
    },
    async onSubmitQuestion() {
      this.messages.push({
        content: this.question,
        role: ROLE_USER
      });
      this.question = '';

      await this.onFetchAnswer();
    },
    async onFetchAnswer() {
      const token = this.application?.credential?.token;
      const endpoint = this.application?.api?.endpoint;
      const question = this.messages[this.messages.length - 1].content;
      if (!token || !endpoint || !question) {
        console.error('no token or endpoint or question');
        return;
      }
      this.messages.push({
        content: '',
        role: ROLE_ASSISTANT,
        state: IChatMessageState.PENDING
      });
      // request server to get answer
      chatOperator
        .request(
          {
            question,
            conversation_id: this.conversationId,
            stateful: true
          },
          {
            token,
            endpoint,
            stream: (response: IChatResponse) => {
              this.messages[this.messages.length - 1].content = response.answer;
              if (!this.conversationId) {
                this.$router.push({
                  name: ROUTE_CHAT_CONVERSATION,
                  params: {
                    id: response.conversation_id
                  }
                });
              }
            }
          }
        )
        .then(() => {
          this.messages[this.messages.length - 1].state = IChatMessageState.FINISHED;
        })
        .catch((error) => {
          if (this.messages && this.messages.length > 0) {
            this.messages[this.messages.length - 1].state = IChatMessageState.FAILED;
          }
          if (axios.isCancel(error)) {
            this.messages[this.messages.length - 1].error = {
              code: ERROR_CODE_CANCELED
            };
          } else if (error?.response?.data && error?.response?.data.code) {
            const data = error?.response?.data;
            if (this.messages && this.messages.length > 0) {
              this.messages[this.messages.length - 1].error = data;
            }
          } else {
            if (this.messages && this.messages.length > 0) {
              this.messages[this.messages.length - 1].error = {
                code: ERROR_CODE_UNKNOWN
              };
            }
          }
        });
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
    .messages {
      .message {
        margin-bottom: 15px;
      }
    }
  }
  .bottom {
    width: 100%;
    height: 70px;
  }
}
</style>
