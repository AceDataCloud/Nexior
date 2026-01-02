<template>
  <div class="main flex flex-row flex-1">
    <div class="config w-[300px] h-full overflow-y-scroll border-r border-[var(--el-border-color)]">
      <slot name="config" />
    </div>
    <div class="result h-full p-[15px] flex-1 flex flex-col">
      <slot name="result" />
    </div>
    <el-button circle class="menu" @click="drawer = true">
      <font-awesome-icon icon="fa-solid fa-magic" />
    </el-button>
    <el-drawer v-model="drawer" direction="ltr" :with-header="false" size="350px">
      <slot name="config" />
    </el-drawer>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElDrawer, ElButton } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

export default defineComponent({
  name: 'LayoutSeedance',
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
.menu {
  display: none;
}

@media (max-width: 767px) {
  .config {
    display: none;
  }
  .result {
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
</style>

