<template>
  <div class="main flex flex-row flex-1">
    <div class="config w-[300px] h-full overflow-y-scroll border-r border-[var(--el-border-color)]">
      <slot name="config" />
    </div>
    <div class="result h-full flex flex-col flex-1 border-r border-[var(--el-border-color)]">
      <slot name="result" />
    </div>
    <div class="preview h-full w-[300px] flex flex-col">
      <slot name="preview" />
    </div>
    <el-button circle class="menu" @click="drawer = true">
      <font-awesome-icon icon="fa-solid fa-magic" />
    </el-button>
    <el-drawer v-model="drawer" direction="ltr" :with-header="false" size="340px" class="drawer">
      <slot name="config" />
    </el-drawer>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElDrawer, ElButton } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

export default defineComponent({
  name: 'LayoutSuno',
  components: {
    ElDrawer,
    ElButton,
    FontAwesomeIcon
  },
  data() {
    return {
      drawer: false,
      preview: false
    };
  },
  computed: {}
});
</script>

<style lang="scss" scoped>
.menu {
  display: none;
}

@media (max-width: 767px) {
  .main {
    .config {
      display: none;
    }
    .result {
      width: 100%;
    }
    .preview {
      display: none;
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
