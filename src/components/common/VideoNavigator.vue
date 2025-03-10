<template>
  <el-menu mode="horizontal" :default-active="active">
    <el-menu-item v-if="site?.features?.luma?.enabled" index="/luma" @click="$router.push('/luma')">
      {{ $t('common.nav.luma') }}
    </el-menu-item>
    <el-menu-item v-if="site?.features?.pika?.enabled" index="/pika" @click="$router.push('/pika')">
      {{ $t('common.nav.pika') }}
    </el-menu-item>
    <el-menu-item v-if="site?.features?.hailuo?.enabled" index="/hailuo" @click="$router.push('/hailuo')">
      {{ $t('common.nav.hailuo') }}
    </el-menu-item>
    <el-menu-item v-if="site?.features?.kling?.enabled" index="/kling" @click="$router.push('/kling')">
      {{ $t('common.nav.kling') }}
    </el-menu-item>
  </el-menu>
</template>

<script lang="ts">
import { ElMenu, ElMenuItem } from 'element-plus';
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'VideoNavigator',
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
