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
            {{ getConversationTitle(conversation) }}
          </div>
          <div class="operations">
            <el-dropdown
              trigger="click"
              placement="bottom-end"
              :teleported="true"
              @command="(command) => onConversationCommand(command, conversation)"
            >
              <span class="more" @click.stop>
                <font-awesome-icon icon="fa-solid fa-ellipsis" />
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="rename" @click.stop>
                    <font-awesome-icon icon="fa-solid fa-pen-to-square" class="mr-2" />
                    重命名
                  </el-dropdown-item>
                  <el-dropdown-item command="delete" @click.stop>
                    <font-awesome-icon icon="fa-solid fa-trash" class="mr-2" />
                    {{ $t('common.button.delete') }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </div>
    </div>

    <el-dialog v-model="renameDialogVisible" width="420px" title="重命名" :close-on-click-modal="false">
      <el-input v-model="renameDraft" autofocus @keydown.enter="onConfirmRename" />
      <template #footer>
        <el-button @click="renameDialogVisible = false">{{ $t('common.button.cancel') }}</el-button>
        <el-button type="primary" :loading="renameSubmitting" @click="onConfirmRename">
          {{ $t('common.button.confirm') }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="deleteDialogVisible"
      width="420px"
      :title="$t('chat.message.confirmDelete')"
      :close-on-click-modal="false"
    >
      <div class="delete-tip">确认删除该会话？删除后不可恢复。</div>
      <template #footer>
        <el-button @click="deleteDialogVisible = false">{{ $t('common.button.cancel') }}</el-button>
        <el-button type="danger" :loading="deleteSubmitting" @click="onConfirmDelete">
          {{ $t('common.button.delete') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import {
  ElSkeleton,
  ElInput,
  ElButton,
  ElDialog,
  ElDropdown,
  ElDropdownItem,
  ElDropdownMenu,
  ElMessage
} from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { chatOperator } from '@/operators';
import { IChatConversation } from '@/models';
import { Status } from '@/models';

type ConversationCommand = 'rename' | 'delete';

export default defineComponent({
  name: 'SidePanel',
  components: {
    ElInput,
    ElButton,
    ElDialog,
    ElDropdown,
    ElDropdownItem,
    ElDropdownMenu,
    FontAwesomeIcon,
    ElSkeleton
  },
  props: {},
  emits: ['change-conversation'],
  data() {
    return {
      renameDialogVisible: false,
      deleteDialogVisible: false,
      actingConversation: undefined as IChatConversation | undefined,
      renameDraft: '',
      renameSubmitting: false,
      deleteSubmitting: false
    };
  },
  computed: {
    conversationId() {
      console.debug('conversationId in side', this.$route.params?.id);
      return this.$route.params?.id?.toString();
    },
    conversations() {
      // Server already filters by `model_group` (chat store action passes
      // `state.modelGroup.name`), so the panel just renders whatever the
      // store currently holds. No client-side filter needed.
      return this.$store.state.chat.conversations;
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
  methods: {
    async onNewConversation() {
      console.debug('onNewConversation from side panel');
      this.$emit('change-conversation', undefined);
    },
    onClickConversation(id?: string) {
      console.debug('onClickConversation in side panel', id);
      this.$emit('change-conversation', id);
    },
    getConversationTitle(conversation: IChatConversation) {
      // Backend writes `title` on every save (buildConversationTitle in
      // aichat2). For really old rows that never got a title we fall back
      // to the server-supplied `last_message_preview`. Don't try to dig
      // into `messages` here — list responses no longer carry it.
      return conversation?.title || conversation?.last_message_preview || '';
    },
    onConversationCommand(command: ConversationCommand, conversation: IChatConversation) {
      if (command === 'rename') {
        this.openRenameDialog(conversation);
      } else if (command === 'delete') {
        this.openDeleteDialog(conversation);
      }
    },
    openRenameDialog(conversation: IChatConversation) {
      this.actingConversation = conversation;
      this.renameDraft = (conversation?.title || '').trim();
      this.renameDialogVisible = true;
    },
    openDeleteDialog(conversation: IChatConversation) {
      this.actingConversation = conversation;
      this.deleteDialogVisible = true;
    },
    async onConfirmRename() {
      const token = this.token;
      const conversationId = this.actingConversation?.id;
      const title = (this.renameDraft || '').trim();
      if (!token) {
        ElMessage.error('Token 不存在，请重新登录');
        return;
      }
      if (!conversationId) {
        ElMessage.error('会话不存在');
        return;
      }
      if (!title) {
        ElMessage.warning('请输入名称');
        return;
      }
      this.renameSubmitting = true;
      try {
        await chatOperator.updateConversation(
          {
            id: conversationId,
            title
          } as IChatConversation,
          { token }
        );
        await this.$store.dispatch('chat/getConversations');
        this.renameDialogVisible = false;
        ElMessage.success('已重命名');
      } catch (e) {
        console.error(e);
        ElMessage.error('重命名失败，请稍后重试');
      } finally {
        this.renameSubmitting = false;
      }
    },
    async onConfirmDelete() {
      const token = this.token;
      const conversationId = this.actingConversation?.id;
      if (!token) {
        ElMessage.error('Token 不存在，请重新登录');
        return;
      }
      if (!conversationId) {
        ElMessage.error('会话不存在');
        return;
      }
      this.deleteSubmitting = true;
      try {
        await chatOperator.deleteConversation(conversationId, { token });
        await this.$store.dispatch('chat/getConversations');
        if (conversationId === this.conversationId) {
          this.$emit('change-conversation', undefined);
        }
        this.deleteDialogVisible = false;
        ElMessage.success('已删除');
      } catch (e) {
        console.error(e);
        ElMessage.error('删除失败，请稍后重试');
      } finally {
        this.deleteSubmitting = false;
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.panel {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  padding: 12px;
  width: 260px;
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
      margin-top: 12px;
      .key {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        width: 100%;
        line-height: 36px;
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
      transition: background-color 0.15s ease;

      &.active {
        background-color: var(--el-color-primary-light-9);
        color: var(--el-color-primary);
        .title {
          color: var(--el-color-primary);
          font-weight: 500;
        }
        .operations {
          display: flex;
        }
      }

      &:hover {
        background-color: var(--el-bg-color-page);
        .operations {
          display: flex;
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
        white-space: nowrap;
      }
      .operations {
        display: none;
        align-items: center;
        justify-content: flex-end;

        .more {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          height: 26px;
          border-radius: 10px;
          color: var(--el-text-color-secondary);
          cursor: pointer;
          transition: background-color 0.15s ease;

          &:hover {
            background: var(--el-fill-color-light);
            color: var(--el-text-color-primary);
          }
        }
      }
    }

    .delete-tip {
      color: var(--el-text-color-regular);
      font-size: 14px;
      line-height: 22px;
    }
  }
}
</style>
