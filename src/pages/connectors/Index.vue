<template>
  <div class="connectors-page">
    <!-- Left rail -->
    <aside class="rail">
      <div class="rail-header">
        <span class="title">{{ $t('connector.title') }}</span>
        <div class="rail-header-actions">
          <el-input v-model="search" :placeholder="$t('connector.search.placeholder')" class="search-input" clearable>
            <template #prefix>
              <font-awesome-icon icon="fa-solid fa-magnifying-glass" />
            </template>
          </el-input>
          <el-dropdown trigger="click" @command="onAddCommand">
            <el-button class="add-btn">
              <font-awesome-icon icon="fa-solid fa-plus" />
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="browse">
                  <font-awesome-icon icon="fa-solid fa-book" class="mr-2" />
                  {{ $t('connector.menu.browse') }}
                </el-dropdown-item>
                <el-dropdown-item command="custom">
                  <font-awesome-icon icon="fa-solid fa-cube" class="mr-2" />
                  {{ $t('connector.menu.custom') }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <div v-loading="loading" class="rail-body">
        <div v-if="loadError" class="empty-hint">{{ $t('connector.common.loadError') }}</div>

        <!-- Connected: OAuth providers + built-in MCPs + custom MCPs -->
        <div v-if="builtinGroupItems.length" class="group">
          <div class="group-title">{{ $t('connector.group.builtin') }}</div>
          <connector-list-item
            v-for="item in builtinGroupItems"
            :key="item.id"
            :item="item"
            :selected="selectedId === item.id"
            @click="selectedId = item.id"
          />
        </div>

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

        <div v-if="customGroupItems.length" class="group">
          <div class="group-title">{{ $t('connector.group.custom') }}</div>
          <connector-list-item
            v-for="item in customGroupItems"
            :key="item.id"
            :item="item"
            :selected="selectedId === item.id"
            @click="selectedId = item.id"
          />
        </div>

        <!-- Not connected providers -->
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

        <!-- Empty state -->
        <div v-if="!loading && !loadError && items.length === 0" class="rail-empty">
          <font-awesome-icon icon="fa-solid fa-plug" class="rail-empty-icon" />
          <p class="rail-empty-title">{{ $t('connector.empty.title') }}</p>
          <p class="rail-empty-desc">{{ $t('connector.empty.desc') }}</p>
          <el-button type="primary" @click="onAddCommand('browse')">
            <font-awesome-icon icon="fa-solid fa-book" class="mr-1" />
            {{ $t('connector.menu.browse') }}
          </el-button>
        </div>
      </div>
    </aside>

    <!-- Right detail pane -->
    <section class="detail-pane">
      <connector-detail v-if="selectedItem" :item="selectedItem" :token="token" @change="loadAll" />
      <div v-else-if="!loading" class="detail-empty">
        <font-awesome-icon icon="fa-solid fa-plug" class="empty-icon" />
        <p class="empty-title">{{ $t('connector.detail.empty.title') }}</p>
        <p class="empty-desc">{{ $t('connector.detail.empty.desc') }}</p>
        <div class="empty-actions">
          <el-button type="primary" @click="onAddCommand('browse')">
            <font-awesome-icon icon="fa-solid fa-book" class="mr-1" />
            {{ $t('connector.menu.browse') }}
          </el-button>
          <el-button @click="onAddCommand('custom')">
            <font-awesome-icon icon="fa-solid fa-cube" class="mr-1" />
            {{ $t('connector.menu.custom') }}
          </el-button>
        </div>
      </div>
    </section>

    <!-- Reuse the existing chat MCP manager dialog for custom connector CRUD -->
    <mcp-manager v-model="customDialogVisible" @change="loadAll" />
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
import McpManager from '@/components/chat/McpManager.vue';
import { IConnectorItem, PROVIDER_ICONS, resolveBuiltinIcon } from '@/components/connectors/types';

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
    McpManager
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
      // OAuth providers — show only those the backend has configured. The full
      // catalog (including unavailable providers) lives at /connectors/browse.
      for (const provider of this.providers) {
        if (provider.available === false && !provider.connected) continue;
        const connector = this.connectors.find((c) => c.provider === provider.id);
        result.push({
          id: `provider:${provider.id}`,
          kind: 'provider',
          name: provider.name,
          description: provider.description,
          icon: PROVIDER_ICONS[provider.id] || 'fa-solid fa-plug',
          isCustom: false,
          isBuiltin: false,
          connected: !!connector || provider.connected,
          provider,
          connector
        });
      }
      // User's MCP servers (custom + installed builtins). Built-ins carry
      // metadata.builtin_id and metadata.icon (set by the backend on install).
      for (const mcp of this.mcpServers) {
        const builtinId = mcp.metadata?.builtin_id;
        const isBuiltin = !!builtinId;
        result.push({
          id: `mcp:${mcp.id}`,
          kind: 'custom',
          name: mcp.name,
          description: mcp.description,
          icon: isBuiltin ? resolveBuiltinIcon(mcp.metadata?.icon) : 'fa-solid fa-cube',
          isCustom: !isBuiltin,
          isBuiltin,
          connected: true,
          mcp
        });
      }
      const q = this.search.trim().toLowerCase();
      if (!q) return result;
      return result.filter(
        (it) => it.name.toLowerCase().includes(q) || (it.description?.toLowerCase().includes(q) ?? false)
      );
    },
    webGroupItems(): IConnectorItem[] {
      // OAuth providers that are already connected.
      return this.items.filter((it) => it.connected && it.kind === 'provider');
    },
    builtinGroupItems(): IConnectorItem[] {
      return this.items.filter((it) => it.connected && it.isBuiltin);
    },
    customGroupItems(): IConnectorItem[] {
      return this.items.filter((it) => it.connected && it.isCustom);
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
  width: 320px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}

.rail-header {
  padding: 20px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  display: flex;
  flex-direction: column;
  gap: 12px;

  .title {
    font-size: 18px;
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
    padding: 8px 16px;
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

.rail-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 48px 24px;
  gap: 8px;

  .rail-empty-icon {
    font-size: 32px;
    color: var(--el-text-color-secondary);
    opacity: 0.5;
    margin-bottom: 8px;
  }

  .rail-empty-title {
    font-size: 14px;
    font-weight: 600;
    margin: 0;
  }

  .rail-empty-desc {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin: 0 0 8px 0;
  }
}

.detail-pane {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
}

.detail-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 48px 32px;
  color: var(--el-text-color-secondary);
  text-align: center;

  .empty-icon {
    font-size: 48px;
    opacity: 0.3;
    margin-bottom: 16px;
  }

  .empty-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin: 0 0 8px 0;
  }

  .empty-desc {
    font-size: 14px;
    margin: 0 0 24px 0;
    max-width: 360px;
  }

  .empty-actions {
    display: flex;
    gap: 12px;
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
