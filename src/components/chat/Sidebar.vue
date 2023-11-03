<template>
  <div class="sidebar">
    <el-skeleton v-if="loading" />
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
          <span>{{ conversation.title }}</span>
        </div>
        <div class="operations">
          <font-awesome-icon icon="fa-solid fa-edit" class="icon icon-edit" />
          <font-awesome-icon icon="fa-solid fa-trash" class="icon icon-delete" />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElTooltip, ElButton, ElSkeleton } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { ROUTE_CHAT_CONVERSATION, ROUTE_CHAT_INDEX } from '@/router/constants';
import { apiUsageOperator, midjourneyOperator, MidjourneyImagineState, IApplication } from '@/operators';
import { chatgptOperator } from '@/operators/api/chatgpt/operator';
import { IConversation } from '@/operators/conversation/models';

interface IData {
  loading: boolean;
  conversations: IConversation[];
}

export default defineComponent({
  name: 'Sidebar',
  components: {
    ElButton,
    FontAwesomeIcon,
    ElSkeleton
  },
  props: {
    application: {
      type: Object as () => IApplication | undefined,
      required: true
    }
  },
  emits: ['click'],
  data(): IData {
    return {
      loading: false,
      conversations: []
    };
  },
  mounted() {
    this.onFetchAllConversations();
  },
  methods: {
    async onFetchAllConversations() {
      // applicationOperator.getAll()
      console.log('srtart to load');
      this.loading = true;
      const {
        data: { items: apiUsages }
      } = await apiUsageOperator.getAll({
        user_id: this.$store.state.user.id,
        application_id: this.application?.id,
        offset: 0,
        limit: 20,
        ordering: '-created_at'
      });
      this.loading = false;

      // de duplicate conversations using id
      const conversationIds: string[] = [];
      const uniqueApiUsages = apiUsages.filter((apiUsage) => {
        const conversationId = apiUsage.metadata?.conversation_id;
        if (!conversationId) {
          return false;
        }
        if (conversationIds.includes(conversationId)) {
          return false;
        }
        conversationIds.push(conversationId);
        return true;
      });

      const conversations = await Promise.all(
        uniqueApiUsages.map(async (apiUsage) => {
          // const taskId = apiUsage.metadata?.task_id;
          // console.log('taskid', taskId);
          return {
            id: apiUsage.metadata?.conversation_id,
            title: apiUsage.metadata?.conversation_id
          } as IConversation;
        })
      );
      this.conversations = conversations;
      // this.historyTasks = tasks.filter((task) => task && task?.response);
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
      height: 50px;
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
      }
      .operations {
        width: 45px;
        .icon {
          cursor: pointer;
          font-size: 14px;
          margin-right: 8px;
        }
      }
    }
  }
}
</style>
