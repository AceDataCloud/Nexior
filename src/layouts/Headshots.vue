<template>
  <div class="main">
    <div class="config">
      <slot name="config" />
    </div>
    <div class="result">
      <slot name="result" />
    </div>
    <el-button round class="menu" @click="drawer = true">
      <font-awesome-icon icon="fa-solid fa-gear" class="icon-menu" />
    </el-button>
    <el-drawer v-model="drawer" :with-header="false" size="340px" class="drawer">
      <slot name="config" />
    </el-drawer>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElDrawer, ElButton } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

export default defineComponent({
  name: 'LayoutHeadshots',
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
    padding: 15px;
    flex: 1;
    width: calc(100% - 300px);
    height: 100%;
    display: flex;
    flex-direction: column;
  }
}

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
    position: fixed;
    left: 15px;
    top: 15px;
    z-index: 2000;
  }
}
</style>
