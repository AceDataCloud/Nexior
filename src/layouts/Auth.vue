<template>
  <el-container>
    <el-main class="auth-main"> <router-view /> </el-main>
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

<style lang="scss" scoped>
.auth-main {
  // Respect iOS Dynamic Island / notch and Android status bar so the login
  // form doesn't slide under the system overlays.
  height: 100vh;
  padding-top: var(--app-safe-area-top);
  padding-bottom: var(--app-safe-area-bottom);
  box-sizing: border-box;
}
</style>
