<template>
  <el-breadcrumb separator="/" class="breadcrumb">
    <el-breadcrumb-item :to="{ path: '/' }">{{ $t('common.nav.home') }}</el-breadcrumb-item>
    <el-breadcrumb-item v-for="(item, itemIndex) in items" :key="itemIndex" :to="{ name: item.name }">{{
      item.meta.title
    }}</el-breadcrumb-item>
  </el-breadcrumb>
</template>

<script lang="ts">
import { ElBreadcrumb, ElBreadcrumbItem } from 'element-plus';
import { defineComponent } from 'vue';

export default defineComponent({
  components: {
    ElBreadcrumb,
    ElBreadcrumbItem
  },
  data() {
    return {
      items: this.$route.matched
    };
  }
});
</script>

<style lang="scss" scoped>
.breadcrumb {
  padding: 10px;
}
</style>
