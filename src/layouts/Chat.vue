<template>
  <div class="main">
    <div class="side">
      <slot name="side">
        <side-panel @change-conversation="onChangeConversation" />
      </slot>
    </div>
    <div class="chat">
      <slot name="chat" />
    </div>
    <el-button circle class="menu" @click="drawer = true">
      <font-awesome-icon icon="fa-solid fa-bars" />
    </el-button>
    <el-drawer v-model="drawer" direction="ltr" :with-header="false" size="290px">
      <side-panel @change-conversation="onChangeConversation" />
    </el-drawer>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import SidePanel from '@/components/chat/SidePanel.vue';
import { ElDrawer, ElButton } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

export default defineComponent({
  name: 'LayoutChat',
  components: {
    SidePanel,
    ElDrawer,
    ElButton,
    FontAwesomeIcon
  },
  emits: ['change-conversation'],
  data() {
    return {
      drawer: false
    };
  },
  methods: {
    onChangeConversation(id?: string) {
      console.debug('onChangeConversation in layout', id);
      this.$emit('change-conversation', id);
    }
  }
});
</script>

<style lang="scss" scoped>
.main {
  display: flex;
  flex: 1;
  height: 100%;
}

.side {
  width: 260px;
  height: 100%;
  overflow-y: auto;
  flex-shrink: 0;
  background-color: var(--app-sidebar-bg);
  border-right: 1px solid var(--app-border-subtle);
}

.chat {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  height: 100%;
  min-width: 0;
  padding-top: 45px;
  background-color: var(--app-content-bg);
}

.menu {
  display: none;
}

@media (max-width: 767px) {
  .side {
    display: none;
  }

  .chat {
    width: 100%;
    padding: 52px 10px 0;
  }

  .menu {
    display: block;
    position: fixed;
    left: 12px;
    top: 48px;
    z-index: 2000;
    box-shadow: var(--app-shadow-md);
  }
}
</style>
