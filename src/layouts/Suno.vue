<template>
  <div class="main">
    <div class="config">
      <slot name="config" />
    </div>
    <div class="result">
      <slot name="result" />
    </div>
    <div class="preview">
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
.main {
  flex: 1;
  display: flex;
  flex-direction: row;

  .config {
    width: 300px;
    height: 100%;
    overflow-y: scroll;
    border-right: 1px solid var(--el-border-color);
  }

  .result {
    height: 100%;
    flex: 1;
    width: calc(100% - 600px);
    height: 100%;
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--el-border-color);
  }

  .preview {
    height: 100%;
    width: 300px;
    height: 100%;
    display: flex;
    flex-direction: column;
  }
}

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
