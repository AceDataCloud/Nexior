<template>
  <div class="browse">
    <header class="header">
      <el-button text class="back-btn" @click="goBack">
        <font-awesome-icon icon="fa-solid fa-arrow-left" class="mr-2" />
        {{ $t('connector.common.back') }}
      </el-button>
      <div class="title-block">
        <div class="title">{{ $t('connector.browse.title') }}</div>
        <div class="subtitle">{{ $t('connector.browse.subtitle') }}</div>
      </div>
      <el-input v-model="search" :placeholder="$t('connector.browse.searchPlaceholder')" clearable class="search">
        <template #prefix>
          <font-awesome-icon icon="fa-solid fa-magnifying-glass" />
        </template>
      </el-input>
    </header>

    <div v-loading="loading" class="body">
      <!-- Built-in MCP servers -->
      <section v-if="filteredBuiltins.length || (!loading && builtins.length === 0)" class="catalog-section">
        <div class="section-header">
          <h2 class="section-title">{{ $t('connector.browse.builtinTitle') }}</h2>
          <p class="section-desc">{{ $t('connector.browse.builtinDesc') }}</p>
        </div>
        <div v-if="filteredBuiltins.length" class="grid">
          <div v-for="b in filteredBuiltins" :key="`b:${b.id}`" class="card">
            <div class="card-icon">
              <font-awesome-icon :icon="getBuiltinIcon(b.icon)" />
            </div>
            <div class="card-info">
              <div class="card-name">
                {{ b.name }}
                <el-tag size="small" type="success" effect="plain" class="builtin-tag">
                  {{ $t('connector.badge.builtin') }}
                </el-tag>
              </div>
              <div v-if="b.description" class="card-desc">{{ b.description }}</div>
            </div>
            <el-button
              :disabled="b.installed"
              :type="b.installed ? 'default' : 'primary'"
              :loading="installingId === b.id"
              class="card-action"
              @click="onInstallBuiltin(b)"
            >
              <font-awesome-icon :icon="b.installed ? 'fa-solid fa-check' : 'fa-solid fa-plus'" class="mr-1" />
              {{ b.installed ? $t('connector.browse.installed') : $t('connector.browse.install') }}
            </el-button>
          </div>
        </div>
        <div v-else class="empty">{{ $t('connector.browse.empty') }}</div>
      </section>

      <!-- OAuth Providers -->
      <section v-if="filteredProviders.length || (!loading && providers.length === 0)" class="catalog-section">
        <div class="section-header">
          <h2 class="section-title">{{ $t('connector.browse.providersTitle') }}</h2>
          <p class="section-desc">{{ $t('connector.browse.providersDesc') }}</p>
        </div>
        <div v-if="filteredProviders.length" class="grid">
          <div
            v-for="provider in filteredProviders"
            :key="`p:${provider.id}`"
            class="card"
            :class="{ disabled: provider.available === false }"
          >
            <div class="card-icon">
              <font-awesome-icon :icon="getProviderIcon(provider.id)" />
            </div>
            <div class="card-info">
              <div class="card-name">
                {{ provider.name }}
                <el-tag v-if="provider.available === false" size="small" type="info" effect="plain" class="builtin-tag">
                  {{ $t('connector.badge.comingSoon') }}
                </el-tag>
              </div>
              <div v-if="provider.description" class="card-desc">{{ provider.description }}</div>
            </div>
            <el-button
              :disabled="provider.connected || provider.available === false"
              :type="provider.connected ? 'default' : 'primary'"
              class="card-action"
              @click="onConnectProvider(provider)"
            >
              <font-awesome-icon :icon="provider.connected ? 'fa-solid fa-check' : 'fa-solid fa-plug'" class="mr-1" />
              {{
                provider.connected
                  ? $t('connector.browse.installed')
                  : provider.available === false
                    ? $t('connector.badge.comingSoon')
                    : $t('connector.detail.connect')
              }}
            </el-button>
          </div>
        </div>
      </section>

      <!-- Custom MCP -->
      <section class="catalog-section">
        <div class="section-header">
          <h2 class="section-title">{{ $t('connector.browse.customTitle') }}</h2>
          <p class="section-desc">{{ $t('connector.browse.customDesc') }}</p>
        </div>
        <div class="custom-cta">
          <el-button type="primary" @click="customDialogVisible = true">
            <font-awesome-icon icon="fa-solid fa-cube" class="mr-1" />
            {{ $t('connector.menu.custom') }}
          </el-button>
        </div>
      </section>
    </div>

    <mcp-manager v-model="customDialogVisible" @change="loadAll" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElInput, ElButton, ElTag, ElMessage } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { connectorOperator, mcpServerOperator } from '@/operators';
import { IConnectorProvider, IBuiltinMcpServer } from '@/models';
import { ROUTE_CONNECTORS_INDEX } from '@/router/constants';
import { PROVIDER_ICONS } from '@/components/connectors/types';
import McpManager from '@/components/chat/McpManager.vue';

const BUILTIN_ICON_MAP: Record<string, string> = {
  search: 'fa-solid fa-magnifying-glass',
  link: 'fa-solid fa-link',
  music: 'fa-solid fa-music',
  image: 'fa-solid fa-image',
  video: 'fa-solid fa-video'
};

