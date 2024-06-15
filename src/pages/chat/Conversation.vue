<template>
  <layout>
    <template #chat>
      <model-selector2 class="selector" />
      <application-status
        class="status"
        :initializing="initializing"
        :application="application"
        :need-apply="needApply"
        :service="service"
        @refresh="$store.dispatch('chat/getApplication')"
      />
      <div class="dialogue">
        <introduction v-if="messages.length === 0" @draft="onDraft" />
        <div v-else class="messages">
          <message
            v-for="(message, messageIndex) in messages"
            :key="messageIndex"
            :message="message"
            :application="application"
            class="message"
          />
        </div>
      </div>

      <div class="bottom">
        <input-box
          :disabled="answering"
          :question="question"
          :references="references"
          @update:question="question = $event"
          @update:references="references = $event"
          @submit="onSubmit"
        />
      </div>
    </template>
  </layout>
</template>

<script lang="ts">
import axios from 'axios';
import { defineComponent } from 'vue';
import Message from '@/components/chat/Message.vue';
import { ROLE_ASSISTANT, ROLE_USER } from '@/constants';
import { IChatModel, IChatMessageState, IChatConversationResponse, IChatConversation, IChatMessage } from '@/models';
import InputBox from '@/components/chat/InputBox.vue';
import ModelSelector2 from '@/components/chat/ModelSelector2.vue';
import { ERROR_CODE_CANCELED, ERROR_CODE_NOT_APPLIED, ERROR_CODE_UNKNOWN } from '@/constants/errorCode';
import { ROUTE_CHAT_CONVERSATION, ROUTE_CHAT_CONVERSATION_NEW } from '@/router';
import { Status } from '@/models';
import Introduction from '@/components/chat/Introduction.vue';
import Layout from '@/layouts/Chat.vue';
import { isJSONString } from '@/utils/is';
import { chatOperator } from '@/operators';
import ApplicationStatus from '@/components/application/Status.vue';

export interface IData {
  question: string;
  references: string[];
  answering: boolean;
  messages: IChatMessage[];
}

export default defineComponent({
  name: 'ChatConversation',
  components: {
    InputBox,
    Introduction,
    ModelSelector2,
    Message,
    ApplicationStatus,
    Layout
  },
  data(): IData {
    return {
      question: '',
      references: [],
      answering: false,
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
    service() {
      return this.$store.state.chat.service;
    },
    application() {
      return this.$store.state.chat.application;
    },
    credential() {
      return this.$store.state.chat?.credential;
    },
    needApply() {
      return this.$store.state.chat.status.getApplication === Status.Success && !this.application;
    },
    conversations() {
      return this.$store.state.chat.conversations;
    },
    initializing() {
      return this.$store.state.chat.status.getApplication === Status.Request;
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
    async onDraft(question: string) {
      this.question = question;
      this.onSubmit();
    },
    async onCreateNewConversation() {
      await this.$router.push({
        name: ROUTE_CHAT_CONVERSATION_NEW
      });
    },
    async onModelChanged() {
      await this.onCreateNewConversation();
      await this.$store.dispatch('chat/getApplication');
    },
    async onSubmit() {
      if (this.references.length > 0) {
        let content = [];
        content.push({
          type: 'text',
          text: this.question
        });
        for (let i = 0; i < this.references.length; i++) {
          content.push({
            type: 'image_url',
            image_url: this.references[i]
          });
        }
        this.messages.push({
          content: content,
          role: ROLE_USER
        });
      } else {
        this.messages.push({
          content: this.question,
          role: ROLE_USER
        });
      }
      console.debug('onSubmit', this.question, this.references);
      await this.onFetchAnswer();
    },
    async onScrollDown() {
      setTimeout(() => {
        const container = document.querySelector('.dialogue') as HTMLDivElement;
        if (!container || !this.messages || this.messages.length === 0) {
          return;
        }
        container.scrollTop = container?.scrollHeight;
      }, 0);
    },
    async onFetchAnswer() {
      const token = this.credential?.token;
      const question = this.question;
      const references = this.references;
      console.debug('validated', question, references);
      // reset question and references
      this.question = '';
      this.references = [];
      if (!token || !question) {
        console.error('no token or endpoint or question');
        this.messages.push({
          error: {
            code: ERROR_CODE_NOT_APPLIED
          },
          role: ROLE_ASSISTANT,
          state: IChatMessageState.FAILED
        });
        return;
      }
      let conversationId = this.conversationId;
      this.messages.push({
        content: '',
        role: ROLE_ASSISTANT,
        state: IChatMessageState.PENDING
      });
      console.debug('start to get answer', this.messages);
      this.onScrollDown();
      // request server to get answer
      this.answering = true;
      chatOperator
        .chatConversation(
          {
            question,
            model: this.model.name,
            references,
            id: this.conversationId,
            stateful: true
          },
          {
            token,
            stream: (response: IChatConversationResponse) => {
              console.debug('stream response', response);
              this.messages[this.messages.length - 1] = {
                role: ROLE_ASSISTANT,
                content: response.answer,
                state: IChatMessageState.ANSWERING
              };
              conversationId = response?.id;
              this.onScrollDown();
            }
          }
        )
        .then(async () => {
          console.debug('finished fetch answer', this.messages);
          this.messages[this.messages.length - 1].state = IChatMessageState.FINISHED;
          await this.$store.dispatch('chat/setConversation', {
            id: conversationId,
            messages: this.messages
          });
          this.answering = false;
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
          await this.$store.dispatch('chat/getApplication');
        })
        .catch((error) => {
          if (this.messages && this.messages.length > 0) {
            this.messages[this.messages.length - 1].state = IChatMessageState.FAILED;
          }
          console.error(error);
          if (axios.isCancel(error)) {
            this.messages[this.messages.length - 1].error = {
              code: ERROR_CODE_CANCELED
            };
          } else if (error?.response?.data) {
            let data = error?.response?.data;
            if (isJSONString(data)) {
              data = JSON.parse(data);
            }
            if (this.messages && this.messages.length > 0) {
              this.messages[this.messages.length - 1].error = data.error;
            }
          } else {
            if (this.messages && this.messages.length > 0) {
              this.messages[this.messages.length - 1].error = {
                code: ERROR_CODE_UNKNOWN
              };
            }
          }
          this.answering = false;
        });
    }
  }
});
</script>

<style lang="scss" scoped>
.selector {
  width: max-content;
  margin-bottom: 10px;
  position: absolute;
  left: 10px;
  top: 5px;
}

.dialogue {
  flex: 1;
  width: 100%;
  max-width: 800px;
  margin: 15px auto;
  overflow-y: auto;
  position: relative;
  .messages {
    padding-top: 30px;
    .message {
      margin-bottom: 15px;
    }
  }
}
.bottom {
  width: 100%;
}

@media (max-width: 767px) {
  .status {
    margin-top: 20px;
  }
}
</style>
