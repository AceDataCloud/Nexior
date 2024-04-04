<template>
  <div class="panel">
    <el-skeleton v-if="conversations === undefined" />
    <div v-else class="conversations">
      <div class="conversation" @click="onNewConversation">
        <div class="icons">
          <font-awesome-icon icon="fa-solid fa-plus" class="icon" />
        </div>
        <div class="title">
          {{ $t('chatdoc.message.startNewChat') }}
        </div>
      </div>
      <div
        v-for="(conversation, conversationIndex) in conversations"
        :key="conversationIndex"
        :class="{ conversation: true, active: conversation.id === conversationId }"
        @click="onClick(conversation.id)"
      >
        <div class="icons">
          <font-awesome-icon icon="fa-regular fa-comment" class="icon" />
        </div>
        <div class="title">
          <span v-if="conversation?.deleting">
            {{ `${$t('chatdoc.message.confirmDelete')}?` }}
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
import { ROUTE_CHATDOC_CONVERSATION, ROUTE_CHATDOC_CONVERSATION_NEW } from '@/router/constants';
import { chatdocOperator } from '@/operators';
import { IChatdocRepository, IChatdocConversation } from '@/models';

export default defineComponent({
  name: 'SidePanel',
  components: {
    ElInput,
    FontAwesomeIcon,
    ElSkeleton
  },
  props: {},
  emits: ['click'],
  computed: {
    repositoryId() {
      return this.$route.params?.repositoryId?.toString();
    },
    conversationId() {
      return this.$route.params?.conversationId?.toString();
    },
    repository(): IChatdocRepository | undefined {
      return this.$store.state?.chatdoc?.repositories?.find((repository) => repository.id === this.repositoryId);
    },
    conversations() {
      return this.repository?.conversations;
    },
    application() {
      return this.$store.state.chatdoc.application;
    }
  },
  methods: {
    async onNewConversation() {
      this.$router.push({
        name: ROUTE_CHATDOC_CONVERSATION_NEW,
        params: {
          repositoryId: this.repositoryId
        }
      });
    },
    async onConfirm(conversation: IChatdocConversation) {
      if (conversation?.deleting) {
        await chatdocOperator.deleteConversation(conversation.id);
        await this.$store.dispatch('chat/getConversations');
      } else if (conversation?.editing) {
        await chatdocOperator.updateConversation(conversation);
        await this.$store.dispatch('chat/getConversations');
      } else {
        conversation.editing = true;
      }
    },
    onClick(id: string) {
      if (!id) {
        return;
      }
      this.$router.push({
        name: ROUTE_CHATDOC_CONVERSATION,
        params: {
          repositoryId: this.repositoryId,
          conversationId: id
        }
      });
      this.$emit('click', id);
    }
  }
});
</script>

<style lang="scss" scoped>
.panel {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  padding: 15px;
  width: 300px;
  height: 100%;
  border-right: 1px solid var(--el-border-color);
  overflow-y: scroll;

  .conversations {
    width: 100%;
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
      border: 1px dashed var(--el-border-color);
      line-height: 30px;
      border-radius: 10px;
      color: var(--el-text-color-primary);
      cursor: pointer;

      &.active,
      &:hover {
        background-color: var(--el-fill-color-extra-light);
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
        line-height: 32px;
        overflow: hidden;
        text-overflow: ellipsis;
        padding-right: 8px;
        color: var(--el-text-color-primary);
      }
      .operations {
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
