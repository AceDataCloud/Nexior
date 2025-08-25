<template>
  <div class="console">
    <div class="main">
      <side-panel class="side" />
      <router-view class="panel" />
    </div>
    <navigator class="navigator" :direction="mobile ? 'row' : 'column'" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Navigator from '@/components/common/Navigator.vue';
import SidePanel from '@/components/console/SidePanel.vue';

export default defineComponent({
  name: 'LayoutConsole',
  components: {
    SidePanel,
    Navigator
  },
  data() {
    return {
      mobile: window.innerWidth < 768
    };
  },
  mounted() {
    window.addEventListener('resize', () => {
      this.mobile = window.innerWidth < 768;
    });
  }
});
</script>

<style lang="scss" scoped>
@media screen and (min-width: 768px) {
  .console {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: row-reverse;

    .navigator {
      height: 100%;
      width: 60px;
      border-right: 1px solid var(--el-border-color);
    }

    .main {
      height: 100%;
      width: calc(100% - 60px);
      flex: 1;
      display: flex;
      flex-direction: row;
      .side {
        width: 200px;
        height: 100%;
      }
      .panel {
        width: calc(100% - 200px);
        height: 100%;
        padding: 30px;
        background-color: var(--el-bg-color-page);
      }
    }
  }
}

@media screen and (max-width: 767px) {
  .console {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    .navigator {
      width: 100%;
      height: 60px;
      position: fixed;
      bottom: 0;
      z-index: 10000;
    }
    .main {
      height: calc(100% - 60px);
      width: 100%;
      flex: 1;
      display: flex;
      flex-direction: column;
      .panel {
        width: 100%;
        padding: 30px;
        background-color: var(--el-bg-color-page);
        padding-bottom: 80px;
      }
      .side {
        width: 100%;
        height: fit-content;
        padding: 20px 0 20px 10px;
      }
    }
  }
}
</style>

<style lang="scss">
.console {
  .panel {
    .title {
      font-size: 26px;
      font-weight: bold;
      margin-bottom: 20px;
      color: var(--el-text-color-primary);
    }

    .el-table {
      max-height: calc(100vh - 250px);
      margin-bottom: 50px;
      overflow-y: scroll;
    }
  }

  .pagination {
    margin: auto;
    width: fit-content;
  }
}
</style>
