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
    this.restoreFromUrl();
    this.handleNotificationDeepLink();
    this.cleanUrl();
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
    // Entry deep link (shared link / tapped notification) may name a conversation
    // in `/coding-bridge?session=&node=&provider=`. Seed the node + history pointer
    // from it; the socket's onOpen → getHistory → history.snapshot handler then
    // reattaches it. The open conversation is NOT pinned back into the URL — it
    // lives in the (persisted) store, so a plain refresh restores it without the
    // param (see `cleanUrl`).
    restoreFromUrl() {
      const q = this.$route.query;
      const sessionId = typeof q.session === 'string' ? q.session : '';
      const nodeId = typeof q.node === 'string' ? q.node : '';
      if (!sessionId || !nodeId) {
        return;
      }
      const provider = q.provider === 'codex' || q.provider === 'copilot' ? q.provider : 'claude';
      this.$store.commit('codingBridge/setCurrentNode', nodeId);
      this.$store.commit('codingBridge/setHistoryRef', { node_id: nodeId, provider, session_id: sessionId });
      this.$store.dispatch('codingBridge/getHistory', nodeId);
      this.$store.dispatch('codingBridge/requestSessions', nodeId);
    },
    // Keep the address bar a clean `/coding-bridge`: once any entry deep-link
    // params have been consumed above, strip them so the open conversation is
    // never pinned to the URL. `replace` (not push) avoids a history entry.
    cleanUrl() {
      const q = this.$route.query;
      const keys = ['session', 'node', 'provider', 'request', 'code'];
      if (!keys.some((k) => k in q)) {
        return;
      }
      const query: Record<string, any> = { ...q };
      keys.forEach((k) => delete query[k]);
      this.$router.replace({ query }).catch(() => {});
    },
    // A tapped notification opens `/coding-bridge?node=&session=&request=`. When a
    // session is present `restoreFromUrl` already selected the node (selecting
    // again would jump to the node's last session); just re-fetch its prompts.
    handleNotificationDeepLink() {
      const nodeId = this.$route.query.node;
      if (typeof nodeId === 'string' && nodeId) {
        if (!this.$route.query.session) {
          this.$store.dispatch('codingBridge/selectNode', nodeId);
        }
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
