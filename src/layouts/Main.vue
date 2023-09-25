<template>
  <div class="wrapper">
    <div class="sidebar"></div>
    <div class="main">
      <router-view />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElContainer, ElMain } from 'element-plus';

export default defineComponent({
  name: 'LayoutMain',
  components: {}
});
</script>

<style lang="scss" scoped>
.wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  .sidebar {
    width: 50px;
  }
  .main {
    flex: 1;
  }
}
</style>
