<template>
  <div class="navigator">
    <div class="conversations">
      <navigator-item icon="fa-regular fa-user" :title="$t('common.nav.newChat')" @click="onNewConversation" />
      <navigator-item
        v-for="(conversation, conversationIndex) in conversations"
        :key="conversationIndex"
        icon="fa-regular fa-user"
        :title="conversation.title"
        @click="onSelectConversation(conversation.id)"
      />
    </div>
    <div class="operators">
      <navigator-item
        v-show="!confirming"
        icon="fa-regular fa-user"
        :title="$t('common.nav.clearConversations')"
        @click="confirming = true"
      />
      <navigator-item
        v-show="confirming"
        icon="fa-regular fa-user"
        :title="$t('common.nav.confirmClearConversations')"
        @click="onClearConversations"
      />
      <navigator-item icon="fa-regular fa-user" :title="$t('common.nav.logOut')" @click="onLogout" />
    </div>
  </div>
</template>

<script lang="ts">
import { ROUTE_CONVERSATION_DETAIL, ROUTE_CONVERSATION_NEW } from '@/router';
import { defineComponent } from 'vue';
import NavigatorItem from './NavigatorItem.vue';

export default defineComponent({
  name: 'LeftNavigator',
  components: {
    NavigatorItem
  },
  data() {
    return {
      confirming: false
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
