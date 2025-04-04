<template>
  <layout>
    <template #chat>
      <model-selector class="selector" @select="onCreateNewConversation" />
      <application-status
        :initializing="initializing"
        :application="application"
        :applications="applications"
        :need-apply="needApply"
        :service="service"
        @select="$store.dispatch('chat/setApplication', $event)"
        @refresh="$store.dispatch('chat/getApplications')"
      />
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
        <div class="composer">
          <input-box
            v-model:is-search-active="isSearchActive"
            v-model:is-reason-active="isReasonActive"
            v-model:is-deepsearch-active="isDeepsearchActive"
            v-model:is-search-enabled="isSearchEnabled"
            v-model:is-deepsearch-enabled="isDeepsearchEnabled"
            v-model:is-reason-enabled="isReasonEnabled"
            v-model:is-upload-enabled="isUploadEnabled"
            :disabled="answering"
            :question="question"
            :references="references"
            :upload="upload"
            @update:question="question = $event"
            @update:upload="upload = $event"
            @update:references="references = $event"
            @submit="onSubmit"
            @stop="onStop"
          />
          <disclaimer class="disclaimer" />
          <suggestion v-if="messages.length === 0" @draft="onDraft" />
        </div>
      </div>
    </template>
  </layout>
</template>

<script lang="ts">
import axios from 'axios';
import { defineComponent, ref } from 'vue';
import Message from '@/components/chat/Message.vue';
import {
  CHAT_MODEL_DEEPSEEK_CHAT,
  CHAT_MODEL_DEEPSEEK_REASONER,
  CHAT_MODEL_GPT_4_BROWSING,
  CHAT_MODEL_GPT_4O,
  CHAT_MODEL_GROK_3,
  CHAT_MODEL_GROK_3_DEEPSEARCH,
  CHAT_MODEL_GROK_3_REASONER,
  CHAT_MODEL_GROUP_CHATGPT,
  CHAT_MODEL_GROUP_DEEPSEEK,
  CHAT_MODEL_GROUP_GROK,
  CHAT_MODEL_O1_MINI,
  CHAT_MODELS,
  ROLE_ASSISTANT,
  ROLE_USER
} from '@/constants';
import {
  IChatModel,
  IChatMessageState,
  IChatConversationResponse,
  IChatConversation,
  IChatMessage,
  IChatModelGroup
} from '@/models';
import InputBox from '@/components/chat/InputBox.vue';
import ModelSelector from '@/components/chat/ModelSelector.vue';
import { ERROR_CODE_CANCELED, ERROR_CODE_NOT_APPLIED, ERROR_CODE_UNKNOWN } from '@/constants/errorCode';
import { ROUTE_CHAT_CONVERSATION, ROUTE_CHAT_CONVERSATION_NEW } from '@/router';
import { Status } from '@/models';
import Suggestion from '@/components/chat/Suggestion.vue';
import Disclaimer from '@/components/chat/Disclaimer.vue';
import Layout from '@/layouts/Chat.vue';
import { isImageUrl, isJSONString } from '@/utils/is';
import { chatOperator } from '@/operators';
import ApplicationStatus from '@/components/application/Status.vue';
import { CHAT_MODEL_GPT_4_ALL } from '@/constants';

export interface IData {
  drawer: boolean;
  question: string;
  upload: boolean;
  isSearchActive: boolean;
  isDeepsearchActive: boolean;
  isReasonActive: boolean;
  isSearchEnabled: boolean;
  isDeepsearchEnabled: boolean;
  isReasonEnabled: boolean;
  isUploadEnabled: boolean;
  references: string[];
  answering: boolean;
  messages: IChatMessage[];
  canceler: AbortController | undefined;
}

