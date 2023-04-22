<template>
  <div class="conversation">
    <div class="selection">
      <el-select :model-value="activeApiId" @change="onSwitchApi">
        <el-option v-for="item in apis" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
    </div>
    <el-row v-if="!messages || messages.length === 0" class="introduction-wrapper" justify="center">
      <el-col :md="14" :sm="22" :xs="22">
        <introduction @draft="onDraft" />
      </el-col>
    </el-row>
    <div v-else class="messages-wrapper">
      <div
        v-for="(message, messageIndex) in messages"
        :key="messageIndex"
        :class="{
          'message-wrapper': true,
          user: message.author.type === 'user',
          bot: message.author.type === 'bot'
        }"
      >
        <el-row justify="center">
          <el-col :md="14" :sm="22" :xs="22">
            <message
              :content="message.content"
              :author="message.author"
              :error="message.error"
              :state="message.state"
              @stop="onStop"
            />
          </el-col>
        </el-row>
      </div>
    </div>
    <div class="footer">
      <el-row justify="center">
        <el-col :md="14" :sm="22" :xs="22">
          <new-message-box
            v-model="input"
            :initializing="loading"
            :answering="answering"
            class="new-message"
            :api="api"
            :application="application"
            @send="onSend"
            @apply="onApply"
            @switch-api="onSwitchApi"
          />
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script lang="ts">
import { IMessage, IMessageState } from '@/operators/message/models';
import { defineComponent } from 'vue';
import { ElRow, ElCol, ElMessage, ElSelect, ElOption } from 'element-plus';
import Message from '@/components/conversation/Message.vue';
import { chatgpt4Operator, chatgptOperator } from '@/operators/api/chatgpt/operator';
import NewMessageBox from '@/components/conversation/NewMessageBox.vue';
import { chatgptAvatar, userAvatar } from '@/constants/image';
import {
  apiOperator,
  applicationOperator,
  IApi,
  IApplication,
  IApplicationDetailResponse,
  IApplicationType,
  userOperator
} from '@/operators';
import { ROUTE_AUTH_LOGIN, ROUTE_CONVERSATION_DETAIL, ROUTE_CONVERSATION_NEW } from '@/router/constants';
import {
  APIS,
  API_ID_CHATGPT,
  DEFAULT_API,
  ENDPOINT,
  ERROR_CODE_CANCELED,
  ERROR_CODE_DUPLICATION,
  ERROR_CODE_UNKNOWN,
  ERROR_CODE_UNVERIFIED
} from '@/constants';
import { getVerificationUrl } from '@/utils';
import { IConversation } from '@/operators/conversation/models';
import Introduction from '@/components/conversation/Introduction.vue';
import axios from 'axios';
import { IResponse } from '@/operators/api/chatgpt/models';

export interface IData {
  input: string;
  messages: IMessage[];
  loading: boolean;
  answering: boolean;
  token: string | undefined;
  api: IApi | undefined;
  application: IApplication | undefined;
  canceler: AbortController | undefined;
  apis: { id: string; name: string }[];
}

