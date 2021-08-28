<template>
  <el-breadcrumb separator="/">
    <el-breadcrumb-item :to="{ path: '/' }">{{ $t('common.nav.home') }}</el-breadcrumb-item>
    <el-breadcrumb-item v-for="item in items" :to="{ name: item.name }">{{ item.meta.title }}</el-breadcrumb-item>
  </el-breadcrumb>
</template>

<script>
export default {
  data() {
    return {
      items: this.$route.matched
    };
  },
  mounted() {
    console.log('this', this.$route);
  }
};
</script>
