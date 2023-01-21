<template>
  <el-header class="header">
    <top-header />
  </el-header>
  <el-container class="container">
    <el-aside class="aside">
      <navigator />
    </el-aside>
    <el-main class="main"> <router-view /> </el-main>
  </el-container>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Navigator from '@/components/console/Navigator.vue';
import TopHeader from '@/components/common/TopHeader.vue';

export default defineComponent({
  name: 'LayoutConsole',
  components: {
    Navigator,
    TopHeader
  },
  data() {
    return {};
  },
  computed: {},
  methods: {}
});
</script>

<style lang="scss" scoped>
.container {
  height: 100vh;
}
$width: 300px;
.aside {
  width: $width;
  height: 100%;
  background-color: white;
  padding: 15px;
  padding-top: 50px;
}
.main {
  width: calc(100% - $width);
  background-color: #f3f5f6;
  height: 100%;
}
</style>
