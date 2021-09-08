<template>
  <el-main>
    <router-view />
  </el-main>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  data() {
    return {};
  },
  name: 'LayoutAuth',
  computed: {},
  methods: {}
});
</script>

<style lang="scss" scoped>
.el-main {
  // background-color: #283443;
  height: 100%;
  width: 100%;
}
</style>
