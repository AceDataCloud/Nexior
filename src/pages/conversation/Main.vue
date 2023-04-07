<template>
  <div class="conversation">
    <el-row v-if="!messages || messages.length === 0" class="introduction-wrapper">
      <el-col :span="12" :offset="6">
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
        <el-row>
          <el-col :span="12" :offset="6">
            <message
              :content="message.content"
              :author="message.author"
              :error="message.error"
              :state="message.state"
            />
          </el-col>
        </el-row>
      </div>
    </div>
    <div class="footer">
      <el-row>
        <el-col :span="12" :offset="6">
          <new-message-box
            v-model="input"
            :initializing="loading"
            class="new-message"
            :api="api"
            :application="application"
            @send="onSend"
            @apply="onApply"
          />
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script lang="ts">
import { IMessage, IMessageState } from '@/operators/message/models';
import { defineComponent } from 'vue';
import { ElRow, ElCol, ElMessage } from 'element-plus';
import Message from '@/components/conversation/Message.vue';
import { chatgptOperator } from '@/operators/api/chatgpt/operator';
import NewMessageBox from '@/components/conversation/NewMessageBox.vue';
import { chatgptAvatar, userAvatar } from '@/constants/image';
import {
  apiOperator,
  applicationOperator,
  IApi,
  IApiDetailResponse,
  IApplication,
  IApplicationDetailResponse,
  IApplicationListResponse,
  IApplicationType
} from '@/operators';
import { ROUTE_AUTH_LOGIN, ROUTE_CONVERSATION_DETAIL } from '@/router/constants';
import { ERROR_CODE_DUPLICATION, ERROR_CODE_UNVERIFIED } from '@/constants';
import { getVerificationUrl } from '@/utils';
import { IConversation } from '@/operators/conversation/models';
import Introduction from '@/components/conversation/Introduction.vue';

export interface IData {
  input: string;
  messages: IMessage[];
  loading: boolean;
  answering: boolean;
  token: string | undefined;
  api: IApi | undefined;
  application: IApplication | undefined;
}

export default defineComponent({
  name: 'ChatDetail',
  components: {
    Introduction,
    Message,
    ElRow,
    ElCol,
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
      application: undefined
    };
  },
  computed: {
    conversationId() {
      return this.$route.params?.id?.toString();
    },
    user() {
      return this.$store.getters.user;
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
      await this.onGetApiInfo();
      await this.onCheckApplication();
    }
  },
  methods: {
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
    async onGetApiInfo() {
      return new Promise((resolve, reject) => {
        const id = '1d58971c-e3cd-4713-a3ce-854a731adb14';
        apiOperator
          .get(id)
          .then(({ data: data }: { data: IApiDetailResponse }) => {
            this.api = data;
            resolve(data);
          })
          .catch((error) => {
            reject(error);
          });
      });
    },
    async onCheckApplication() {
      if (!this.user) {
        return;
      }
      this.loading = true;
      applicationOperator
        .getAll({
          user_id: this.user.id,
          api_id: this.api?.id
        })
        .then(({ data: data }: { data: IApplicationListResponse }) => {
          if (data.items?.length > 0) {
            const application = data.items[0];
            this.application = application;
            const token = application.credential?.token;
            if (token) {
              this.token = token;
            }
          }
          this.loading = false;
        })
        .catch(() => {
          this.loading = false;
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
    onSend() {
      if (!this.input) {
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
      chatgptOperator
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
              accept: 'application/x-ndjson',
              'content-type': 'application/json'
            },
            responseType: 'stream',
            onDownloadProgress: (event) => {
              const response = event.target.response;
              const lines = response.split('\r\n').filter((line: string) => !!line);
              const lastLine = lines[lines.length - 1];
              if (lastLine) {
                const jsonData = JSON.parse(lastLine);
                const answer = jsonData.answer;
                const conversationId = jsonData.conversation_id;
                this.messages[this.messages.length - 1].content.value = answer;
                this.messages[this.messages.length - 1].state = IMessageState.ANSWERING;
                if (conversationId && this.$route.name !== ROUTE_CONVERSATION_DETAIL) {
                  this.$router.push({
                    name: ROUTE_CONVERSATION_DETAIL,
                    params: {
                      id: conversationId
                    }
                  });
                }
              }
            }
          }
        )
        .then(() => {
          this.answering = false;
          if (this.messages && this.messages.length > 0) {
            this.messages[this.messages.length - 1].state = IMessageState.FINISHED;
          }
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
              conversation.messages = this.messages;
            });
            this.$store.dispatch('setConversations', conversations);
          }
        })
        .catch((error) => {
          this.answering = false;
          if (this.messages && this.messages.length > 0) {
            this.messages[this.messages.length - 1].state = IMessageState.FAILED;
          }
          if (error?.response?.data) {
            const data = error?.response?.data;
            if (this.messages && this.messages.length > 0) {
              this.messages[this.messages.length - 1].error = data;
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
  .messages-wrapper {
    margin-bottom: 200px;
  }
  .introduction-wrapper {
    flex: 1;
  }

  .message-wrapper {
    border-color: rgba(0, 0, 0, 0.1);
    border-bottom-width: 1px;
    padding-bottom: 1.5rem;
    padding-top: 1.5rem;
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
}
</style>
