<template>
  <el-container :class="showFullHeight ? 'h-screen' : ''">
    <el-header>
      <top-header />
    </el-header>
    <el-container>
      <el-aside width="250px" v-if="showSidebar">
        <sidebar />
      </el-aside>
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script lang="ts">
import Sidebar from '@/components/content/Sidebar.vue';
import { TopHeader } from '@/components/common/index';
import { defineComponent } from 'vue';

interface IData {
  routes: {
    detail: string[];
  };
}

export default defineComponent({
  components: {
    TopHeader,
    Sidebar
  },
  data(): IData {
    return {
      routes: {
        detail: ['article-detail']
      }
    };
  },
  name: 'LayoutContent',
  computed: {
    showSidebar(): boolean {
      console.log('router', this.$route.name);
      return !this.isDetailRoute();
    },
    showFullHeight(): boolean {
      return !this.isDetailRoute();
    }
  },
  methods: {
    isDetailRoute(): boolean {
      return this.routes.detail.includes(this.$route.name?.toString() || '');
    }
  }
});
</script>

<style lang="scss" scoped>
.el-main {
  display: initial;
  flex: initial;
  padding: 0;
  margin: 0;
  width: 100%;
}
</style>
