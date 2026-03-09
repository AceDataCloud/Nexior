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
  width: 250px;
  height: 100%;
  overflow-y: auto;
  flex-shrink: 0;
  border-right: 1px solid var(--el-border-color-lighter);
  background-color: color-mix(in srgb, var(--el-bg-color) 92%, var(--el-color-primary-light-9) 8%);
}

.chat {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  height: 100%;
  min-width: 0;
  padding-top: 45px;
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
    border: 1px solid var(--el-border-color-lighter);
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
  }
}
</style>
