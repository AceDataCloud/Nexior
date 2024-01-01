<template>
  <div class="wrapper">
    <div class="left">
      <navigator />
    </div>
    <div class="main">
      <router-view />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Navigator from '@/components/common/Navigator.vue';

export default defineComponent({
  name: 'LayoutMain',
  components: {
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
    width: calc(100% - 60px);
    flex: 1;
  }
}
</style>
