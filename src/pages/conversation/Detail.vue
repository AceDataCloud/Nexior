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
          <el-col :span="18" :offset="3">
            <message :content="message.content" :author="message.author"> </message>
          </el-col>
        </el-row>
      </div>
    </div>
    <div class="footer">
      <el-row>
        <el-col :span="18" :offset="3">
          <new-message-box v-model="input" class="new-message" @send="onSend" />
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script lang="ts">
import { IMessage } from '@/operators/message/models';
import { defineComponent } from 'vue';
import { ElRow, ElCol } from 'element-plus';
import Message from '@/components/conversation/Message.vue';
import { chatgptOperator } from '@/operators/api/chatgpt/operator';
import { IResponse } from '@/operators/api/chatgpt/models';
import NewMessageBox from '@/components/conversation/NewMessageBox.vue';

export interface IData {
  input: string;
  messages: IMessage[];
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
      messages: [
        {
          author: {
            type: 'bot',
            nickname: 'ChatGPT'
          },
          content: {
            value: '你好啊'
          }
        },
        {
          author: {
            id: 'x',
            type: 'user',
            nickname: 'fdsf'
          },
          content: {
            value: '很高兴为你服务'
          }
        }
      ]
    };
  },
  computed: {
    conversationId() {
      return this.$route.params?.id?.toString();
    }
  },
  methods: {
    onSend() {
      console.log('send', this.input);
      chatgptOperator
        .post(
          {
            question: this.input
          },
          {
            token: 'ec5cc681720b4923b05f669a853c5629'
          }
        )
        .then(({ data: data }: { data: IResponse }) => {
          console.log('data', data);
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
  }
}
</style>
