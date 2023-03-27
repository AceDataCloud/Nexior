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
    <help-entry class="help" />
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
import HelpEntry from '@/components/common/HelpEntry.vue';

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
    ElCol,
    HelpEntry
  }
};
</script>

<style lang="scss" scoped>
.wrapper {
  min-height: 100vh;
}

.header {
  padding: 0;
  height: initial;
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
  @media (max-width: 1200px) {
    .left {
      display: none;
    }
  }
}

.help {
  position: fixed;
  right: 40px;
  bottom: 40px;
}
</style>
