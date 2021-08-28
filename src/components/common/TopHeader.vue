<template>
  <el-container id="header" class="header">
    <el-aside width="200px">
      <img src="@/assets/images/logo.png" class="logo" />
    </el-aside>
    <el-main>
      <el-row>
        <el-col>
          <el-menu :default-active="active" class="el-menu-demo" mode="horizontal" @select="onSelect">
            <el-menu-item index="home" v-t="'common.home'" v-if="false"></el-menu-item>
            <el-menu-item index="editor" v-t="'common.editor'"></el-menu-item>
          </el-menu>
        </el-col>
      </el-row>
    </el-main>
  </el-container>
</template>

<script>
export default {
  name: 'TopHeader',
  data() {
    return {};
  },
  computed: {
    active() {
      return this.$route.name;
    }
  },
  methods: {
    onSelect(val) {
      this.$router.push({
        name: val
      });
    }
  }
};
</script>

<style lang="scss">
.header {
  height: 60px;
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  z-index: 999;
  width: 100%;
  height: 60px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  .logo {
    width: 130px;
    margin-left: 30px;
    margin-top: 15px;
  }
  .el-main {
    padding: 0;
  }
}
</style>
