<template>
  <layout @change-conversation="onChangeConversation($event)">
    <template #chat>
      <model-selector class="selector" @model-group-changed="onChangeConversation(undefined)" />
      <div :class="{ dialogue: true, empty: messages.length === 0 }">
        <div v-if="messages.length > 0" class="messages">
          <message
            v-for="(message, messageIndex) in messages"
            :key="messageIndex"
            :message="message"
            :messages="messages"
            :question="question"
            :application="application"
            class="message"
            @update:question="question = $event"
            @edit="onEdit"
            @restart="onRestart"
          />
        </div>
        <div class="starter">
          <composer
            v-model:question="question"
            :disabled="answering"
            :references="references"
            @update:references="references = $event"
            @submit="onSubmit"
            @stop="onStop"
          />
          <disclaimer class="disclaimer" />
        </div>
      </div>
    </template>
  </layout>
</template>

<script lang="ts">
import axios from 'axios';
import { defineComponent, ref } from 'vue';
import Message from '@/components/chat/Message.vue';
import { CHAT_MODEL_GROUPS, CHAT_MODELS, ROLE_ASSISTANT, ROLE_USER } from '@/constants';
import { IChatMessageState, IChatConversationResponse, IChatConversation, IChatMessage, BaseError } from '@/models';
import Composer from '@/components/chat/Composer.vue';
import ModelSelector from '@/components/chat/ModelSelector.vue';
import { ERROR_CODE_CANCELED, ERROR_CODE_NOT_APPLIED, ERROR_CODE_UNKNOWN } from '@/constants/errorCode';
import { ROUTE_CHAT_CONVERSATION, ROUTE_CHAT_CONVERSATION_NEW } from '@/router';
import { Status } from '@/models';
import Disclaimer from '@/components/chat/Disclaimer.vue';
import Layout from '@/layouts/Chat.vue';
import { isImageUrl, isJSONString } from '@/utils/is';
import { chatOperator } from '@/operators';

export interface IData {
  drawer: boolean;
  question: string;
  upload: boolean;
  references: string[];
  answering: boolean;
  messages: IChatMessage[];
  canceler: AbortController | undefined;
}

