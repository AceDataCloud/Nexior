<template>
  <el-menu class="h-full">
    <el-menu-item>
      <el-icon :size="size" :color="color" class="mr-2">
        <document />
      </el-icon>
      <template #title>{{ $t('content.sidebar.article') }}</template>
    </el-menu-item>
    <el-menu-item>
      <el-icon :size="size" :color="color" class="mr-2">
        <box />
      </el-icon>
      <template #title>{{ $t('content.sidebar.platform') }}</template>
    </el-menu-item>
  </el-menu>
</template>

<script lang="ts">
import { Document, Box } from '@element-plus/icons';

export default {
  components: {
    Document,
    Box
  }
};
</script>
