<template>
  <div class="container">
    <el-aside class="aside">
      <left-navigator />
    </el-aside>
    <el-main class="main"> <router-view /> </el-main>
    <el-button round class="menu" @click="drawer = true">
      <font-awesome-icon icon="fa-solid fa-bars" class="icon-menu" />
    </el-button>
    <el-drawer v-model="drawer" :with-header="false" size="50%" class="drawer">
      <left-navigator />
    </el-drawer>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElMain, ElAside, ElButton, ElDrawer } from 'element-plus';
import LeftNavigator from '@/components/common/LeftNavigator.vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

export default defineComponent({
  name: 'LayoutConversation',
  components: {
    ElMain,
    ElAside,
    ElDrawer,
    ElButton,
    LeftNavigator,
    FontAwesomeIcon
  },
  data() {
    return {
      drawer: false
    };
  }
});
</script>

<style lang="scss">
.drawer {
  .el-drawer__body {
    padding: 0;
  }
}
</style>

<style lang="scss" scoped>
.container {
  display: flex;
  height: 100vh;
  width: 100%;
  max-width: initial;
}

.header {
  padding: 0;
}

.menu {
  display: none;
}

$width: 300px;
.aside {
  width: $width;
  height: 100%;
  background-color: white;
}

.header {
  display: none;
}

.main {
  width: calc(100% - $width);
  background-color: #f3f5f6;
  height: 100%;
}

@media (max-width: 767px) {
  .container {
    display: block;
  }
  .aside {
    display: none;
  }
  .header {
    display: block;
    background: white;
    padding: 15px;
    padding-top: 50px;
    height: fit-content;
    overflow: hidden;
    .logo {
      width: 100%;
    }
  }
  .main {
    width: 100%;
  }

  .menu {
    display: block;
    position: fixed;
    right: 20px;
    top: 20px;
  }
}
</style>
