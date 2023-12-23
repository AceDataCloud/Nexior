<template>
  <div class="sidebar">
    <el-skeleton v-if="loading && conversations === undefined" />
    <div v-else-if="conversations?.length === 0">
      <p class="p-5 description">{{ $t('chat.message.noConversations') }}</p>
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
import { ROUTE_CHAT_CONVERSATION } from '@/router/constants';
import { apiUsageOperator, IApplication, chatOperator } from '@/operators';
import { IChatConversation } from '@/operators/chat/models';

interface IData {
  loading: boolean;
  conversations: IChatConversation[] | undefined;
}

export default defineComponent({
  name: 'Sidebar',
  components: {
    ElInput,
    FontAwesomeIcon,
    ElSkeleton
  },
  props: {
    applications: {
      type: Object as () => IApplication[],
      required: true
    }
  },
  emits: ['click'],
  data(): IData {
    return {
      loading: false,
      conversations: undefined
    };
  },
  watch: {
    applications(val) {
      if (val) {
        this.onFetchAllConversations();
      }
    }
  },
  mounted() {},
  methods: {
    async onConfirm(conversation: IChatConversation) {
      if (conversation?.deleting) {
        await chatOperator.deleteConversation(conversation.id);
        await this.onFetchAllConversations();
      } else if (conversation?.editing) {
        await chatOperator.updateConversation(conversation);
        this.onFetchAllConversations();
      } else {
        conversation.editing = true;
      }
    },
    async onFetchAllConversations() {
      this.loading = true;
      const {
        data: { items: apiUsages }
      } = await apiUsageOperator.getAll({
        user_id: this.$store.state.user.id,
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