export default defineComponent({
  name: 'ChatConversation',
  components: {
    InputBox,
    Disclaimer,
    Suggestion,
    ModelSelector,
    Message,
    ApplicationStatus,
    Layout
  },
  data(): IData {
    return {
      drawer: false,
      question: '',
      references: [],
      upload: false,
      isSearchActive: false,
      isReasonActive: false,
      isDeepsearchActive: false,
      isSearchEnabled: true,
      isReasonEnabled: true,
      isUploadEnabled: true,
      isDeepsearchEnabled: true,
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
      const model = await this.getModelByAction();
      if (model) {
        await this.$store.dispatch('chat/setModel', model);
      }
    },
    async isSearchActive(val) {
      console.log('search changed', val);
      const model = await this.getModelByAction();
      if (model) {
        await this.$store.dispatch('chat/setModel', model);
      }
    },
    async isReasonActive(val) {
      console.log('reason changed', val);
      const model = await this.getModelByAction();
      if (model) {
        await this.$store.dispatch('chat/setModel', model);
      }
    },
    async isDeepsearchActive(val) {
      console.log('deepsearch changed', val);
      const model = await this.getModelByAction();
      if (model) {
        await this.$store.dispatch('chat/setModel', model);
      }
    },
    async modelGroup(val: IChatModelGroup) {
      console.log('modelGroup changed', val);
      const model = await this.getModelByAction();
      if (model) {
        console.log('set model', model);
        await this.$store.dispatch('chat/setModel', model);
      }
      if (val.name === CHAT_MODEL_GROUP_DEEPSEEK.name) {
        this.upload = false;
      }
    },
    model(val: IChatModel) {
      console.log('model changed', val);
      if (val) {
        this.$store.dispatch('chat/setModel', val);
      }
    },
    async conversationId(val: string) {
      if (!val) {
        this.messages = [];
      } else {
        this.messages =
          this.conversations?.find((conversation: IChatConversation) => conversation.id === val)?.messages || [];
        this.onScrollDown();
      }
      const model = await this.getModelByConversation();
      if (model) {
        await this.$store.dispatch('chat/setModel', model);
      }
      const modelGroup = await this.getModelGroup();
      if (modelGroup) {
        console.log('set model group', modelGroup);
        await this.$store.dispatch('chat/setModelGroup', modelGroup);
      }
    }
  },
  async mounted() {
    await this.onGetService();
    await this.onGetApplication();
    await this.onGetConversations();
    await this.onScrollDown();

    // initialize model
    const model = await this.getModel();
    if (model) {
      console.log('set model', model);
      await this.$store.dispatch('chat/setModel', model);
    }
    // initialize model group
    const modelGroup = await this.getModelGroup();
    if (modelGroup) {
      console.log('set model group', modelGroup);
      await this.$store.dispatch('chat/setModelGroup', modelGroup);
    }
  },
  methods: {
    async getModel() {
      return (await this.getModelByConversation()) || (await this.getModelByAction());
    },
    async getModelByConversation() {
      if (this.conversationId && this.conversation?.model) {
        const modelName = this.conversation.model;
        return CHAT_MODELS.find((model: IChatModel) => model.name === modelName);
      }
    },
    async getModelByAction() {
      if (this.modelGroup.name === CHAT_MODEL_GROUP_CHATGPT.name) {
        if (this.isReasonActive) {
          return CHAT_MODEL_O1_MINI;
        } else if (this.isSearchActive) {
          return CHAT_MODEL_GPT_4_BROWSING;
        } else if (this.references.length > 0) {
          return CHAT_MODEL_GPT_4_ALL;
        }
        return CHAT_MODEL_GPT_4O;
      } else if (this.modelGroup.name === CHAT_MODEL_GROUP_DEEPSEEK.name) {
        if (this.isReasonActive) {
          return CHAT_MODEL_DEEPSEEK_REASONER;
        }
        return CHAT_MODEL_DEEPSEEK_CHAT;
      } else if (this.modelGroup.name === CHAT_MODEL_GROUP_GROK.name) {
        if (this.isReasonActive) {
          return CHAT_MODEL_GROK_3_REASONER;
        } else if (this.isDeepsearchActive) {
          return CHAT_MODEL_GROK_3_DEEPSEARCH;
        }
        return CHAT_MODEL_GROK_3;
      }
    },
    async getModelGroup() {
      const currentModel = this.model;
      if (CHAT_MODEL_GROUP_CHATGPT.models.map((item) => item.name).includes(currentModel.name)) {
        return CHAT_MODEL_GROUP_CHATGPT;
      } else if (CHAT_MODEL_GROUP_DEEPSEEK.models.map((item) => item.name).includes(currentModel.name)) {
        return CHAT_MODEL_GROUP_DEEPSEEK;
      } else if (CHAT_MODEL_GROUP_GROK.models.map((item) => item.name).includes(currentModel.name)) {
        return CHAT_MODEL_GROUP_GROK;
      }
    },
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
          await this.onFetchAnswer();
        })
        .catch((error) => {
          if (this.messages && this.messages.length > 0) {
            this.messages[this.messages.length - 1].state = IChatMessageState.FAILED;
          }
          if (error.name === 'AbortError') {
            console.error('aborted');
            return;
          }
          if (axios.isCancel(error)) {
            this.messages[this.messages.length - 1].error = {
              code: ERROR_CODE_CANCELED
            };
          } else if (error?.response?.data) {
            let data = error?.response?.data;
            if (isJSONString(data)) {
              data = JSON.parse(data);
            }
            console.debug('error', data);
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
          await this.onFetchAnswer();
        })
        .catch((error) => {
          if (this.messages && this.messages.length > 0) {
            this.messages[this.messages.length - 1].state = IChatMessageState.FAILED;
          }
          if (error.name === 'AbortError') {
            console.error('aborted');
            return;
          }
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
    },
    async onCreateNewConversation() {
      console.log('onCreateNewConversation');
      await this.$router.push({
        name: ROUTE_CHAT_CONVERSATION_NEW
      });
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
      await this.onFetchAnswer();
    },
    // Swipe the message to the bottom
    async onScrollDown() {
      setTimeout(() => {
        const container = document.querySelector('.dialogue') as HTMLDivElement;
        if (!container || !this.messages || this.messages.length === 0) {
          return;
        }
        container.scrollTop = container?.scrollHeight;
      }, 0);
    },
    // Get answers to questions
    async onFetchAnswer() {
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
              //this.onScrollDown();
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
          if (this.messages && this.messages.length > 0) {
            this.messages[this.messages.length - 1].state = IChatMessageState.FAILED;
          }
          if (error.name === 'AbortError') {
            console.error('aborted');
            return;
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
            console.debug('error', data);
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
  top: 10px;
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
  flex: 1;
  width: 100%;
  overflow-y: auto;
  position: relative;
  padding: 0 calc(50% - 400px);
  .disclaimer {
    width: 100%;
    text-align: center;
    font-size: 12px;
  }
  &.empty {
    position: relative;
    .composer {
      position: absolute;
      width: 100%;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
  }
  .messages {
    padding-top: 10px;
    flex: 1;
    // overflow-y: scroll;
    .message {
      margin-bottom: 15px;
    }
  }
  .composer {
    height: fit-content;
  }
}

.bottom {
  width: 100%;
}
</style>