export default defineComponent({
  name: 'ChatDetail',
  components: {
    Introduction,
    Message,
    ElRow,
    ElCol,
    ElSelect,
    ElOption,
    NewMessageBox
  },
  data(): IData {
    return {
      input: '',
      loading: false,
      answering: false,
      messages: [],
      token: undefined,
      api: undefined,
      application: undefined,
      canceler: undefined,
      apis: APIS
    };
  },
  computed: {
    conversationId() {
      return this.$route.params?.id?.toString();
    },
    user() {
      return this.$store.getters.user;
    },
    setting() {
      return this.$store.getters.setting;
    },
    activeApiId() {
      return this.$store.getters.activeApiId;
    }
  },
  watch: {
    conversationId: {
      handler() {
        this.restoreMessages();
      }
    }
  },
  async mounted() {
    if (!this.$store.getters.authenticated) {
      this.$router.push({
        name: ROUTE_AUTH_LOGIN,
        query: { redirect: this.$route.fullPath }
      });
    } else {
      this.restoreMessages();
      this.onInitialize();
    }
  },
  methods: {
    onInitialize() {
      this.loading = true;
      Promise.all([this.onGetApiInfo(), this.onCheckApplication()])
        .then(() => {
          this.loading = false;
        })
        .catch(() => {
          this.loading = false;
        });
    },
    scrollDown() {
      const container = document.querySelector('.main') as HTMLDivElement;
      container.scrollTop = container.scrollHeight;
    },
    restoreMessages() {
      if (this.conversationId) {
        const conversations = this.$store.getters.conversations;
        const hitConversations = conversations.filter((c: IConversation) => c.id === this.conversationId);
        if (hitConversations && hitConversations.length > 0) {
          const hitConversation = hitConversations[0];
          this.messages = hitConversation.messages;
        }
      } else {
        this.messages = [];
      }
    },
    async onGetApiInfo(): Promise<void> {
      const { data } = await apiOperator.get(this.activeApiId);
      this.api = data;
    },
    async onStop() {
      this.canceler?.abort();
    },
    async onCheckApplication(): Promise<void> {
      if (!this.user) {
        const { data: user } = await userOperator.getMe();
        await this.$store.dispatch('setUser', user);
      }
      const { data } = await applicationOperator.getAll({
        user_id: this.user.id,
        api_id: this.activeApiId
      });
      if (data.items?.length > 0) {
        const application = data.items[0];
        this.application = application;
        const token = application.credential?.token;
        if (token) {
          this.token = token;
        }
      }
    },
    async onSwitchApi(id: string) {
      await this.$store.dispatch('setActiveApiId', id);
      this.api = undefined;
      this.application = undefined;
      this.onInitialize();
      this.$router.push({
        name: ROUTE_CONVERSATION_NEW
      });
    },
    onApply() {
      applicationOperator
        .create({
          type: IApplicationType.API,
          api_id: this.api?.id
        })
        .then(({ data: data }: { data: IApplicationDetailResponse }) => {
          this.application = data;
          ElMessage.success(this.$t('application.message.applySuccessfully'));
        })
        .catch((error) => {
          if (error?.response?.data?.code === ERROR_CODE_DUPLICATION) {
            ElMessage.error(this.$t('application.message.alreadyApplied'));
          }
          if (error?.response?.data?.code === ERROR_CODE_UNVERIFIED) {
            ElMessage({
              dangerouslyUseHTMLString: true,
              duration: 0,
              showClose: true,
              message: `${this.$t(
                'application.message.unverified'
              )} <a class="underline" href="${getVerificationUrl()}">${this.$t('application.message.goVerify')}</a>`,
              type: 'warning'
            });
          }
        });
    },
    onDraft(content: string) {
      this.input = content;
    },
    async onProcessConversation() {
      const conversations: IConversation[] = this.$store.getters.conversations;
      const hitConversations = conversations.filter((c: IConversation) => c.id === this.conversationId);
      if (!hitConversations || hitConversations.length === 0) {
        // append a new conversation to conversations
        const newConversations = [
          ...conversations,
          {
            id: this.conversationId,
            messages: this.messages,
            title: this.conversationId
          }
        ];
        this.$store.dispatch('setConversations', newConversations);
      } else {
        // update one of existing conversations
        conversations.forEach((conversation: IConversation) => {
          if (conversation.id === this.conversationId) {
            conversation.messages = this.messages;
          }
        });
        this.$store.dispatch('setConversations', conversations);
      }
    },
    async onProcessResponse(jsonData: IResponse) {
      const answer = jsonData.answer;
      const conversationId = jsonData.conversation_id;
      // if this new conversation, just switch to a single conversation
      if (conversationId && this.$route.name !== ROUTE_CONVERSATION_DETAIL) {
        await this.$router.push({
          name: ROUTE_CONVERSATION_DETAIL,
          params: {
            id: conversationId
          }
        });
      }
      if (this.conversationId === conversationId) {
        this.scrollDown();
        this.messages[this.messages.length - 1].content.value = answer;
        this.messages[this.messages.length - 1].state = IMessageState.ANSWERING;
      }
    },
    onSend() {
      if (this.answering) {
        return;
      }
      if (!this.input.trim()) {
        ElMessage.error(this.$t('conversation.message.noInput'));
        return;
      }
      if (!this.token) {
        ElMessage.error(this.$t('conversation.message.noToken'));
        return;
      }
      const input = this.input;
      this.messages.push({
        content: {
          value: input
        },
        author: {
          ...this.user,
          avatar: this.user?.avatar || userAvatar,
          type: 'user'
        },
        state: IMessageState.FINISHED
      });
      this.messages.push({
        content: {
          value: ''
        },
        author: {
          type: 'bot',
          nickname: 'ChatGPT',
          avatar: chatgptAvatar
        },
        state: IMessageState.PENDING
      });
      this.answering = true;
      this.input = '';
      setTimeout(() => {
        this.scrollDown();
      }, 100);
      this.canceler = new AbortController();
      const operator = this.activeApiId === API_ID_CHATGPT ? chatgptOperator : chatgpt4Operator;
      operator
        .post(
          {
            question: input,
            stateful: true,
            ...(this.conversationId
              ? {
                  conversation_id: this.conversationId
                }
              : {})
          },
          {
            token: this.token
          },
          {
            headers: {
              accept: this.setting?.stream ? 'application/x-ndjson' : 'application/json',
              'content-type': 'application/json'
            },
            baseURL: this.setting.endpoint || ENDPOINT,
            signal: this.canceler.signal,
            // only enable for stream mode
            ...(this.setting?.stream
              ? {
                  responseType: 'stream',
                  onDownloadProgress: (event) => {
                    const response = event.target.response;
                    const lines = response.split('\r\n').filter((line: string) => !!line);
                    const lastLine = lines[lines.length - 1];
                    if (lastLine) {
                      const jsonData = JSON.parse(lastLine);
                      this.onProcessResponse(jsonData);
                    }
                  }
                }
              : {})
          }
        )
        .then(async ({ data }: { data: IResponse }) => {
          if (!this.setting.stream) {
            await this.onProcessResponse(data);
          }
          this.answering = false;
          if (this.messages && this.messages.length > 0) {
            this.messages[this.messages.length - 1].state = IMessageState.FINISHED;
          }
          this.onProcessConversation();
          this.onCheckApplication();
        })
        .catch((error) => {
          this.answering = false;
          if (this.messages && this.messages.length > 0) {
            this.messages[this.messages.length - 1].state = IMessageState.FAILED;
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
.conversation {
  min-height: 100vh;
  position: relative;
  flex-direction: column;
  display: flex;

  .selection {
    position: fixed;
    top: 10px;
    text-align: center;
    left: 300px;
    width: calc(100% - 300px);
    z-index: 1000;
  }
  @media (max-width: 767px) {
    .selection {
      left: 0px;
      width: calc(100%);
    }
  }
  .messages-wrapper {
    margin-bottom: 120px;
    padding-top: 50px;
  }
  .introduction-wrapper {
    flex: 1;
  }

  .message-wrapper {
    border-color: rgba(0, 0, 0, 0.1);
    border-bottom-width: 1px;
    padding-bottom: 1.5rem;
    padding-top: 1.5rem;
    &:first-child {
      border-top-width: 1px;
    }
    &.bot {
      background-color: #f7f7f8;
    }
    &.user {
      background-color: #ffffff;
    }
  }
  .footer {
    background-image: linear-gradient(180deg, hsla(0, 0%, 100%, 0) 13.94%, #fff 54.73%);
    position: fixed;
    left: 300px;
    bottom: 0;
    width: calc(100% - 300px);
  }

  @media (max-width: 767px) {
    .footer {
      left: 0px;
      width: calc(100%);
    }
  }
}
</style>
