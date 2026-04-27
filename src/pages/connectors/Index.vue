<template>
  <div class="connectors-page">
    <!-- Left rail -->
    <aside class="rail">
      <div class="rail-header">
        <span class="title">{{ $t('connector.title') }}</span>
        <div class="rail-header-actions">
          <el-input
            v-model="search"
            size="small"
            :placeholder="$t('connector.search.placeholder')"
            class="search-input"
            clearable
          >
            <template #prefix>
              <font-awesome-icon icon="fa-solid fa-magnifying-glass" />
            </template>
          </el-input>
          <el-dropdown trigger="click" @command="onAddCommand">
            <el-button text class="add-btn" :title="$t('connector.menu.browse')">
              <font-awesome-icon icon="fa-solid fa-plus" />
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="browse">
                  <font-awesome-icon icon="fa-solid fa-book" class="mr-2" />
                  {{ $t('connector.menu.browse') }}
                </el-dropdown-item>
                <el-dropdown-item command="custom">
                  <font-awesome-icon icon="fa-solid fa-ellipsis" class="mr-2" />
                  {{ $t('connector.menu.custom') }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <div v-loading="loading" class="rail-body">
        <div v-if="loadError" class="empty-hint">{{ $t('connector.common.loadError') }}</div>

        <!-- Web group: built-in providers + connected custom MCP -->
        <div v-if="webGroupItems.length" class="group">
          <div class="group-title">{{ $t('connector.group.web') }}</div>
          <connector-list-item
            v-for="item in webGroupItems"
            :key="item.id"
            :item="item"
            :selected="selectedId === item.id"
            @click="selectedId = item.id"
          />
        </div>

        <!-- Not connected providers (built-in catalog) -->
        <div v-if="notConnectedItems.length" class="group">
          <div class="group-title">{{ $t('connector.group.notConnected') }}</div>
          <connector-list-item
            v-for="item in notConnectedItems"
            :key="item.id"
            :item="item"
            :selected="selectedId === item.id"
            @click="selectedId = item.id"
          />
        </div>
      </div>
    </aside>

    <!-- Right detail pane -->
    <section class="detail">
      <connector-detail v-if="selectedItem" :item="selectedItem" :token="token" @change="loadAll" />
      <div v-else class="empty">
        <font-awesome-icon icon="fa-solid fa-plug" class="empty-icon" />
        <p>{{ $t('connector.detail.empty') }}</p>
      </div>
    </section>

    <add-custom-connector-dialog v-model="customDialogVisible" :token="token" @created="onCustomCreated" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElInput, ElButton, ElDropdown, ElDropdownMenu, ElDropdownItem } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { connectorOperator, mcpServerOperator } from '@/operators';
import { IConnectorProvider, IConnector, IMcpServer } from '@/models';
import { ROUTE_CONNECTORS_BROWSE } from '@/router/constants';
import ConnectorListItem from '@/components/connectors/ConnectorListItem.vue';
import ConnectorDetail from '@/components/connectors/ConnectorDetail.vue';
import AddCustomConnectorDialog from '@/components/connectors/AddCustomConnectorDialog.vue';
import { IConnectorItem, PROVIDER_ICONS } from '@/components/connectors/types';

