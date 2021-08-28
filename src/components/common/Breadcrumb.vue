<template>
  <el-breadcrumb separator="/" class="breadcrumb">
    <el-breadcrumb-item :to="{ path: '/' }">{{ $t('common.nav.home') }}</el-breadcrumb-item>
    <el-breadcrumb-item v-for="item in items" :to="{ name: item.name }">{{ item.meta.title }}</el-breadcrumb-item>
  </el-breadcrumb>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  data() {
    return {
      items: this.$route.matched
    };
  },
  mounted() {
    console.log('this', this.$route);
  }
});
</script>

<style lang="scss" scoped>
.breadcrumb {
  padding: 10px;
}
</style>
