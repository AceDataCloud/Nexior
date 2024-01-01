<template>
  <div class="wrapper">
    <div class="left">
      <navigator />
    </div>
    <div class="main">
      <side-panel />
      <router-view />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Navigator from '@/components/common/Navigator.vue';
import SidePanel from '@/components/chat/SidePanel.vue';

export default defineComponent({
  name: 'LayoutChat',
  components: {
    SidePanel,
    Navigator
  },
  async mounted() {
    await this.onGetApplications();
    await this.onGetConversations();
  },
  methods: {
    async onGetApplications() {
      await this.$store.dispatch('chat/getApplications');
    },
    async onGetConversations() {
      await this.$store.dispatch('chat/getConversations');
    }
  }
});
</script>

<style lang="scss" scoped>
.wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: row;
  .left {
    width: 60px;
    height: 100%;
    // border-right: 1px solid var(--el-border-color);
  }
  .main {
    height: 100%;
    flex: 1;
    width: calc(100% - 60px);
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: row;
  }
}
</style>
