<template>
  <div class="page">
    <model-selector v-model="model" class="model-selector" @select="onSelectModel" />
    <api-status
      :initializing="initializing"
      :application="application"
      :api-id="model.apiId"
      @refresh="onFetchApplications"
    />
    <div class="dialogue">
      <introduction v-if="messages && messages.length === 0" />
      <div v-else class="messages">
        <message v-for="(message, messageIndex) in messages" :key="messageIndex" :message="message" class="message" />
      </div>
    </div>
    <div class="bottom">
      <input-box v-model="question" @submit="onSubmitQuestion" />
    </div>
  </div>
</template>

<script lang="ts">
import axios from 'axios';
import { defineComponent } from 'vue';
import Message from '@/components/chat/Message.vue';
import {
  ROLE_ASSISTANT,
  ROLE_USER,
  IChatModel,
  IChatMessage,
  CHAT_MODEL_CHATGPT,
  applicationOperator,
  IApplication,
  IChatMessageState,
  IChatAskResponse,
  CHAT_MODEL_CHATGPT_16K,
  CHAT_MODEL_CHATGPT_BROWSING,
  CHAT_MODEL_CHATGPT4,
  CHAT_MODEL_CHATGPT4_BROWSING,
  chatOperator
} from '@/operators';
import InputBox from '@/components/chat/InputBox.vue';
import ModelSelector from '@/components/chat/ModelSelector.vue';
import { ERROR_CODE_CANCELED, ERROR_CODE_UNKNOWN } from '@/constants/errorCode';
import ApiStatus from '@/components/common/ApiStatus.vue';
import { ROUTE_CHAT_CONVERSATION, ROUTE_CHAT_CONVERSATION_NEW } from '@/router';

export interface IData {
  messages: IChatMessage[];
  model: IChatModel;
  applications: IApplication[] | undefined;
  question: '';
  initializing: boolean;
  applied: boolean | undefined;
}

export default defineComponent({
  name: 'ChatConversation',
  components: {
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
      applications: undefined,
      messages: []
    };
  },
  computed: {
    conversationId(): string | undefined {
      return this.$route.params.id?.toString();
    },
    application() {
      return this.applications?.find((application) => application.api?.id === this.model.apiId);
    }
  },
  watch: {
    conversationId(val) {
      if (val) {
        this.onFetchHistory(val);
      }
    }
  },
  async mounted() {
    await this.onFetchApplications();
    await this.onFetchHistory();
  },
  methods: {
    async onCreateNewConversation() {
      this.messages = [];
      await this.$router.push({
        name: ROUTE_CHAT_CONVERSATION_NEW
      });
    },
    async onSelectModel() {
      await this.onCreateNewConversation();
      await this.onFetchApplications();
    },
    async onFetchApplications() {
      this.initializing = true;
      const { data: applications } = await applicationOperator.getAll({
        user_id: this.$store.state.common.user.id,
        api_id: [
          CHAT_MODEL_CHATGPT.apiId,
          CHAT_MODEL_CHATGPT_16K.apiId,
          CHAT_MODEL_CHATGPT_BROWSING.apiId,
          CHAT_MODEL_CHATGPT4.apiId,
          CHAT_MODEL_CHATGPT4_BROWSING.apiId
        ]
      });
      this.initializing = false;
      this.applications = applications?.items;
    },
    async onSubmitQuestion() {
      this.messages.push({
        content: this.question,
        role: ROLE_USER
      });
      this.question = '';
      await this.onFetchAnswer();
    },
    async onFetchHistory(id?: string) {
      const { data: data } = await chatOperator.getConversation(id || this.conversationId);
      this.messages = data.messages || [];
    },
    async onFetchAnswer() {
      const token = this.application?.credential?.token;
      const endpoint = this.application?.api?.endpoint;
      const path = this.application?.api?.path;
      const question = this.messages[this.messages.length - 1].content?.trim();
      if (!token || !endpoint || !question || !path) {
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
        .askQuestion(
          {
            question,
            conversation_id: this.conversationId,
            stateful: true
          },
          {
            token,
            endpoint,
            path,
            stream: (response: IChatAskResponse) => {
              this.messages[this.messages.length - 1] = {
                role: ROLE_ASSISTANT,
                content: response.answer,
                state: IChatMessageState.ANSWERING
              };
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
          this.onFetchApplications();
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
  flex: 1;
  width: 100%;
  overflow-y: scroll;
  padding: 15px;
  height: 100%;
  flex-direction: column;
  display: flex;

  .model-selector {
    width: max-content;
    margin: auto;
    margin-bottom: 10px;
  }

  .dialogue {
    flex: 1;
    overflow-y: scroll;
    margin: 20px 0;
    .messages {
      padding-top: 30px;
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
