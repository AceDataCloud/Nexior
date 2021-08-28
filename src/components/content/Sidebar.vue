<template>
  <el-menu class="h-full" router :default-active="$route.name">
    <el-menu-item index="article" @select="onSelect">
      <el-icon class="mr-2">
        <document />
      </el-icon>
      <template #title>{{ $t('content.nav.article') }}</template>
    </el-menu-item>
    <el-menu-item index="platform">
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
    console.log(this.$route);
  },
  methods: {
    onSelect(val) {
      this.$router.push({
        name: val
      });
    }
  }
};
</script>