export default defineComponent({
  name: 'ConnectorsBrowse',
  components: { ElInput, ElButton, ElTag, FontAwesomeIcon, McpManager },
  data() {
    return {
      providers: [] as IConnectorProvider[],
      builtins: [] as IBuiltinMcpServer[],
      loading: false,
      search: '',
      installingId: '' as string,
      customDialogVisible: false
    };
  },
  computed: {
    token(): string {
      return this.$store.state.chat?.credential?.token ?? '';
    },
    q(): string {
      return this.search.trim().toLowerCase();
    },
    filteredProviders(): IConnectorProvider[] {
      if (!this.q) return this.providers;
      return this.providers.filter(
        (p) => p.name.toLowerCase().includes(this.q) || p.description?.toLowerCase().includes(this.q)
      );
    },
    filteredBuiltins(): IBuiltinMcpServer[] {
      if (!this.q) return this.builtins;
      return this.builtins.filter(
        (b) => b.name.toLowerCase().includes(this.q) || b.description?.toLowerCase().includes(this.q)
      );
    }
  },
  watch: {
    token: {
      immediate: true,
      handler(val: string) {
        if (val) this.loadAll();
      }
    }
  },
  methods: {
    getProviderIcon(id: string): string {
      return PROVIDER_ICONS[id] || 'fa-solid fa-plug';
    },
    getBuiltinIcon(key: string): string {
      return BUILTIN_ICON_MAP[key] || 'fa-solid fa-cube';
    },
    async loadAll() {
      if (!this.token) return;
      this.loading = true;
      try {
        const [providersRes, builtinsRes] = await Promise.allSettled([
          connectorOperator.listProviders(this.token),
          mcpServerOperator.listBuiltin(this.token)
        ]);
        if (providersRes.status === 'fulfilled') {
          this.providers = providersRes.value.data.providers || [];
        }
        if (builtinsRes.status === 'fulfilled') {
          this.builtins = builtinsRes.value.data.items || [];
        }
      } finally {
        this.loading = false;
      }
    },
    goBack() {
      this.$router.push({ name: ROUTE_CONNECTORS_INDEX });
    },
    async onConnectProvider(provider: IConnectorProvider) {
      if (provider.connected || provider.available === false || !this.token) return;
      try {
        const { data } = await connectorOperator.authorize(provider.id, this.token);
        const popup = window.open(data.authorization_url, 'oauth-popup', 'width=600,height=700,scrollbars=yes');
        const handler = async (event: MessageEvent) => {
          if (event.data?.type !== 'oauth-callback') return;
          window.removeEventListener('message', handler);
          const { code, state } = event.data;
          if (!code || !state) {
            ElMessage.error(this.$t('connector.common.authFailed'));
            return;
          }
          try {
            await connectorOperator.exchange(code, state, this.token);
            ElMessage.success(this.$t('connector.detail.connected'));
            await this.loadAll();
          } catch {
            ElMessage.error(this.$t('connector.common.authFailed'));
          }
        };
        window.addEventListener('message', handler);
        const pollTimer = setInterval(() => {
          if (popup?.closed) clearInterval(pollTimer);
        }, 500);
      } catch {
        ElMessage.error(this.$t('connector.common.authFailed'));
      }
    },
    async onInstallBuiltin(b: IBuiltinMcpServer) {
      if (b.installed || !this.token) return;
      this.installingId = b.id;
      try {
        await mcpServerOperator.installBuiltin(b.id, this.token);
        ElMessage.success(this.$t('connector.browse.installSuccess', { name: b.name }));
        await this.loadAll();
      } catch {
        ElMessage.error(this.$t('connector.browse.installFailed'));
      } finally {
        this.installingId = '';
      }
    }
  }
});
</script>

<style scoped lang="scss">
.browse {
  padding: 24px 32px;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color-page);
  overflow-y: auto;
}

.header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;

  .back-btn {
    flex-shrink: 0;
  }

  .title-block {
    flex: 1;
    .title {
      font-size: 22px;
      font-weight: 600;
    }
    .subtitle {
      margin-top: 4px;
      font-size: 13px;
      color: var(--el-text-color-secondary);
    }
  }

  .search {
    width: 320px;
    flex-shrink: 0;
  }
}

.body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.catalog-section {
  .section-header {
    margin-bottom: 16px;
    .section-title {
      font-size: 16px;
      font-weight: 600;
      margin: 0;
    }
    .section-desc {
      margin-top: 4px;
      margin-bottom: 0;
      font-size: 13px;
      color: var(--el-text-color-secondary);
    }
  }
}

.empty {
  text-align: center;
  color: var(--el-text-color-secondary);
  padding: 32px 0;
  font-size: 13px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 12px;
}

.card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background: var(--el-bg-color);
  transition: border-color 0.15s;

  &:hover {
    border-color: var(--el-border-color);
  }

  &.disabled {
    opacity: 0.6;
  }

  .card-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    border-radius: 8px;
    background: var(--el-fill-color);
    flex-shrink: 0;
  }

  .card-info {
    flex: 1;
    min-width: 0;
    .card-name {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      font-weight: 600;

      .builtin-tag {
        font-weight: 400;
      }
    }
    .card-desc {
      margin-top: 4px;
      font-size: 12px;
      color: var(--el-text-color-secondary);
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      line-clamp: 2;
      -webkit-box-orient: vertical;
    }
  }

  .card-action {
    flex-shrink: 0;
  }
}

.custom-cta {
  display: flex;
  justify-content: flex-start;
  padding: 16px 0;
}
</style>
