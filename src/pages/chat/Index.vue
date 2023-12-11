<template>
  <div class="page">
    <sidebar class="left" :applications="applications" />
    <div class="main">
      <div class="card">
        <h2 class="title">{{ $t('chat.title.chat') }}</h2>
        <p class="description">{{ $t('chat.message.startNewChat') }}</p>
        <el-button type="primary" @click="onStart">{{ $t('common.button.new') }}</el-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton } from 'element-plus';
import Sidebar from '@/components/chat/Sidebar.vue';
import { ROUTE_CHAT_CONVERSATION_NEW } from '@/router/constants';
import { IApplication } from '@/operators/application/models';
import { applicationOperator } from '@/operators/application/operator';
import {
  CHAT_MODEL_CHATGPT,
  CHAT_MODEL_CHATGPT4,
  CHAT_MODEL_CHATGPT4_BROWSING,
  CHAT_MODEL_CHATGPT_16K,
  CHAT_MODEL_CHATGPT_BROWSING
} from '@/operators/chat/constants';

interface IData {
  model: string;
  drawer: boolean;
  question: string;
  initializing: boolean;
  applications: IApplication[];
}

export default defineComponent({
  name: 'ChatIndex',
  components: {
    Sidebar,
    ElButton
  },
  data(): IData {
    return {
      model: 'chatgpt',
      initializing: false,
      drawer: false,
      question: '',
      applications: []
    };
  },
  mounted() {
    this.onFetchApplications();
  },
  methods: {
    async onFetchApplications() {
      this.initializing = true;
      const { data: applications } = await applicationOperator.getAll({
        user_id: this.$store.state.user.id,
        api_id: [
          CHAT_MODEL_CHATGPT.apiId,
          CHAT_MODEL_CHATGPT_16K.apiId,
          CHAT_MODEL_CHATGPT_BROWSING.apiId,
          CHAT_MODEL_CHATGPT4.apiId,
          CHAT_MODEL_CHATGPT4_BROWSING.apiId
        ]
      });
      this.initializing = false;
      this.applications = applications?.items;
    },
    onStart() {
      this.$router.push({
        name: ROUTE_CHAT_CONVERSATION_NEW
      });
    }
  }
});
</script>

<style lang="scss" scoped>
.page {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: row;
  .left {
    display: block;
    width: 300px;
    height: 100%;
    border-right: 1px solid #eee;
  }
  .main {
    flex: 1;
    overflow: hidden;
    position: relative;
    align-items: center;
    display: flex;
    justify-content: center;

    .card {
      width: 200px;
      height: 150px;
      text-align: center;

      .title {
        font-size: 18px;
        font-weight: bold;
        margin-bottom: 5px;
      }
      .description {
        font-size: 14px;
        margin-bottom: 15px;
      }

      .el-button {
        border-radius: 20px;
      }
    }
  }
}
</style>
