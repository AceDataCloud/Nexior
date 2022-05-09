<template>
  <el-container>
    <el-header>
      <top-header />
    </el-header>
    <el-main> <router-view /> </el-main>
    <el-footer>
      <bottom-footer />
    </el-footer>
  </el-container>
</template>

<script lang="ts">
import { TopHeader } from '@/components/common/index';
import BottomFooter from '@/components/common/BottomFooter.vue';
export default {
  name: 'LayoutOrder',
  components: {
    TopHeader,
    BottomFooter
  }
};
</script>

<style lang="scss">
.el-header,
.el-footer {
  padding: 0;
}
</style>
