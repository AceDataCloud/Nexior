<template>
  <el-container class="wrapper min-h-[100vh]">
    <el-header class="header p-0 h-auto">
      <top-header />
    </el-header>
    <el-main class="main"> <router-view /> </el-main>
    <el-footer class="footer p-0 h-auto">
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

