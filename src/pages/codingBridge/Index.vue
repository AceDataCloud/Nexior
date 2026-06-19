<template>
  <div class="coding-bridge flex flex-row h-full relative">
    <node-list class="sidebar w-[300px] flex-none" @pair="openPair" />
    <!-- `@devices` opens the device drawer on mobile; the trigger lives in the
         SessionView header (left) instead of a button floating over content. -->
    <session-view class="flex-1 min-w-0" @history="historyVisible = true" @devices="drawer = true" />

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
import { ElDrawer } from 'element-plus';
import NodeList from '@/components/codingBridge/NodeList.vue';
import SessionView from '@/components/codingBridge/SessionView.vue';
import PairDialog from '@/components/codingBridge/PairDialog.vue';
import PermissionDialog from '@/components/codingBridge/PermissionDialog.vue';
import HistoryDrawer from '@/components/codingBridge/HistoryDrawer.vue';

export default defineComponent({
  name: 'CodingBridgeIndex',
  components: {
    ElDrawer,
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
    this.handleNotificationDeepLink();
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
    },
    // A tapped notification opens `/coding-bridge?node=&session=&request=`.
    // Select that node and re-fetch its pending prompts so the consent dialog
    // surfaces immediately. The relay/socket may still be connecting, so we
    // select eagerly — selectNode + the socket onOpen both request the prompts.
    handleNotificationDeepLink() {
      const nodeId = this.$route.query.node;
      if (typeof nodeId === 'string' && nodeId) {
        this.$store.dispatch('codingBridge/selectNode', nodeId);
        this.$store.dispatch('codingBridge/requestPendingPermissions', nodeId);
      }
    }
  }
});
</script>

<style lang="scss" scoped>
@media (max-width: 767px) {
  .sidebar {
    display: none;
  }
}
</style>
