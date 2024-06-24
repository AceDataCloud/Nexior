<template>
  <el-container class="wrapper">
    <el-header class="header">
      <top-header />
    </el-header>
    <el-main class="main"> <router-view /> </el-main>
  </el-container>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import TopHeader from '@/components/common/TopHeader.vue';

export default defineComponent({
  name: 'LayoutMain',
  components: {
    TopHeader
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
