<template>
  <div class="conversation-actions">
    <el-dialog
      v-model="renameDialogVisible"
      width="420px"
      :title="$t('chat.actions.renameTitle')"
      :close-on-click-modal="false"
    >
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
      <div class="delete-tip">{{ $t('chat.actions.deleteConfirm') }}</div>
      <template #footer>
        <el-button @click="deleteDialogVisible = false">{{ $t('common.button.cancel') }}</el-button>
        <el-button type="danger" :loading="deleteSubmitting" @click="onConfirmDelete">
          {{ $t('common.button.delete') }}
        </el-button>
      </template>
    </el-dialog>

    <share-conversation-dialog
      v-model="shareDialogVisible"
      :conversation-id="actingConversation?.id"
      :share-id="actingConversation?.share_id"
      @update:share-id="onShareIdUpdated"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import { ElButton, ElDialog, ElInput, ElMessage } from 'element-plus';
import { chatOperator } from '@/operators';
import { IChatConversation } from '@/models';
import ShareConversationDialog from './ShareConversationDialog.vue';

export type ConversationCommand = 'rename' | 'delete' | 'share';

export default defineComponent({
  name: 'ConversationActions',
  components: {
    ElButton,
    ElDialog,
    ElInput,
    ShareConversationDialog
  },
  props: {
    // Id of the conversation currently open in the page. Deleting *this* one
    // has to reset the route, deleting any other row must not.
    activeConversationId: {
      type: String as PropType<string | undefined>,
      default: undefined
    }
  },
  emits: ['change-conversation'],
  data() {
    return {
      renameDialogVisible: false,
      deleteDialogVisible: false,
      shareDialogVisible: false,
      actingConversation: undefined as IChatConversation | undefined,
      renameDraft: '',
      renameSubmitting: false,
      deleteSubmitting: false
    };
  },
  computed: {
    token() {
      return this.$store.state.chat?.credential?.token;
    }
  },
  methods: {
    run(command: ConversationCommand, conversation: IChatConversation) {
      if (command === 'rename') {
        this.openRenameDialog(conversation);
      } else if (command === 'delete') {
        this.openDeleteDialog(conversation);
      } else if (command === 'share') {
        this.openShareDialog(conversation);
      }
    },
    openShareDialog(conversation: IChatConversation) {
      this.actingConversation = conversation;
      this.shareDialogVisible = true;
    },
    onShareIdUpdated(shareId?: string) {
      // Reflect the new share state on the row + store so reopening the
      // dialog shows the correct link without a refetch. Skip when the store
      // has no such row yet — `setConversation` would unshift the stub we may
      // have been handed and leave a titleless phantom row in the sidebar.
      const acting = this.actingConversation;
      if (!acting?.id) return;
      acting.share_id = shareId;
      const known = this.$store.state.chat?.conversations?.some(
        (conversation: IChatConversation) => conversation.id === acting.id
      );
      if (!known) return;
      this.$store.dispatch('chat/setConversation', { ...acting, share_id: shareId });
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
        ElMessage.error(this.$t('chat.actions.tokenMissing'));
        return;
      }
      if (!conversationId) {
        ElMessage.error(this.$t('chat.actions.conversationMissing'));
        return;
      }
      if (!title) {
        ElMessage.warning(this.$t('chat.actions.renameEmpty'));
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
        ElMessage.success(this.$t('chat.actions.renameSuccess'));
      } catch (e) {
        console.error(e);
        ElMessage.error(this.$t('chat.actions.renameFailed'));
      } finally {
        this.renameSubmitting = false;
      }
    },
    async onConfirmDelete() {
      const token = this.token;
      const conversationId = this.actingConversation?.id;
      if (!token) {
        ElMessage.error(this.$t('chat.actions.tokenMissing'));
        return;
      }
      if (!conversationId) {
        ElMessage.error(this.$t('chat.actions.conversationMissing'));
        return;
      }
      this.deleteSubmitting = true;
      try {
        await chatOperator.deleteConversation(conversationId, { token });
        await this.$store.dispatch('chat/getConversations');
        if (conversationId === this.activeConversationId) {
          this.$emit('change-conversation', undefined);
        }
        this.deleteDialogVisible = false;
        ElMessage.success(this.$t('chat.actions.deleteSuccess'));
      } catch (e) {
        console.error(e);
        ElMessage.error(this.$t('chat.actions.deleteFailed'));
      } finally {
        this.deleteSubmitting = false;
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.delete-tip {
  color: var(--el-text-color-regular);
  font-size: 14px;
  line-height: 1.6;
}
</style>
