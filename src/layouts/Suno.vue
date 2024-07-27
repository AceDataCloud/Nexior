<template>
  <div class="main">
    <!-- 最左侧配置栏 -->
    <div class="config">
      <slot name="config" />
    </div>
    <!-- 中间歌曲列表栏 -->
    <div class="result">
      <slot name="result" />
    </div>
    <!-- 最右边歌曲预览栏 -->
    <div class="preview">
      <slot name="preview" />
    </div>
    <el-button round class="menu" @click="drawer = true">
      <font-awesome-icon icon="fa-solid fa-gear" class="icon-menu" />
    </el-button>
    <el-drawer v-model="drawer" :with-header="false" size="340px" class="drawer">
      <slot name="config" />
    </el-drawer>
    <!-- <el-drawer v-model="isPlaying" :with-header="false" size="340px" class="preview_drawer">
      <slot name="preview" />
    </el-drawer> -->
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
  computed: {
    isPlaying() {
      return this.$store.state.suno?.player?.isPlaying;
    }
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
  .preview_drawer {
    display: none;
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
      position: fixed;
      left: 15px;
      top: 15px;
      z-index: 2000;
    }
  }
}
</style>
