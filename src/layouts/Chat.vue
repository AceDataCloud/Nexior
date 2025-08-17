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
    <el-button round class="menu" @click="drawer = true">
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
  flex: 1;
  display: flex;
  flex-direction: row;
  .side {
    width: 250px;
    height: 100%;
    overflow-y: scroll;
    border-right: 1px solid var(--el-border-color);
  }

  .chat {
    height: 100%;
    padding: 45px 0 0 0;
    flex: 1;
    width: calc(100% - 250px);
    height: 100%;
    display: flex;
    flex-direction: column;
    position: relative;
  }
}

.menu {
  display: none;
}

@media (max-width: 767px) {
  .main {
    .side {
      display: none;
    }
    .chat {
      width: 100%;
      padding: 50px 15px 0 10px;
    }
    .menu {
      display: block;
      position: fixed;
      left: 20px;
      top: 50px;
      z-index: 2000;
    }
  }
}
</style>
