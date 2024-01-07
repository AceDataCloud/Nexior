<template>
  <div class="wrapper">
    <navigator class="navigator" />
    <div class="main">
      <side-panel class="side" />
      <router-view class="operation" />
    </div>
    <el-button round class="menu" @click="drawer = true">
      <font-awesome-icon icon="fa-solid fa-bars" class="icon-menu" />
    </el-button>
    <el-drawer v-model="drawer" :with-header="false" size="340px" class="drawer">
      <side-panel />
    </el-drawer>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Navigator from '@/components/common/Navigator.vue';
import SidePanel from '@/components/console/SidePanel.vue';
import { ElDrawer, ElButton } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

export default defineComponent({
  name: 'LayoutConsole',
  components: {
    SidePanel,
    Navigator,
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
.wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: row;

  .navigator {
    height: 100%;
    border-right: 1px solid var(--el-border-color);
  }

  .main {
    height: 100%;
    width: calc(100% - 60px);
    flex: 1;
    display: flex;
    flex-direction: row;
  }
  .menu {
    display: none;
  }
}

@media screen and (max-width: 767px) {
  .wrapper {
    .navigator {
      border-right: none;
    }
    .main {
      .side {
        display: none;
      }
      .panel {
        width: 100%;
        height: 100%;
        overflow-y: scroll;
      }
    }
    .menu {
      display: block;
      position: fixed;
      right: 20px;
      top: 20px;
      z-index: 100;
    }
  }
}
</style>
