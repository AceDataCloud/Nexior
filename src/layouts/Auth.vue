<template>
  <el-container>
    <el-main> <router-view /> </el-main>
  </el-container>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'LayoutAuth',
  components: {},
  data() {
    return {};
  },
  computed: {},
  methods: {}
});
</script>

<style lang="scss" scoped>
.el-main {
  height: calc(100vh);
}
</style>