export default defineComponent({
  name: 'ConnectorsIndex',
  components: {
    ElInput,
    ElButton,
    ElDropdown,
    ElDropdownMenu,
    ElDropdownItem,
    FontAwesomeIcon,
    ConnectorListItem,
    ConnectorDetail,
    AddCustomConnectorDialog
  },
  data() {
    return {
      providers: [] as IConnectorProvider[],
      connectors: [] as IConnector[],
      mcpServers: [] as IMcpServer[],
      loading: false,
      loadError: false,
      search: '',
      selectedId: '' as string,
      customDialogVisible: false
    };
  },
  computed: {
    token(): string {
      return this.$store.state.chat?.credential?.token ?? '';
    },
    items(): IConnectorItem[] {
      const result: IConnectorItem[] = [];
      // Built-in providers (Web group)
      for (const provider of this.providers) {
        const connector = this.connectors.find((c) => c.provider === provider.id);
        result.push({
          id: `provider:${provider.id}`,
          kind: 'provider',
          name: provider.name,
          description: provider.description,
          icon: PROVIDER_ICONS[provider.id] || 'fa-solid fa-plug',
          isCustom: false,
          connected: !!connector || provider.connected,
          provider,
          connector
        });
      }
      // Custom MCP servers (Custom group, listed under Web)
      for (const mcp of this.mcpServers) {
        result.push({
          id: `mcp:${mcp.id}`,
          kind: 'custom',
          name: mcp.name,
          description: mcp.description,
          icon: 'fa-solid fa-cube',
          isCustom: true,
          connected: true,
          mcp
        });
      }
      // Search filter
      const q = this.search.trim().toLowerCase();
      if (!q) return result;
      return result.filter(
        (it) => it.name.toLowerCase().includes(q) || (it.description?.toLowerCase().includes(q) ?? false)
      );
    },
    webGroupItems(): IConnectorItem[] {
      return this.items.filter((it) => it.connected);
    },
    notConnectedItems(): IConnectorItem[] {
      return this.items.filter((it) => !it.connected);
    },
    selectedItem(): IConnectorItem | undefined {
      return this.items.find((it) => it.id === this.selectedId);
    }
  },
  watch: {
    token: {
      immediate: true,
      handler(val: string) {
        if (val) {
          this.loadAll();
        }
      }
    }
  },
  methods: {
    async loadAll() {
      if (!this.token) return;
      this.loading = true;
      this.loadError = false;
      try {
        const [providersRes, connectorsRes, mcpRes] = await Promise.allSettled([
          connectorOperator.listProviders(this.token),
          connectorOperator.list(this.token),
          mcpServerOperator.list(this.token)
        ]);
        if (providersRes.status === 'fulfilled') {
          this.providers = providersRes.value.data.providers || [];
        }
        if (connectorsRes.status === 'fulfilled') {
          this.connectors = connectorsRes.value.data.items || [];
        }
        if (mcpRes.status === 'fulfilled') {
          this.mcpServers = mcpRes.value.data.items || [];
        }
        if (providersRes.status === 'rejected' && connectorsRes.status === 'rejected' && mcpRes.status === 'rejected') {
          this.loadError = true;
        }
        // Auto-select first item if nothing selected
        if (!this.selectedId && this.items.length) {
          this.selectedId = this.items[0].id;
        }
      } finally {
        this.loading = false;
      }
    },
    onAddCommand(cmd: string) {
      if (cmd === 'browse') {
        this.$router.push({ name: ROUTE_CONNECTORS_BROWSE });
      } else if (cmd === 'custom') {
        this.customDialogVisible = true;
      }
    },
    onCustomCreated(server: IMcpServer) {
      // Refresh and select the newly created connector
      this.loadAll().then(() => {
        if (server?.id) {
          this.selectedId = `mcp:${server.id}`;
        }
      });
    }
  }
});
</script>

<style scoped lang="scss">
.connectors-page {
  display: flex;
  width: 100%;
  height: 100%;
  background: var(--el-bg-color-page);
  overflow: hidden;
}

.rail {
  width: 280px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}

.rail-header {
  padding: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  display: flex;
  flex-direction: column;
  gap: 10px;

  .title {
    font-size: 16px;
    font-weight: 600;
  }

  .rail-header-actions {
    display: flex;
    align-items: center;
    gap: 8px;

    .search-input {
      flex: 1;
    }

    .add-btn {
      flex-shrink: 0;
      padding: 6px 8px;
      border: 1px solid var(--el-border-color);
      border-radius: 6px;
    }
  }
}

.rail-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.group {
  margin-bottom: 16px;

  .group-title {
    padding: 6px 16px;
    font-size: 11px;
    font-weight: 600;
    color: var(--el-text-color-secondary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
}

.empty-hint {
  padding: 24px 16px;
  text-align: center;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.detail {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--el-text-color-secondary);
  gap: 12px;

  .empty-icon {
    font-size: 36px;
    opacity: 0.4;
  }
}

@media screen and (max-width: 767px) {
  .connectors-page {
    flex-direction: column;
  }
  .rail {
    width: 100%;
    height: auto;
    max-height: 50vh;
    border-right: none;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }
}
</style>
