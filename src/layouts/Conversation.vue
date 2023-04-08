<template>
  <div class="container">
    <el-aside class="aside">
      <left-navigator />
    </el-aside>
    <el-main class="main"> <router-view /> </el-main>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElMain, ElAside } from 'element-plus';
import LeftNavigator from '@/components/common/LeftNavigator.vue';

export default defineComponent({
  name: 'LayoutConversation',
  components: {
    ElMain,
    LeftNavigator
  }
});
</script>

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
}
</style>
