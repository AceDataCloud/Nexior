<template>
  <el-menu class="h-full" router>
    <el-menu-item index="/content/article">
      <el-icon class="mr-2">
        <document />
      </el-icon>
      <template #title>{{ $t('content.nav.article') }}</template>
    </el-menu-item>
    <el-menu-item index="/content/platform">
      <el-icon class="mr-2">
        <box />
      </el-icon>
      <template #title>{{ $t('content.nav.platform') }}</template>
    </el-menu-item>
  </el-menu>
</template>

<script lang="ts">
import { Document, Box } from '@element-plus/icons';
import routes from '@/router/content';

export default {
  components: {
    Document,
    Box
  },
  data() {
    return {
      routes
    };
  },
  mounted() {
    console.log(routes);
  }
};
</script>
