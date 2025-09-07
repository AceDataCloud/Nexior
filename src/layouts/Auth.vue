<template>
  <el-container>
    <el-main class="h-[100vh]"> <router-view /> </el-main>
  </el-container>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElContainer, ElMain } from 'element-plus';

export default defineComponent({
  name: 'LayoutAuth',
  components: {
    ElContainer,
    ElMain
  }
});
</script>

