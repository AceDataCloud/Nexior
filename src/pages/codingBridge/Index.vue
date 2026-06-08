<template>
  <div class="coding-bridge flex flex-row h-full relative">
    <node-list class="sidebar w-[300px] flex-none" @pair="openPair" />
    <session-view class="flex-1 min-w-0" @history="historyVisible = true" />

    <el-button circle class="menu" @click="drawer = true">
      <font-awesome-icon icon="fa-solid fa-laptop-code" />
    </el-button>
    <el-drawer v-model="drawer" direction="ltr" :with-header="false" size="300px" class="drawer">
      <node-list @pair="openPairFromDrawer" />
    </el-drawer>

    <pair-dialog v-model:visible="pairVisible" :initial-code="initialCode" />
    <permission-dialog />
    <history-drawer v-model:visible="historyVisible" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton, ElDrawer } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import NodeList from '@/components/codingBridge/NodeList.vue';
import SessionView from '@/components/codingBridge/SessionView.vue';
import PairDialog from '@/components/codingBridge/PairDialog.vue';
import PermissionDialog from '@/components/codingBridge/PermissionDialog.vue';
import HistoryDrawer from '@/components/codingBridge/HistoryDrawer.vue';

export default defineComponent({
  name: 'CodingBridgeIndex',
  components: {
    ElButton,
    ElDrawer,
    FontAwesomeIcon,
    NodeList,
    SessionView,
    PairDialog,
    PermissionDialog,
    HistoryDrawer
  },
  data() {
    return {
      drawer: false,
      pairVisible: false,
      historyVisible: false,
      initialCode: ''
    };
  },
  mounted() {
    this.$store.dispatch('codingBridge/connect');
    this.$store.dispatch('codingBridge/getNodes');
    const code = this.$route.query.code;
    if (typeof code === 'string' && code) {
      this.initialCode = code;
      this.pairVisible = true;
    }
  },
  beforeUnmount() {
    this.$store.dispatch('codingBridge/disconnect');
  },
  methods: {
    openPair() {
      this.initialCode = '';
      this.pairVisible = true;
    },
    openPairFromDrawer() {
      this.drawer = false;
      this.openPair();
    }
  }
});
</script>

<style lang="scss" scoped>
.menu {
  display: none;
}

@media (max-width: 767px) {
  .sidebar {
    display: none;
  }
  .menu {
    display: block;
    position: absolute;
    left: 8px;
    top: calc(45px + var(--app-safe-area-top));
    z-index: 1000;
  }
}
</style>
