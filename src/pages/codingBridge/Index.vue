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
      initialCode: '',
      // A `?session=` is in the URL but its transcript hasn't been reattached
      // yet; while true the URL writer must not strip the param it's restoring.
      restorePending: false
    };
  },
  computed: {
    currentSessionId(): string | undefined {
      return this.$store.state.codingBridge?.currentSessionId;
    },
    currentNodeId(): string | undefined {
      return this.$store.state.codingBridge?.currentNodeId;
    },
    currentProvider(): string | undefined {
      const id = this.currentSessionId;
      const fromSession = id ? this.$store.state.codingBridge?.sessions?.[id]?.provider : undefined;
      return fromSession || this.$store.state.codingBridge?.historyRef?.provider;
    },
    // One key so a single watcher reacts to any part of the open conversation.
    sessionUrlKey(): string {
      return `${this.currentNodeId || ''}|${this.currentSessionId || ''}|${this.currentProvider || ''}`;
    }
  },
  watch: {
    sessionUrlKey() {
      this.syncUrl();
    }
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
    // Open the exact conversation named in `/coding-bridge?session=&node=&provider=`.
    // We set the node + history pointer (not currentSession) and let the socket's
    // onOpen → getHistory → history.snapshot handler reattach it (its guard needs
    // currentSessionId empty). reattach then sets currentSession → syncUrl runs.
    restoreFromUrl() {
      const q = this.$route.query;
      const sessionId = typeof q.session === 'string' ? q.session : '';
      const nodeId = typeof q.node === 'string' ? q.node : '';
      if (!sessionId || !nodeId) {
        return;
      }
      const provider = q.provider === 'codex' ? 'codex' : 'claude';
      this.restorePending = true;
      this.$store.commit('codingBridge/setCurrentNode', nodeId);
      this.$store.commit('codingBridge/setHistoryRef', { node_id: nodeId, provider, session_id: sessionId });
      this.$store.dispatch('codingBridge/getHistory', nodeId);
      this.$store.dispatch('codingBridge/requestSessions', nodeId);
      // Don't pin the param forever if the session can't be restored (deleted/offline).
      setTimeout(() => (this.restorePending = false), 15000);
    },
    // Mirror the open conversation into the URL so it's shareable and survives a
    // reload / back button. `replace` (not push) avoids cluttering history.
    syncUrl() {
      const sessionId = this.currentSessionId;
      const nodeId = this.currentNodeId;
      if (sessionId) {
        this.restorePending = false;
      }
      const query: Record<string, any> = { ...this.$route.query };
      if (sessionId) {
        query.session = sessionId;
        if (nodeId) {
          query.node = nodeId;
        }
        if (this.currentProvider) {
          query.provider = this.currentProvider;
        }
      } else if (this.restorePending) {
        return; // a cold restore is still resolving; keep the URL it's restoring
      } else {
        delete query.session;
        delete query.provider;
      }
      const r = this.$route.query;
      if (query.session === r.session && query.node === r.node && query.provider === r.provider) {
        return;
      }
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
