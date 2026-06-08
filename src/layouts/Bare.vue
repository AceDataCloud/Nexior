<template>
  <el-container class="wrapper min-h-[100vh]">
    <el-main class="main"> <router-view /> </el-main>
    <el-footer class="footer p-0 h-auto">
      <bottom-footer />
    </el-footer>
  </el-container>
</template>

<script lang="ts">
import BottomFooter from '@/components/common/BottomFooter.vue';
import { ElContainer, ElMain, ElFooter } from 'element-plus';
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'LayoutBare',
  components: {
    BottomFooter,
    ElContainer,
    ElMain,
    ElFooter
  }
});
</script>
