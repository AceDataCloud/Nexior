<template>
  <!-- Compact strip of the user's enabled (ACTIVE-connection) connector icons.
       Self-contained + placement-agnostic — the parent decides where it sits.
       Display-first: clicking any chip (or the +N overflow) opens the
       connections manager. Renders nothing when there are no active
       connections or the user is logged out. -->
  <div v-if="visibleConnectors.length > 0" class="connector-strip">
    <el-tooltip v-for="c in visibleConnectors" :key="c.id" effect="dark" :content="c.name" placement="top">
      <span class="connector-chip" role="button" @click="onOpen">
        <img class="connector-icon" :src="c.icon_url" :alt="c.name" loading="lazy" />
      </span>
    </el-tooltip>
    <el-tooltip v-if="overflowCount > 0" effect="dark" :content="$t('chat.composer.connections')" placement="top">
      <span class="connector-chip connector-more" role="button" @click="onOpen"> +{{ overflowCount }} </span>
    </el-tooltip>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElTooltip } from 'element-plus';
import { listEnabledConnectors, type IEnabledConnector } from './connectorCatalogCache';
import { openConnectionsManager } from '@/utils';

// Show at most this many connector chips; beyond it the last slot becomes a
// "+N" overflow chip so the row never exceeds MAX_CONNECTORS items.
const MAX_CONNECTORS = 5;

export default defineComponent({
  name: 'ConnectorStrip',
  components: {
    ElTooltip
  },
  data() {
    return {
      enabledConnectors: [] as IEnabledConnector[],
      // Monotonic load id — only the most recent loadConnectors() may write
      // state, so an older same-user fetch resolving after a newer force
      // refresh can't overwrite it with stale icons.
      loadSeq: 0
    };
  },
  computed: {
    visibleConnectors(): IEnabledConnector[] {
      if (this.enabledConnectors.length <= MAX_CONNECTORS) {
        return this.enabledConnectors;
      }
      return this.enabledConnectors.slice(0, MAX_CONNECTORS - 1);
    },
    overflowCount(): number {
      if (this.enabledConnectors.length <= MAX_CONNECTORS) {
        return 0;
      }
      return this.enabledConnectors.length - (MAX_CONNECTORS - 1);
    },
    userId(): string | null {
      return this.$store.getters.user?.id ?? null;
    }
  },
  watch: {
    // Login / logout / account switch — clear immediately so one account's
    // icons never linger for the next user, then reload.
    userId() {
      this.enabledConnectors = [];
      void this.loadConnectors(true);
    }
  },
  mounted() {
    void this.loadConnectors();
    // The user manages connections in another tab (auth.acedata.cloud);
    // refetch when they return so connects/disconnects reflect without a
    // full reload.
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  },
  beforeUnmount() {
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
  },
  methods: {
    async loadConnectors(force = false) {
      // listEnabledConnectors() never throws (returns [] on error / when
      // logged out) so the strip just stays hidden rather than breaking.
      const requestedUserId = this.userId;
      const seq = ++this.loadSeq;
      const list = await listEnabledConnectors(requestedUserId, force);
      // Drop a stale resolution: a newer load has since started (e.g. a force
      // refresh) or the user switched / logged out while this was in flight.
      if (seq === this.loadSeq && this.userId === requestedUserId) {
        this.enabledConnectors = list;
      }
    },
    onVisibilityChange() {
      if (document.visibilityState === 'visible') {
        void this.loadConnectors(true);
      }
    },
    onOpen() {
      openConnectionsManager();
    }
  }
});
</script>

<style lang="scss" scoped>
.connector-strip {
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  gap: 5px;
  .connector-chip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    overflow: hidden;
    cursor: pointer;
    background-color: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color-lighter);
    transition:
      transform 0.12s ease,
      box-shadow 0.12s ease;
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.14);
    }
    .connector-icon {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    &.connector-more {
      font-size: 9px;
      font-weight: 600;
      letter-spacing: -0.3px;
      color: var(--el-text-color-secondary);
      background-color: var(--el-fill-color);
    }
  }
}
</style>
