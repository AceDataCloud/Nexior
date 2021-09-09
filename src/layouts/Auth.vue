<template>
  <el-container>
    <el-main> <router-view /> </el-main>
  </el-container>
</template>

<script lang="ts">
import { TopHeader } from '@/components/common/index';

import { defineComponent } from 'vue';

export default defineComponent({
  components: {
    TopHeader
  },
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
  height: calc(100vh);
}
</style>
