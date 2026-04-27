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
      <el-input
        v-model="search"
        :placeholder="$t('connector.browse.searchPlaceholder')"
        size="default"
        clearable
        class="search"
      >
        <template #prefix>
          <font-awesome-icon icon="fa-solid fa-magnifying-glass" />
        </template>
      </el-input>
    </header>

    <div v-loading="loading" class="grid-wrap">
      <div v-if="!loading && filtered.length === 0" class="empty">
        {{ $t('connector.browse.empty') }}
      </div>
      <div v-else class="grid">
        <div v-for="provider in filtered" :key="provider.id" class="card">
          <div class="card-icon">
            <font-awesome-icon :icon="getIcon(provider.id)" />
          </div>
          <div class="card-info">
            <div class="card-name">{{ provider.name }}</div>
            <div v-if="provider.description" class="card-desc">{{ provider.description }}</div>
          </div>
          <el-button
            size="small"
            :disabled="provider.connected"
            :type="provider.connected ? 'default' : 'primary'"
            text
            class="card-action"
            @click="onInstall(provider)"
          >
            <font-awesome-icon :icon="provider.connected ? 'fa-solid fa-check' : 'fa-solid fa-plus'" class="mr-1" />
            {{ provider.connected ? $t('connector.browse.installed') : $t('connector.browse.install') }}
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElInput, ElButton, ElMessage } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { connectorOperator } from '@/operators';
import { IConnectorProvider } from '@/models';
import { ROUTE_CONNECTORS_INDEX } from '@/router/constants';
import { PROVIDER_ICONS } from '@/components/connectors/types';

export default defineComponent({
  name: 'ConnectorsBrowse',
  components: { ElInput, ElButton, FontAwesomeIcon },
  data() {
    return {
      providers: [] as IConnectorProvider[],
      loading: false,
      search: ''
    };
  },
  computed: {
    token(): string {
      return this.$store.state.chat?.credential?.token ?? '';
    },
    filtered(): IConnectorProvider[] {
      const q = this.search.trim().toLowerCase();
      if (!q) return this.providers;
      return this.providers.filter((p) => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q));
    }
  },
  watch: {
    token: {
      immediate: true,
      handler(val: string) {
        if (val) this.load();
      }
    }
  },
  methods: {
    getIcon(id: string): string {
      return PROVIDER_ICONS[id] || 'fa-solid fa-plug';
    },
    async load() {
      if (!this.token) return;
      this.loading = true;
      try {
        const { data } = await connectorOperator.listProviders(this.token);
        this.providers = data.providers || [];
      } catch {
        ElMessage.error(this.$t('connector.common.loadError'));
      } finally {
        this.loading = false;
      }
    },
    goBack() {
      this.$router.push({ name: ROUTE_CONNECTORS_INDEX });
    },
    async onInstall(provider: IConnectorProvider) {
      if (provider.connected) return;
      if (!this.token) return;
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
            await this.load();
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
  margin-bottom: 24px;

  .back-btn {
    flex-shrink: 0;
  }

  .title-block {
    flex: 1;
    .title {
      font-size: 20px;
      font-weight: 600;
    }
    .subtitle {
      margin-top: 2px;
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }

  .search {
    width: 280px;
    flex-shrink: 0;
  }
}

.grid-wrap {
  flex: 1;
}

.empty {
  text-align: center;
  color: var(--el-text-color-secondary);
  padding: 60px 0;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-bg-color);

  .card-icon {
    width: 36px;
    height: 36px;
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
      font-size: 14px;
      font-weight: 600;
    }
    .card-desc {
      margin-top: 2px;
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
</style>
