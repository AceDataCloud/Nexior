<template>
  <div class="panel">
    <el-skeleton v-if="loading && conversationGroups === undefined" />
    <div v-else class="conversations">
      <div class="conversation" @click="onNewConversation">
        <div class="icons">
          <font-awesome-icon icon="fa-solid fa-plus" class="icon" />
        </div>
        <div class="title">
          {{ $t('chat.message.startNewChat') }}
        </div>
      </div>
      <div v-for="(group, groupKey) in conversationGroups" :key="groupKey" class="group">
        <div class="key">
          {{ $t(`chat.group.${groupKey}`) }}
        </div>
        <div
          v-for="(conversation, conversationIndex) in group"
          :key="conversationIndex"
          :class="{ conversation: true, active: conversation.id === conversationId }"
          @click="onClickConversation(conversation.id)"
        >
          <div class="title">
            <span v-if="conversation?.deleting">
              {{ `${$t('chat.message.confirmDelete')}?` }}
            </span>
            <span v-else-if="conversation?.editing">
              <el-input v-model="conversation.title" @keydown.enter="onConfirm(conversation)" />
            </span>
            <span v-else-if="conversation?.title || conversation?.messages">
              {{
                conversation?.title ||
                conversation?.messages?.[conversation?.messages.length - 1]?.content ||
                conversation?.messages?.[0]?.content
              }}
            </span>
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
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSkeleton, ElInput } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { chatOperator } from '@/operators';
import { IChatConversation } from '@/models';
import { Status } from '@/models';

export default defineComponent({
  name: 'SidePanel',
  components: {
    ElInput,
    FontAwesomeIcon,
    ElSkeleton
  },
  props: {},
  emits: ['change-conversation'],
  computed: {
    modelGroup() {
      return this.$store.state.chat.modelGroup;
    },
    conversationId() {
      console.debug('conversationId in side', this.$route.params?.id);
      return this.$route.params?.id?.toString();
    },
    conversations() {
      let conversations = this.$store.state.chat.conversations;
      console.debug('conversations', conversations);
      console.debug('modelGroup', this.modelGroup);
      // filter by model group
      conversations = conversations?.filter(
        (conversation: IChatConversation) =>
          conversation.model && this.modelGroup.models?.map((item) => item.name as string)?.includes(conversation.model)
      );
      console.debug('filtered conversations', conversations);
      return conversations;
    },
    conversationGroups() {
      // split our 4 groups according to the `updated_at` field, to 'today', 'yesterday', 'this week', 'earlier'.
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const thisWeek = new Date(today);
      thisWeek.setDate(thisWeek.getDate() - today.getDay());
      const earlier = new Date(thisWeek);
      earlier.setDate(earlier.getDate() - 7);
      const groups = this.conversations?.reduce(
        (acc, conversation: IChatConversation) => {
          const updatedAt = new Date(conversation.updated_at! * 1000);
          if (updatedAt >= today) {
            (acc.today as IChatConversation[]).push(conversation);
          } else if (updatedAt >= yesterday) {
            (acc.yesterday as IChatConversation[]).push(conversation);
          } else if (updatedAt >= thisWeek) {
            (acc.thisWeek as IChatConversation[]).push(conversation);
          } else {
            (acc.earlier as IChatConversation[]).push(conversation);
          }
          return acc;
        },
        { today: [], yesterday: [], thisWeek: [], earlier: [] }
      ) as Record<string, IChatConversation[]>;
      // sort every group by `updated_at` field.
      return {
        ...(groups?.today?.length > 0 ? { today: groups?.today?.sort((a, b) => b.updated_at! - a.updated_at!) } : {}),
        ...(groups?.yesterday?.length > 0
          ? { yesterday: groups?.yesterday?.sort((a, b) => b.updated_at! - a.updated_at!) }
          : {}),
        ...(groups?.thisWeek?.length > 0
          ? { thisWeek: groups?.thisWeek?.sort((a, b) => b.updated_at! - a.updated_at!) }
          : {}),
        ...(groups?.earlier?.length > 0
          ? { earlier: groups?.earlier?.sort((a, b) => b.updated_at! - a.updated_at!) }
          : {})
      };
    },
    application() {
      return this.$store.state.chat.application;
    },
    loading() {
      return this.$store.state.chat.status.getConversations === Status.Request;
    },
    token() {
      return this.$store.state.chat?.credential?.token;
    }
  },
  watch: {
    modelGroup() {
      console.debug('modelGroup changed, refreshing conversations');
      const firstConversation = this.conversations?.[0];
      if (firstConversation) {
        this.$emit('change-conversation', firstConversation.id);
      }
    }
  },
  methods: {
    async onNewConversation() {
      console.debug('onNewConversation from side panel');
      this.$emit('change-conversation', undefined);
    },
    async onConfirm(conversation: IChatConversation) {
      const token = this.token;
      if (!token) {
        console.error('Token is not found');
        return;
      }
      if (conversation?.deleting && conversation.id) {
        await chatOperator.deleteConversation(conversation.id, {
          token
        });
        await this.$store.dispatch('chat/getConversations');
      } else if (conversation?.editing) {
        await chatOperator.updateConversation(conversation, {
          token
        });
        await this.$store.dispatch('chat/getConversations');
      } else {
        conversation.editing = true;
      }
    },
    onClickConversation(id?: string) {
      console.debug('onClickConversation in side panel', id);
      this.$emit('change-conversation', id);
    }
  }
});
</script>

<style lang="scss" scoped>
.panel {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  padding: 10px;
  width: 250px;
  height: 100%;
  border-right: none;

  .conversations {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    .group {
      width: 100%;
      display: flex;
      flex-direction: column;
      margin-top: 10px;
      .key {
        font-size: 12px;
        font-weight: 600;
        width: 100%;
        line-height: 40px;
        padding-left: 10px;
        color: var(--el-text-color-secondary);
      }
    }
    .conversation {
      width: 100%;
      height: 40px;
      display: flex;
      flex-direction: row;
      line-height: 40px;
      border-radius: 10px;
      padding: 0 10px;
      color: var(--el-text-color-primary);
      cursor: pointer;

      &.active,
      &:hover {
        background-color: var(--el-bg-color-page);
        .operations {
          display: block;
        }
      }

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
        line-height: 40px;
        overflow: hidden;
        text-overflow: ellipsis;
        padding-right: 8px;
        color: var(--el-text-color-primary);
      }
      .operations {
        display: none;
        width: 40px;
        color: var(--el-text-color-regular);
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
