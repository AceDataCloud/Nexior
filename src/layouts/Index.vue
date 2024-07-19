<template>
  <el-container class="wrapper">
    <el-header class="header">
      <top-header />
    </el-header>
    <el-main class="main"> <router-view /> </el-main>
    <el-footer class="footer">
      <bottom-footer />
    </el-footer>
  </el-container>
</template>

<script lang="ts">
import TopHeader from '@/components/common/TopHeader.vue';
import BottomFooter from '@/components/common/BottomFooter.vue';
import { ElContainer, ElMain, ElFooter, ElHeader } from 'element-plus';
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'LayoutIndex',
  components: {
    TopHeader,
    BottomFooter,
    ElContainer,
    ElMain,
    ElFooter,
    ElHeader
  }
});
</script>

<style lang="scss" scoped>
.wrapper {
  min-height: 100vh;
}

.header {
  padding: 0;
  height: initial;
}

.footer {
  padding: 0;
  height: initial;
}
</style>
