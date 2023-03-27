<template>
  <el-container class="wrapper">
    <el-header class="header">
      <top-header />
    </el-header>
    <el-main class="main"> <router-view /> </el-main>
    <help-entry class="help" />
    <el-footer class="footer">
      <bottom-footer />
    </el-footer>
  </el-container>
</template>

<script lang="ts">
import TopHeader from '@/components/common/TopHeader.vue';
import BottomFooter from '@/components/common/BottomFooter.vue';
import { ElContainer, ElMain, ElFooter, ElHeader } from 'element-plus';
import HelpEntry from '@/components/common/HelpEntry.vue';

export default {
  name: 'LayoutService',
  components: {
    TopHeader,
    BottomFooter,
    ElContainer,
    ElMain,
    ElFooter,
    ElHeader,
    HelpEntry
  }
};
</script>

<style lang="scss" scoped>
.wrapper {
  min-height: 100vh;
}

.header {
  padding: 0;
  height: initial;
}

.help {
  position: fixed;
  right: 40px;
  bottom: 40px;
}
</style>
