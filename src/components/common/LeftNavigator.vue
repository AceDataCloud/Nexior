<template>
  <div class="navigator">
    <div class="conversations">
      <navigator-item icon="fa-solid fa-plus" :title="$t('common.nav.newChat')" @click="onNewConversation" />
      <conversation-navigator-item
        v-for="(conversation, conversationIndex) in conversations"
        :key="conversationIndex"
        :title="conversation.title"
        icon="fa-regular fa-comment"
        @update:title="onUpdateTitle(conversation, $event)"
        @delete="onDeleteConversation(conversation.id)"
        @click="onSelectConversation(conversation.id)"
      />
    </div>
    <div class="operators">
      <navigator-item icon="fa-solid fa-gear" :title="$t('common.nav.setting')" @click="setting = true" />
      <setting-panel :visible="setting" @close="setting = false" />
      <navigator-item
        v-show="!confirming"
        icon="fa-solid fa-trash"
        :title="$t('common.nav.clearConversations')"
        @click="confirming = true"
      />
      <navigator-item
        v-show="confirming"
        icon="fa-solid fa-check"
        :title="$t('common.nav.confirmClearConversations')"
        @click="onClearConversations"
      />
      <navigator-item icon="fa-solid fa-arrow-right-from-bracket" :title="$t('common.nav.logOut')" @click="onLogout" />
    </div>
  </div>
</template>

<script lang="ts">
import { ROUTE_CONVERSATION_DETAIL, ROUTE_CONVERSATION_NEW } from '@/router';
import { defineComponent } from 'vue';
import NavigatorItem from './NavigatorItem.vue';
import ConversationNavigatorItem from '../conversation/ConversationNavigatorItem.vue';
import { IConversation } from '@/operators/conversation/models';
import SettingPanel from './SettingPanel.vue';

export default defineComponent({
  name: 'LeftNavigator',
  components: {
    NavigatorItem,
    ConversationNavigatorItem,
    SettingPanel
  },
  data() {
    return {
      confirming: false,
      setting: false
    };
  },
  computed: {
    conversations() {
      return this.$store.getters.conversations;
    }
  },
  methods: {
    onNewConversation() {
      this.$router.push({
        name: ROUTE_CONVERSATION_NEW
      });
    },
    onClearConversations() {
      this.$store.dispatch('setConversations', []);
      this.confirming = false;
      this.onNewConversation();
    },
    onSelectConversation(id: string) {
      this.$router.push({
        name: ROUTE_CONVERSATION_DETAIL,
        params: {
          id
        }
      });
    },
    onLogout() {
      this.$store.dispatch('resetAuth');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    },
    onUpdateTitle(conversation: IConversation, val: string) {
      conversation.title = val;
      this.$store.dispatch('setConversations', this.conversations);
    },
    onDeleteConversation(id: string) {
      const newConversations = this.conversations.filter((i: IConversation) => i.id !== id);
      this.$store.dispatch('setConversations', newConversations);
      this.onNewConversation();
    }
  }
});
</script>

<style lang="scss" scoped>
.navigator {
  display: flex;
  flex-direction: column;
  background-color: #202123;
  color: white;
  height: 100vh;
  padding: 15px 5px;
  font-size: 14px;
  .conversations {
    flex: 1;
  }
  .operators {
    height: fit-content;
  }
}
</style>
