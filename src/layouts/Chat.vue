<template>
  <div class="wrapper">
    <div class="left">
      <navigator />
    </div>
    <div class="main">
      <sidebar class="sidebar" />
      <router-view />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Navigator from '@/components/common/Navigator.vue';
import Sidebar from '@/components/chat/Sidebar.vue';
import {
  CHAT_MODEL_CHATGPT,
  CHAT_MODEL_CHATGPT4,
  CHAT_MODEL_CHATGPT4_BROWSING,
  CHAT_MODEL_CHATGPT_16K,
  CHAT_MODEL_CHATGPT_BROWSING,
  applicationOperator
} from '@/operators';

export default defineComponent({
  name: 'LayoutChat',
  components: {
    Sidebar,
    Navigator
  },
  data() {
    return {
      initializing: false,
      applications: this.$store.state.chat.applications || undefined
    };
  },
  mounted() {
    this.onFetchApplications();
  },
  methods: {
    async onFetchConversations() {
      this.loading = true;
      const {
        data: { items: apiUsages }
      } = await apiUsageOperator.getAll({
        user_id: this.$store.state.common.user.id,
        // @ts-ignore
        application_id: this.applications?.map((application) => application.id),
        offset: 0,
        limit: 30,
        ordering: '-created_at'
      });
      this.loading = false;
      // de duplicate conversations using id
      const conversationIds: string[] = apiUsages
        .map((apiUsage) => apiUsage.metadata?.conversation_id)
        .filter((id) => id);
      const uniqueConversationIds = [...new Set(conversationIds)];
      const conversations = (await chatOperator.getConversations(uniqueConversationIds)).data;
      this.conversations = conversations;
    },
    async onFetchApplications() {
      this.initializing = true;
      const { data: applications } = await applicationOperator.getAll({
        user_id: this.$store.state.common.user.id,
        api_id: [
          CHAT_MODEL_CHATGPT.apiId,
          CHAT_MODEL_CHATGPT_16K.apiId,
          CHAT_MODEL_CHATGPT_BROWSING.apiId,
          CHAT_MODEL_CHATGPT4.apiId,
          CHAT_MODEL_CHATGPT4_BROWSING.apiId
        ]
      });
      this.initializing = false;
      this.$store.dispatch('chat/setApplications', applications?.items);
    }
  }
});
</script>

<style lang="scss" scoped>
.wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: row;
  .left {
    width: 60px;
    height: 100%;
    border-right: 1px solid var(--el-border-color);
  }
  .main {
    height: 100%;
    flex: 1;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: row;

    .sidebar {
      display: block;
      width: 300px;
      height: 100%;
      border-right: 1px solid #eee;
      overflow-y: scroll;
    }
  }
}
</style>
