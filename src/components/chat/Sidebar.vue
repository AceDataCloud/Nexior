<template>
  <div class="sidebar">
    <el-skeleton v-if="loading && conversations === undefined" />
    <div v-else-if="conversations?.length === 0" class="conversations">
      <div class="conversation" @click="onNewConversation">
        <div class="icons">
          <font-awesome-icon icon="fa-solid fa-plus" class="icon" />
        </div>
        <div class="title">
          {{ $t('chat.message.startNewChat') }}
        </div>
      </div>
    </div>
    <div v-else class="conversations">
      <div
        v-for="(conversation, conversationIndex) in conversations"
        :key="conversationIndex"
        class="conversation"
        @click="onClick(conversation.id)"
      >
        <div class="icons">
          <font-awesome-icon icon="fa-regular fa-comment" class="icon" />
        </div>
        <div class="title">
          <span v-if="conversation?.deleting">
            {{ `${$t('chat.message.confirmDelete')}?` }}
          </span>
          <span v-else-if="conversation?.editing">
            <el-input v-model="conversation.title" @keydown.enter="onConfirm(conversation)" />
          </span>
          <span v-else-if="conversation?.title || conversation?.messages">{{
            conversation?.title || conversation?.messages[conversation?.messages.length - 1]?.content
          }}</span>
        </div>
        <div class="operations">
          <font-awesome-icon
            v-if="!conversation?.editing && !conversation.deleting"
            icon="fa-solid fa-edit"
            class="icon icon-edit"
            @click.stop="conversation.editing = true"
          />
          <font-awesome-icon
            v-if="!conversation?.editing && !conversation.deleting"
            icon="fa-solid fa-trash"
            class="icon icon-delete"
            @click.stop="conversation.deleting = true"
          />
          <font-awesome-icon
            v-if="conversation?.editing || conversation.deleting"
            icon="fa-solid fa-check"
            class="icon icon-confirm"
            @click.stop="onConfirm(conversation)"
          />
          <font-awesome-icon
            v-if="conversation?.editing || conversation.deleting"
            icon="fa-solid fa-xmark"
            class="icon icon-cancel"
            @click.stop="
              conversation.editing = false;
              conversation.deleting = false;
            "
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSkeleton, ElInput } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { ROUTE_CHAT_CONVERSATION, ROUTE_CHAT_CONVERSATION_NEW } from '@/router/constants';
import { apiUsageOperator, IApplication, chatOperator, applicationOperator } from '@/operators';
import { IChatConversation } from '@/operators/chat/models';
import {
  CHAT_MODEL_CHATGPT,
  CHAT_MODEL_CHATGPT4,
  CHAT_MODEL_CHATGPT4_BROWSING,
  CHAT_MODEL_CHATGPT_16K,
  CHAT_MODEL_CHATGPT_BROWSING
} from '@/operators';

interface IData {
  initializing: boolean;
  loading: boolean;
  conversations: IChatConversation[] | undefined;
  applications: IApplication[] | undefined;
}

export default defineComponent({
  name: 'Sidebar',
  components: {
    ElInput,
    FontAwesomeIcon,
    ElSkeleton
  },
  props: {},
  emits: ['click'],
  data(): IData {
    return {
      initializing: false,
      loading: false,
      conversations: undefined,
      applications: undefined
    };
  },
  watch: {
    applications(val) {
      if (val) {
        this.onFetchConversations();
      }
    }
  },
  async mounted() {
    await this.onFetchApplications();
    await this.onFetchConversations();
  },
  methods: {
    async onNewConversation() {
      this.$router.push({
        name: ROUTE_CHAT_CONVERSATION_NEW
      });
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
      this.applications = applications?.items;
    },
    async onConfirm(conversation: IChatConversation) {
      if (conversation?.deleting) {
        await chatOperator.deleteConversation(conversation.id);
        await this.onFetchConversations();
      } else if (conversation?.editing) {
        await chatOperator.updateConversation(conversation);
        this.onFetchConversations();
      } else {
        conversation.editing = true;
      }
    },
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
    onClick(id: string) {
      if (!id) {
        return;
      }
      this.$router.push({
        name: ROUTE_CHAT_CONVERSATION,
        params: {
          id
        }
      });
      this.$emit('click', id);
    }
  }
});
</script>

<style lang="scss" scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  padding: 15px;
  .conversations {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    .conversation {
      width: 100%;
      height: 55px;
      display: flex;
      flex-direction: row;
      padding: 10px;
      margin-bottom: 5px;
      border: 1px dashed hsl(0, 0%, 93%);
      line-height: 30px;
      border-radius: 10px;
      color: #666;
      cursor: pointer;

      .icons {
        width: 30px;
        padding-left: 10px;
        .icon {
          font-size: 14px;
        }
      }
      .title {
        flex: 1;
        font-size: 14px;
        line-height: 32px;
        overflow: hidden;
        text-overflow: ellipsis;
        padding-right: 8px;
        color: #666;
      }
      .operations {
        width: 40px;
        .icon {
          cursor: pointer;
          font-size: 14px;
          margin-right: 6px;
        }
      }
    }
  }
}
</style>