export default defineComponent({
  name: 'ChatConversation',
  components: {
    Composer,
    Disclaimer,
    ModelSelector,
    Message,
    Layout
  },
  data(): IData {
    return {
      drawer: false,
      question: '',
      references: [],
      upload: false,
      answering: false,
      canceler: undefined,
      messages:
        this.$store.state.chat.conversations?.find(
          (conversation: IChatConversation) => conversation.id === this.$route.params.id?.toString()
        )?.messages || []
    };
  },
  computed: {
    modelGroup() {
      return this.$store.state.chat.modelGroup;
    },
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
    applications() {
      return this.$store.state.chat.applications;
    },
    credential() {
      return this.$store.state.chat?.credential;
    },
    needApply() {
      return this.$store.state.chat.status.getApplications === Status.Success && !this.application;
    },
    conversations() {
      return this.$store.state.chat.conversations;
    },
    initializing() {
      return this.$store.state.chat.status.getApplications === Status.Request;
    }
  },
  watch: {
    async references(val) {
      console.log('references changed', val);
    },
    async modelGroup(val) {
      console.debug('modelGroup changed', val);
    },
    async conversationId(val) {
      console.debug('conversationId changed', val);
    }
  },
  async mounted() {
    await this.onGetService();
    await this.onGetApplication();
    await this.onGetConversations();
  },
  methods: {
    async onGetService() {
      console.debug('start onGetService');
      await this.$store.dispatch('chat/getService');
      console.debug('end onGetService');
    },
    async onGetApplication() {
      console.debug('start onGetApplication');
      await this.$store.dispatch('chat/getApplications');
      console.debug('end onGetApplication');
    },
    async onGetConversations() {
      console.debug('start onGetConversations');
      await this.$store.dispatch('chat/getConversations');
      console.debug('end onGetConversations');
    },
    async onDraft(question: string) {
      this.question = question;
      this.onSubmit();
    },
    async onStop() {
      if (this.canceler) {
        this.canceler.abort();
        this.answering = false;
      }
    },
    async onRestart(targetMessage: IChatMessage) {
      // 1. Clear the following message
      const targetIndex = this.messages.findIndex((message) => message === targetMessage);
      const problemMessage = this.messages[targetIndex - 1];
      // @ts-ignore
      let updatedMessages = [];
      if (targetIndex !== -1) {
        // @ts-ignore
        updatedMessages = this.messages.slice(0, targetIndex - 1);
        this.messages = this.messages.slice(0, targetIndex);
        // @ts-ignore
        this.references = [];
        if (typeof problemMessage.content === 'string') {
          this.question = problemMessage.content;
        } else if (Array.isArray(problemMessage.content)) {
          for (let i = 0; i < problemMessage?.content.length; i++) {
            if (problemMessage.content[i].type === 'image_url') {
              if (typeof problemMessage?.content?.[i]?.image_url === 'string') {
                // @ts-ignore
                this.references.push(problemMessage?.content?.[i]?.image_url);
              } else {
                // @ts-ignore
                this.references.push(problemMessage?.content?.[i]?.image_url?.url);
              }
            }
            if (problemMessage.content[i].type === 'file_url') {
              if (typeof problemMessage?.content?.[i]?.file_url === 'string') {
                // @ts-ignore
                this.references.push(problemMessage?.content?.[i]?.file_url);
              } else {
                // @ts-ignore
                this.references.push(problemMessage?.content?.[i]?.file_url?.url);
              }
            }
            if (problemMessage.content[i].type === 'text') {
              // @ts-ignore
              this.question = problemMessage.content[i].text;
            }
          }
        }
      }
      console.debug('onRestart!', this.question, JSON.stringify(this.references));
      // 2. Update the messages
      const token = this.credential?.token;
      const question = this.question;
      // reset question and references
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
      chatOperator
        .updateConversation(
          {
            id: this.conversationId,
            // @ts-ignore
            messages: updatedMessages
          },
          {
            token
          }
        )
        .then(async () => {
          await this.$store.dispatch('chat/setConversation', {
            id: conversationId,
            messages: this.messages
          });
          console.debug('finished update conversation', this.messages);
          // 3. Send restart questions
          console.debug('onRestart', this.question);
          await this.onRequest();
        })
        .catch((error) => {
          this.handleRequestError(error);
        });
    },
    async onEdit(targetMessage: IChatMessage, questionValue: string) {
      // 1. Clear the following message
      const targetIndex = this.messages.findIndex((message) => message === targetMessage);
      if (targetIndex !== -1) {
        this.messages = this.messages.slice(0, targetIndex);
      }
      this.question = questionValue;
      // 2. Update the messages
      const token = this.credential?.token;
      // reset question and references
      if (!token) {
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
      chatOperator
        .updateConversation(
          {
            id: this.conversationId,
            messages: this.messages
          },
          {
            token
          }
        )
        .then(async () => {
          await this.$store.dispatch('chat/setConversation', {
            id: conversationId,
            messages: this.messages
          });
          console.debug('finished update conversation', this.messages);
          // 3. Send edited questions
          this.messages.push({
            content: this.question,
            role: ROLE_USER
          });
          console.debug('onEdit', this.question);
          await this.onRequest();
        })
        .catch((error) => {
          this.handleRequestError(error);
        });
    },
    async onNewConversation() {
      this.$router.push({
        name: ROUTE_CHAT_CONVERSATION_NEW
      });
      this.messages = [];
      this.question = '';
      this.references = [];
    },
    async onRestoreConversation(id: string) {
      this.$router.push({
        name: ROUTE_CHAT_CONVERSATION,
        params: {
          id
        }
      });
      const conversation = this.conversations?.find((conversation: IChatConversation) => conversation.id === id);
      // change the model and model group
      const model = conversation?.model;
      console.debug('conversation model', model);
      const targetModel = CHAT_MODELS.find((m) => m.name === model);
      console.debug('target model', targetModel);
      const targetModelGroup = CHAT_MODEL_GROUPS.find((g) => g.name === targetModel?.modelGroup);
      console.debug('target model group', targetModelGroup);
      this.$store.dispatch('chat/setModelGroup', targetModelGroup);
      this.$store.dispatch('chat/setModel', targetModel);
      this.messages = conversation?.messages || [];
      this.onScrollDown();
    },
    async onChangeConversation(id?: string) {
      console.log('onChangeConversation in conversation', id);
      if (!id) {
        this.onNewConversation();
      } else {
        this.onRestoreConversation(id);
      }
    },
    async onSubmit() {
      if (this.references.length > 0) {
        let content = [];
        content.push({
          type: 'text',
          text: this.question
        });
        for (let i = 0; i < this.references.length; i++) {
          if (isImageUrl(this.references[i])) {
            content.push({
              type: 'image_url',
              image_url: this.references[i]
            });
          } else {
            content.push({
              type: 'file_url',
              file_url: this.references[i]
            });
          }
        }
        this.messages.push({
          // @ts-ignore
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
      await this.onRequest();
    },
    // Get answers to questions
    async onRequest() {
      console.debug('start to get answer', this.messages);
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
      this.canceler = new AbortController();
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
              const lastMessage = this.messages[this.messages.length - 1];
              this.messages[this.messages.length - 1] = {
                role: ROLE_ASSISTANT,
                content: response.answer,
                state:
                  lastMessage?.state !== IChatMessageState.FINISHED ? IChatMessageState.ANSWERING : lastMessage?.state
              };
              conversationId = response?.id;
            },
            signal: this.canceler.signal
          }
        )
        .then(async () => {
          console.debug('finished fetch answer', this.messages);
          this.messages[this.messages.length - 1].state = IChatMessageState.FINISHED;
          console.debug('finished fetch answer', JSON.stringify(this.messages));
          await this.$store.dispatch('chat/setConversation', {
            id: conversationId,
            messages: this.messages
          });
          this.answering = false;
          if (conversationId) {
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
          this.handleRequestError(error);
        });
    },
    async handleRequestError(error: any) {
      console.error('error happened', error);
      if (this.messages && this.messages.length > 0) {
        this.messages[this.messages.length - 1].state = IChatMessageState.FAILED;
      }
      if (error.name === 'AbortError') {
        console.error('aborted');
        return;
      } else if (error instanceof BaseError) {
        console.debug('BaseError', error);
        this.messages[this.messages.length - 1].error = {
          code: error.code,
          message: error.detail
        };
      } else if (axios.isCancel(error)) {
        this.messages[this.messages.length - 1].error = {
          code: ERROR_CODE_CANCELED
        };
      } else {
        if (this.messages && this.messages.length > 0) {
          this.messages[this.messages.length - 1].error = {
            code: ERROR_CODE_UNKNOWN
          };
        }
      }
      this.answering = false;
    },
    // Swipe the message to the bottom
    async onScrollDown() {
      setTimeout(() => {
        const container = document.querySelector('.messages') as HTMLDivElement;
        if (!container || !this.messages || this.messages.length === 0) {
          return;
        }
        container.scrollTop = container?.scrollHeight;
      }, 0);
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
  top: 10px;
  z-index: 100;
}
.setting {
  position: absolute;
  top: 10px;
  right: 10px;
  margin-bottom: 10px;
}
@media (max-width: 767px) {
  .setting {
    display: none;
  }
}

.dialogue {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  position: relative;
  .disclaimer {
    width: 100%;
    text-align: center;
    font-size: 12px;
  }
  &.empty {
    position: relative;
    .starter {
      position: absolute;
      width: 100%;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
  }
  .messages {
    padding-top: 10px;
    padding: 0 calc(50% - 400px);
    flex: 1;
    overflow-y: scroll;
    .message {
      margin-bottom: 15px;
    }
  }
  .starter {
    height: fit-content;
  }
}

.bottom {
  width: 100%;
}
</style>
