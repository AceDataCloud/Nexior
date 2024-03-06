<template>
  <div class="panel">
    <el-skeleton v-if="loading && conversations === undefined" />
    <div v-else class="conversations">
      <div class="conversation" @click="onNewConversation">
        <div class="icons">
          <font-awesome-icon icon="fa-solid fa-plus" class="icon" />
        </div>
        <div class="title">
          {{ $t('chat.message.startNewChat') }}
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
  emits: ['click'],
  computed: {
    conversationId() {
      return this.$route.params?.id?.toString();
    },
    conversations() {
      return this.$store.state.chat.conversations;
    },
    application() {
      return this.$store.state.chat.application;
    },
    loading() {
      return this.$store.state.chat.status.getConversations === Status.Request;
    },
    token() {
      return this.application?.credentials?.[0].token;
    }
  },
  methods: {
    async onNewConversation() {
      this.$router.push({
        name: ROUTE_CHAT_CONVERSATION_NEW
      });
    },
    async onConfirm(conversation: IChatConversation) {
      const token = this.token;
      if (!token) {
        console.error('Token is not found');
        return;
      }
      if (conversation?.deleting) {
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
.panel {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  padding: 15px;
  width: 300px;
  height: 100%;
  border-right: 1px solid #eee;
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
      border: 1px dashed hsl(0, 0%, 93%);
      line-height: 30px;
      border-radius: 10px;
      color: #666;
      cursor: pointer;

      &.active,
      &:hover {
        background-color: #eee;
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
