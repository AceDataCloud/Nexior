<template>
  <div class="wrapper">
    <div class="left">
      <navigator />
    </div>
    <div class="main">
      <sidebar class="sidebar" />
      <router-view />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Navigator from '@/components/common/Navigator.vue';
import Sidebar from '@/components/chat/Sidebar.vue';

export default defineComponent({
  name: 'LayoutChat',
  components: {
    Sidebar,
    Navigator
  }
});
</script>

<style lang="scss" scoped>
.wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: row;
  .left {
    width: 60px;
    height: 100%;
    border-right: 1px solid var(--el-border-color);
  }
  .main {
    height: 100%;
    flex: 1;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: row;

    .sidebar {
      display: block;
      width: 300px;
      height: 100%;
      border-right: 1px solid #eee;
      overflow-y: scroll;
    }
  }
}
</style>
