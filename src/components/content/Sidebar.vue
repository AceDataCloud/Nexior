<template>
  <el-menu class="h-full" :default-active="$route.name?.toString()" @select="onSelect">
    <el-menu-item index="article-index">
      <el-icon class="mr-2">
        <document />
      </el-icon>
      <template #title>{{ $t('content.nav.article') }}</template>
    </el-menu-item>
    <el-menu-item index="platform-index">
      <el-icon class="mr-2">
        <box />
      </el-icon>
      <template #title>{{ $t('content.nav.platform') }}</template>
    </el-menu-item>
    <el-menu-item index="publication-index">
      <el-icon class="mr-2">
        <magic-stick />
      </el-icon>
      <template #title>{{ $t('content.nav.publication') }}</template>
    </el-menu-item>
  </el-menu>
</template>

<script lang="ts">
import { Document, Box, MagicStick } from '@element-plus/icons';
import routes from '@/router/content';
import { defineComponent } from 'vue';

export default defineComponent({
  components: {
    Document,
    Box,
    MagicStick
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
    onSelect(val: string) {
      console.log('val', val);
      this.$router.push({
        name: val
      });
    }
  }
});
</script>

<style lang="scss" scoped>
.el-menu {
  border-right: 1px solid rgba(0, 0, 0, 0.05);
  .el-menu-item {
    &.is-active {
      border-left: 3px solid var(--el-color-primary);
    }
  }
}
</style>
