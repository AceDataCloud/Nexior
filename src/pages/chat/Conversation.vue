<template>
  <div class="page">
    <model-selector v-model="model" class="model-selector" @select="onSelectModel" />
    <api-status :application="application" />
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
import { ROLE_ASSISTANT, ROLE_USER } from '@/operators/message/models';
import { defineComponent } from 'vue';
import Message from '@/components/chat/Message.vue';
import {
  IChatModel,
  IChatMessage,
  CHAT_MODEL_CHATGPT,
  API_ID_CHATGPT,
  applicationOperator,
  IApplication,
  IChatMessageState,
  IChatAskResponse,
  IChatConversationAction
} from '@/operators';
import InputBox from '@/components/chat/InputBox.vue';
import ModelSelector from '@/components/chat/ModelSelector.vue';
import { chatOperator } from '@/operators';
import { ERROR_CODE_CANCELED, ERROR_CODE_UNKNOWN } from '@/constants/errorCode';
import axios from 'axios';
import ApiStatus from '@/components/common/ApiStatus.vue';
import { ROUTE_CHAT_CONVERSATION, ROUTE_CHAT_CONVERSATION_NEW } from '@/router';

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
  async mounted() {
    console.log('mounted');
    await this.onFetchModel();
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
      await this.onFetchModel();
    },
    async onFetchModel() {
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
    async onFetchHistory() {
      if (!this.conversationId) {
        return;
      }
      const endpoint = this.application?.api?.endpoint;
      const path = this.application?.api?.path;
      console.log(endpoint, path);
      if (!endpoint || !path) {
        console.error('no endpoint or path');
        return;
      }
      const { data: data } = await chatOperator.conversations(
        {
          action: IChatConversationAction.RETRIEVE,
          id: this.conversationId
        },
        {
          endpoint,
          path: `${path}/conversations`
        }
      );
      this.messages = data.messages || [];
    },
    async onFetchAnswer() {
      const token = this.application?.credential?.token;
      const endpoint = this.application?.api?.endpoint;
      const path = this.application?.api?.path;
      const question = this.messages[this.messages.length - 1].content;
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
        .ask(
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
          this.onFetchModel();
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
    padding: 15px;
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
