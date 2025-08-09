<template>
  <div class="main">
    <div class="config">
      <slot name="config" />
    </div>
    <div class="results">
      <slot name="results" />
    </div>
    <el-button circle class="menu" @click="drawer = true">
      <font-awesome-icon icon="fa-solid fa-magic" />
    </el-button>
    <el-drawer v-model="drawer" direction="ltr" :with-header="false" size="350px" class="drawer">
      <slot name="config" />
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

<style lang="scss" scoped>
.main {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: row;
  .menu {
    display: none;
  }
  .config {
    width: 300px;
    height: 100%;
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--el-border-color);
  }
  .results {
    flex: 1;
    height: 100%;
    display: flex;
    flex-direction: column;
  }
}

@media (max-width: 767px) {
  .main {
    position: relative;
    .config {
      display: none;
    }
    .results {
      display: block;
    }
    .menu {
      display: block;
      position: absolute;
      right: 8px;
      top: 45px;
      z-index: 1000;
    }
  }
}
</style>
