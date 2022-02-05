<template>
  <el-container>
    <el-header>
      <top-header />
    </el-header>
    <el-container>
      <el-aside width="200px"> side</el-aside>
      <el-main> <router-view /> </el-main>
    </el-container>
  </el-container>
</template>

<script lang="ts">
import { TopHeader } from '@/components/common/index';
export default {
  components: {
    TopHeader
  },
  name: 'LayoutHome'
};
</script>
