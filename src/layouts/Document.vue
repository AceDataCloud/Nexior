<template>
  <el-container class="wrapper">
    <el-header class="header">
      <top-header />
    </el-header>
    <el-main class="main">
      <el-row>
        <el-col :span="22" :offset="1">
          <div class="left">
            <document-list />
          </div>
          <router-view />
        </el-col>
      </el-row>
    </el-main>
    <el-footer class="footer">
      <bottom-footer />
    </el-footer>
  </el-container>
</template>

<script lang="ts">
import { TopHeader } from '@/components/common/index';
import BottomFooter from '@/components/common/BottomFooter.vue';
import DocumentList from '@/components/document/List.vue';

export default {
  name: 'LayoutCourse',
  components: {
    TopHeader,
    BottomFooter,
    DocumentList
  }
};
</script>

<style lang="scss" scoped>
.wrapper {
  min-height: 100vh;
}

.header {
  padding: 0;
}

.main {
  .left {
    float: left;
    width: 280px;
    height: 100%;
    box-shadow: 1px 0 0 #eee;
  }
}
</style>
