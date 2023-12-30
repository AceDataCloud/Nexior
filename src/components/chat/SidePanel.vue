<template>
  <div class="sidebar">
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
import { chatOperator } from '@/operators';
import { IChatConversation } from '@/operators/chat/models';
import { Status } from '@/store/common/models';
import { v4 as uuid } from 'uuid';

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
    conversations() {
      return this.$store.state.chat.conversations;
    },
    applications() {
      return this.$store.state.chat.applications;
    },
    loading() {
      return this.$store.state.chat.getConversationsStatus === Status.Request;
    }
  },
  methods: {
    async onNewConversation() {
      this.$router.push({
        name: ROUTE_CHAT_CONVERSATION,
        params: {
          id: uuid()
        }
      });
    },
    async onConfirm(conversation: IChatConversation) {
      if (conversation?.deleting) {
        await chatOperator.deleteConversation(conversation.id);
        await this.$store.dispatch('chat/getConversations');
      } else if (conversation?.editing) {
        await chatOperator.updateConversation(conversation);
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
.sidebar {
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
