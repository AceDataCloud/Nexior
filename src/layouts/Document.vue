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
import TopHeader from '@/components/common/TopHeader.vue';
import BottomFooter from '@/components/common/BottomFooter.vue';
import DocumentList from '@/components/document/List.vue';
import { ElContainer, ElMain, ElFooter, ElHeader, ElRow, ElCol } from 'element-plus';

export default {
  name: 'LayoutCourse',
  components: {
    TopHeader,
    BottomFooter,
    DocumentList,
    ElContainer,
    ElMain,
    ElFooter,
    ElHeader,
    ElRow,
    ElCol
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
  // max-width: 2000px;
  // margin: auto;
  .left {
    float: left;
    width: 280px;
    height: 100%;
    padding: 30px;
    box-shadow: 1px 0 0 #eee;
  }
  @media (max-width: 999px) {
    .left {
      display: none;
    }
  }
}
</style>
