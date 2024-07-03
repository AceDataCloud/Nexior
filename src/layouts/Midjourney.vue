<template>
  <div class="main">
    <div class="presets">
      <slot name="presets" />
    </div>
    <div class="operation">
      <slot name="operation" />
    </div>
    <el-button round class="menu" @click="drawer = true">
      <font-awesome-icon icon="fa-solid fa-gear" class="icon-menu" />
    </el-button>
    <el-drawer v-model="drawer" :with-header="false" size="300px" class="drawer">
      <slot name="presets" />
    </el-drawer>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElDrawer, ElButton } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

export default defineComponent({
  name: 'LayoutMidjourney',
  components: {
    ElDrawer,
    ElButton,
    FontAwesomeIcon
  },
  data() {
    return {
      drawer: false
    };
  }
});
</script>

<style lang="scss">
.drawer2 {
  .el-drawer__header {
    margin-bottom: 0;
  }
  .el-drawer__body {
    .tasks {
      padding-top: 0;
    }
  }
}
</style>

<style lang="scss" scoped>
.main {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: row;
  .menu {
    display: none;
  }
  .menu2 {
    display: none;
  }
  .presets {
    width: 260px;
    height: 100%;
    overflow-y: scroll;
  }
  .operation {
    flex: 1;
    padding: 15px;
    height: 100%;
    overflow-x: scroll;
    display: flex;
    flex-direction: column;
  }
}

@media screen and (min-width: 768px) and (max-width: 1060px) {
  .main {
    position: relative;
    .presets {
      display: none;
    }
    .menu {
      display: block;
      position: absolute;
      left: 20px;
      top: 20px;
      z-index: 1000;
    }
  }
}

@media (max-width: 767px) {
  .main {
    position: relative;
    .presets {
      display: none;
    }
    .results {
      display: none;
    }
    .menu {
      display: block;
      position: absolute;
      left: 15px;
      top: 15px;
      z-index: 1000;
    }
  }
}
</style>
