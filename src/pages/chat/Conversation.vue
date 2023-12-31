<template>
  <div class="page">
    <model-selector class="model-selector" />
    <api-status
      :initializing="initializing"
      :application="application"
      :api-id="model.apiId"
      @refresh="$store.dispatch('chat/getApplications')"
    />
    <div class="dialogue">
      <introduction v-if="messages && messages.length === 0" />
      <div v-else class="messages">
        <message v-for="(message, messageIndex) in messages" :key="messageIndex" :message="message" class="message" />
      </div>
    </div>
    <div class="bottom">
      <input-box
        :question="question"
        :references="references"
        @update:question="question = $event"
        @update:references="references = $event"
        @submit="onSubmitQuestion"
      />
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
  IApplication,
  IChatMessageState,
  IChatAskResponse,
  chatOperator,
  IChatConversation,
  IChatMessage
} from '@/operators';
import InputBox from '@/components/chat/InputBox.vue';
import ModelSelector from '@/components/chat/ModelSelector.vue';
import { ERROR_CODE_CANCELED, ERROR_CODE_UNKNOWN } from '@/constants/errorCode';
import ApiStatus from '@/components/common/ApiStatus.vue';
import { ROUTE_CHAT_CONVERSATION, ROUTE_CHAT_CONVERSATION_NEW } from '@/router';
import { Status } from '@/store/common/models';
import { log } from '@/utils/log';

export interface IData {
  question: string;
  references: string[];
  messages: IChatMessage[];
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
      question: '',
      references: [],
      messages:
        this.$store.state.chat.conversations?.find(
          (conversation: IChatConversation) => conversation.id === this.$route.params.id?.toString()
        )?.messages || []
    };
  },
  computed: {
    model() {
      return this.$store.state.chat.model;
    },
    conversationId(): string | undefined {
      return this.$route.params.id?.toString();
    },
    conversation() {
      return this.$store.state.chat.conversations?.find(
        (conversation: IChatConversation) => conversation.id === this.conversationId
      );
    },
    application() {
      return this.applications?.find((application: IApplication) => application.api?.id === this.model.apiId);
    },
    applications() {
      return this.$store.state.chat.applications;
    },
    conversations() {
      return this.$store.state.chat.conversations;
    },
    initializing() {
      return this.$store.state.chat.getApplicationsStatus === Status.Request;
    }
  },
  watch: {
    model(val: IChatModel) {
      if (val) {
        this.onModelChanged();
      }
    },
    conversationId(val: string) {
      if (!val) {
        this.messages = [];
      } else {
        this.messages =
          this.conversations?.find((conversation: IChatConversation) => conversation.id === val)?.messages || [];
        this.onScrollDown();
      }
    }
  },
  mounted() {
    this.onScrollDown();
  },
  methods: {
    async onCreateNewConversation() {
      await this.$router.push({
        name: ROUTE_CHAT_CONVERSATION_NEW
      });
    },
    async onModelChanged() {
      await this.onCreateNewConversation();
      await this.$store.dispatch('chat/getApplications');
    },
    async onSubmitQuestion() {
      this.messages.push({
        content: this.question,
        role: ROLE_USER
      });
      this.question = '';
      await this.onFetchAnswer();
    },
    async onScrollDown() {
      setTimeout(() => {
        const container = document.querySelector('.dialogue') as HTMLDivElement;
        container.scrollTop = container.scrollHeight;
      }, 0);
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
      let conversationId = this.conversationId;
      this.messages.push({
        content: '',
        role: ROLE_ASSISTANT,
        state: IChatMessageState.PENDING
      });
      this.onScrollDown();
      // request server to get answer
      chatOperator
        .askQuestion(
          {
            question,
            references: this.references,
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
              conversationId = response.conversation_id;
              this.onScrollDown();
            }
          }
        )
        .then(async () => {
          log(this.onFetchAnswer, 'finished fetch answer');
          this.messages[this.messages.length - 1].state = IChatMessageState.FINISHED;
          await this.$store.dispatch('chat/setConversation', {
            id: conversationId,
            messages: this.messages
          });
          if (!this.conversationId) {
            await this.$router.push({
              name: ROUTE_CHAT_CONVERSATION,
              params: {
                id: conversationId
              }
            });
          }
          this.onScrollDown();
          await this.$store.dispatch('chat/getConversations');
          await this.$store.dispatch('chat/getApplications');
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
    height: 100px;
  }
}
</style>
