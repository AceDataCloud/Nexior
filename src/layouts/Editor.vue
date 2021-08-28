<template>
  <el-container>
    <el-header>
      <top-header />
    </el-header>
    <el-container>
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script lang="ts">
import Sidebar from '@/components/content/Sidebar.vue';
import { TopHeader } from '@/components/common/index';
export default {
  components: {
    TopHeader,
    Sidebar
  },
  name: 'LayoutEditor'
};
</script>

<style lang="scss">
#app {
  height: initial;
}
</style>
<style lang="scss" scoped>
.el-main {
  display: initial;
  flex: initial;
  padding: 0;
  margin: 0;
  width: 100%;
}
</style>
