<template>
  <layout>
    <template #chatdoc>
      <div class="wrapper">
        <conversations class="side" />
        <div class="chat">
          <div class="status">
            <application-status
              :show-price="false"
              :initializing="initializing"
              :application="application"
              :need-apply="needApply"
              :service="service"
              @refresh="$store.dispatch('chatdoc/getApplications')"
            />
          </div>
          <div class="dialogue">
            <div class="messages">
              <message
                v-for="(message, messageIndex) in messages"
                :key="messageIndex"
                :message="message"
                class="message"
              />
            </div>
          </div>
          <div class="bottom">
            <input-box
              :disabled="answering"
              :question="question"
              @update:question="question = $event"
              @submit="onSubmit"
            />
          </div>
        </div>
      </div>
    </template>
  </layout>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Layout from '@/layouts/Chatdoc.vue';
import { chatdocOperator } from '@/operators';
import Conversations from '@/components/chatdoc/Conversations.vue';
import Message from '@/components/chatdoc/Message.vue';
import InputBox from '@/components/chatdoc/InputBox.vue';
import {
  ERROR_CODE_CANCELED,
  ERROR_CODE_NOT_APPLIED,
  ERROR_CODE_UNKNOWN,
  ROLE_ASSISTANT,
  ROLE_USER
} from '@/constants';
import { ROUTE_CHATDOC_CONVERSATION } from '@/router';
import axios from 'axios';
import { isJSONString } from '@/utils/is';
import { IService, Status } from '@/models';
import ApplicationStatus from '@/components/application/Status.vue';
import { IChatdocConversationResponse, IChatdocConversation, IChatdocMessageState, IChatdocRepository } from '@/models';

export default defineComponent({
  name: 'ChatdocConversation',
  components: {
    Layout,
    Conversations,
    Message,
    InputBox,
    ApplicationStatus
  },
  data() {
    return {
      loading: false,
      repositoryId: this.$route.params.repositoryId.toString(),
      answering: false,
      question: ''
    };
  },
  computed: {
    messages: {
      get() {
        return (
          this.conversations?.find(
            (conversation: IChatdocConversation) => conversation.id === this.$route.params.conversationId?.toString()
          )?.messages || []
        );
      },
      set(messages: any[]) {
        console.debug('set messages', messages);
      }
    },
    repository(): IChatdocRepository | undefined {
      return this.$store.state?.chatdoc?.repositories?.find((repository) => repository.id === this.repositoryId);
    },
    conversations(): IChatdocConversation[] | undefined {
      return this.repository?.conversations;
    },
    conversationId(): string | undefined {
      return this.$route.params.conversationId?.toString();
    },
    application() {
      return this.$store.state.chatdoc.application;
    },
    credential() {
      return this.$store.state.chatdoc.credential;
    },
    needApply() {
      return this.$store.state.chatdoc.status.getApplications === Status.Success && !this.application;
    },
    initializing() {
      return this.$store.state.chatdoc.status.getApplications === Status.Request;
    },
    service(): IService | undefined {
      return this.$store.state.chatdoc.service;
    }
  },
  async mounted() {
    console.debug('start get conversations');
    this.loading = true;
    this.$store.dispatch('chatdoc/getConversations', { repositoryId: this.repositoryId }).finally(() => {
      this.loading = false;
    });
  },
  methods: {
    async onSubmit() {
      this.messages.push({
        content: this.question,
        role: ROLE_USER
      });
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
      console.debug(this.onFetchAnswer, 'validated', question);
      // reset question and references
      this.question = '';
      if (!token || !question) {
        console.error('no token or endpoint or question');
        this.messages.push({
          error: {
            code: ERROR_CODE_NOT_APPLIED
          },
          role: ROLE_ASSISTANT,
          state: IChatdocMessageState.FAILED
        });
        return;
      }
      let conversationId = this.conversationId;
      this.messages.push({
        content: '',
        role: ROLE_ASSISTANT,
        state: IChatdocMessageState.PENDING
      });
      console.debug('start to get answer', this.messages);
      this.onScrollDown();
      // request server to get answer
      this.answering = true;
      chatdocOperator
        .chatConversation(
          {
            repositoryId: this.repositoryId,
            question,
            id: this.conversationId
          },
          {
            token,
            stream: (response: IChatdocConversationResponse) => {
              this.messages[this.messages.length - 1] = {
                role: ROLE_ASSISTANT,
                content: response.answer,
                state: IChatdocMessageState.ANSWERING
              };
              conversationId = response.id;
              this.onScrollDown();
            }
          }
        )
        .then(async () => {
          console.debug('finished fetch answer');
          this.messages[this.messages.length - 1].state = IChatdocMessageState.FINISHED;
          await this.$store.dispatch('chatdoc/setConversation', {
            id: conversationId,
            messages: this.messages,
            repositoryId: this.repositoryId
          });
          this.answering = false;
          if (!this.conversationId) {
            console.debug('push to conversation', conversationId);
            await this.$router.push({
              name: ROUTE_CHATDOC_CONVERSATION,
              params: {
                conversationId: conversationId,
                repositoryId: this.repositoryId
              }
            });
          }
          this.onScrollDown();
          await this.$store.dispatch('chatdoc/getConversations', { repositoryId: this.repositoryId });
        })
        .catch((error) => {
          if (this.messages && this.messages.length > 0) {
            this.messages[this.messages.length - 1].state = IChatdocMessageState.FAILED;
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
.wrapper {
  display: flex;
  flex-direction: row;
  height: 100%;
  width: 100%;
}
.chat {
  flex: 1;
  width: calc(100% - 300px);
  padding: 15px;
  flex-direction: column;
  height: 100%;
  display: flex;

  .status {
    margin-bottom: 10px;
  }

  .dialogue {
    flex: 1;
    overflow-y: scroll;
    margin: 15px 0;
    position: relative;
    .messages {
      .message {
        margin-bottom: 15px;
      }
    }
  }
  .bottom {
    width: 100%;
    display: flex;
    flex-direction: column;
  }
}
</style>
