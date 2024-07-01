<template>
  <div class="wrapper">
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
.wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: row-reverse;

  .navigator {
    height: 100%;
    border-right: 1px solid var(--el-border-color);
  }

  .main {
    height: 100%;
    width: calc(100% - 60px);
    flex: 1;
    display: flex;
    flex-direction: row;
  }
}

@media screen and (max-width: 767px) {
  .wrapper {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    .navigator {
      width: 100%;
      height: 60px;
    }
    .main {
      height: calc(100% - 60px);
      width: 100%;
      flex: 1;
      .side {
        display: none;
      }
      .panel {
        width: 100%;
        height: 100%;
      }
    }
  }
}
</style>
