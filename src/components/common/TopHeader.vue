<template>
  <el-container id="header" class="header">
    <el-aside width="250px">
      <img src="@/assets/images/logo.png" class="logo" @click="onHome" />
    </el-aside>
    <el-main>
      <el-row>
        <el-col>
          <el-menu :default-active="active" class="el-menu-demo" mode="horizontal" @select="onSelect">
            <el-menu-item index="home" v-t="'common.nav.home'" v-if="false"></el-menu-item>
            <el-menu-item index="editor" v-t="'common.nav.editor'"></el-menu-item>
          </el-menu>
        </el-col>
      </el-row>
    </el-main>
  </el-container>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
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
    onSelect(val: string) {
      this.$router.push({
        name: val
      });
    },
    onHome() {
      this.$router.push({
        name: 'home'
      });
    }
  }
});
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
  .logo {
    width: 130px;
    margin-left: 30px;
    margin-top: 15px;
    cursor: pointer;
  }
  .el-main {
    padding: 0;
  }
}
</style>
