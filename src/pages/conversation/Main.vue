<template>
  <div class="conversation">
    <div class="messages">
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
            <message :content="message.content" :author="message.author" :error="message.error"> </message>
          </el-col>
        </el-row>
      </div>
    </div>
    <div class="footer">
      <el-row>
        <el-col :span="12" :offset="6">
          <new-message-box v-model="input" class="new-message" @send="onSend" />
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script lang="ts">
import { IMessage } from '@/operators/message/models';
import { defineComponent } from 'vue';
import { ElRow, ElCol, ElMessage } from 'element-plus';
import Message from '@/components/conversation/Message.vue';
import { chatgptOperator } from '@/operators/api/chatgpt/operator';
import NewMessageBox from '@/components/conversation/NewMessageBox.vue';
import { chatgptAvatar, userAvatar } from '@/constants/image';
import { applicationOperator, IApplicationListResponse } from '@/operators';
import { ROUTE_AUTH_LOGIN, ROUTE_CONVERSATION_DETAIL } from '@/router/constants';

export interface IData {
  input: string;
  messages: IMessage[];
  loading: boolean;
  token: string | undefined;
}

export default defineComponent({
  name: 'ChatDetail',
  components: {
    Message,
    ElRow,
    ElCol,
    NewMessageBox
  },
  data(): IData {
    return {
      input: '',
      loading: false,
      messages: [],
      token: undefined
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
  mounted() {
    if (!this.$store.getters.authenticated) {
      this.$router.push({
        name: ROUTE_AUTH_LOGIN,
        query: { redirect: this.$route.fullPath }
      });
    } else {
      this.onCheckApplication();
    }
  },
  methods: {
    onCheckApplication() {
      if (!this.user) {
        return;
      }
      applicationOperator
        .getAll({
          user_id: this.user.id,
          api_id: '1d58971c-e3cd-4713-a3ce-854a731adb14'
        })
        .then(({ data: data }: { data: IApplicationListResponse }) => {
          if (data.items?.length > 0) {
            const application = data.items[0];
            const token = application.credential?.token;
            if (token) {
              this.token = token;
            }
          }
        });
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
        }
      });
      this.messages.push({
        content: {
          value: ''
        },
        author: {
          type: 'bot',
          nickname: 'ChatGPT',
          avatar: chatgptAvatar
        }
      });
      this.loading = true;
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
        .catch((error) => {
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
  flex-direction: column;
  display: flex;
  .messages {
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
  .new-message {
    height: 50px;
    margin-bottom: 30px;
  }
}
</style>
