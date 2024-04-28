<template>
  <div class="main">
    <div class="presets">
      <slot name="presets" />
    </div>
    <div class="operation">
      <slot name="operation" />
    </div>
    <div class="results">
      <slot name="results" />
    </div>
    <el-button round class="menu" @click="drawer = true">
      <font-awesome-icon icon="fa-solid fa-gear" class="icon-menu" />
    </el-button>
    <el-button round class="menu2" @click="drawer2 = true">
      <font-awesome-icon icon="fa-solid fa-bars" class="icon-menu" />
    </el-button>
    <el-drawer v-model="drawer" :with-header="false" size="300px" class="drawer">
      <slot name="presets" />
    </el-drawer>
    <el-drawer v-model="drawer2" :show-close="true" size="400px" class="drawer2">
      <slot name="results" />
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
      drawer: false,
      drawer2: false
    };
  },
  async mounted() {
    await this.onGetService();
    await this.onGetApplication();
  },
  methods: {
    async onGetService() {
      await this.$store.dispatch('midjourney/getService');
    },
    async onGetApplication() {
      await this.$store.dispatch('midjourney/getApplication');
    }
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
  .results {
    overflow-y: scroll;
    width: 400px;
    height: 100%;
    border-left: 1px solid var(--el-border-color);
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
      left: 20px;
      top: 20px;
      z-index: 1000;
    }
    .menu2 {
      display: block;
      position: fixed;
      right: 20px;
      top: 20px;
      z-index: 1000;
    }
  }
}
</style>
