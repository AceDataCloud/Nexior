<template>
  <el-menu mode="horizontal" :default-active="active">
    <el-menu-item v-if="site?.features?.midjourney?.enabled" index="/midjourney" @click="$router.push('/midjourney')">
      {{ $t('common.nav.midjourney') }}
    </el-menu-item>
    <el-menu-item v-if="site?.features?.flux?.enabled" index="/flux" @click="$router.push('/flux')">
      {{ $t('common.nav.flux') }}
    </el-menu-item>
  </el-menu>
</template>

<script lang="ts">
import { ElMenu, ElMenuItem } from 'element-plus';
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'ImageNavigator',
  components: {
    ElMenu,
    ElMenuItem
  },
  computed: {
    site() {
      return this.$store.state.site;
    },
    active() {
      console.log(this.$route.path);
      return this.$route.path;
    }
  }
});
</script>

<style lang="scss" scoped>
.el-menu {
  justify-content: center;
  height: 40px;
}
</style>
