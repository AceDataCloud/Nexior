<template>
  <div class="main flex-1 h-full flex flex-row">
    <div class="config w-[300px] h-full flex flex-col border-r border-[var(--el-border-color)]">
      <slot name="config" />
    </div>
    <div class="results flex-1 h-full flex flex-col">
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
  .menu {
    display: none;
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
      width: 100%;
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
