<template>
  <div class="wrapper">
    <navigator class="navigator" />
    <router-view class="main" />
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
  overflow: hidden;
  .navigator {
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
