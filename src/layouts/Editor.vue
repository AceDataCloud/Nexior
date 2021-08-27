<template>
  <el-container>
    <el-header>
      <top-header />
    </el-header>
    <el-container>
      <el-main>
        <slot name="main"></slot>
      </el-main>
    </el-container>
  </el-container>
</template>

<script lang="ts">
import { TopHeader } from '@/components/common/index';
export default {
  components: {
    TopHeader
  },
  name: 'LayoutEditor'
};
</script>

<style lang="scss" scoped>
.el-main {
  display: initial;
  flex: initial;
  padding: 0;
  margin: 0;
  width: 100%;
}
</style>
