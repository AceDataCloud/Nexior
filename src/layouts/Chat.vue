<template>
  <div class="main">
    <div class="side">
      <slot name="side">
        <side-panel />
      </slot>
    </div>
    <div class="chat">
      <slot name="chat" />
    </div>
    <el-button round class="menu" @click="drawer = true">
      <font-awesome-icon icon="fa-solid fa-bars" class="icon-menu" />
    </el-button>
    <el-drawer v-model="drawer" :with-header="false" size="290px" class="drawer">
      <side-panel />
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
  data() {
    return {
      drawer: false
    };
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
    padding: 15px;
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
  .side {
    display: none;
  }
  .chat {
    width: 100%;
  }
  .menu {
    display: block;
    position: fixed;
    right: 20px;
    top: 20px;
    z-index: 2000;
  }
}
</style>
