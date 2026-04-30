<template>
  <el-dialog
    v-model="visible"
    :title="$t('chat.connector.title')"
    width="560px"
    :close-on-click-modal="false"
    @close="$emit('update:modelValue', false)"
  >
    <div v-loading="loading" class="connector-manager">
      <!-- Provider List -->
      <div v-if="providers.length === 0 && !loading && !loadError" class="empty">
        {{ $t('chat.connector.noProviders') }}
      </div>
      <div v-if="loadError && !loading" class="empty">
        {{ $t('chat.connector.loadErrorHint') }}
      </div>
      <div v-for="provider in providers" :key="provider.id" class="provider-item">
        <div class="provider-icon">
          <font-awesome-icon :icon="getProviderIcon(provider.id)" class="icon" />
        </div>
        <div class="provider-info">
          <div class="provider-name">{{ provider.name }}</div>
          <div class="provider-desc">{{ provider.description }}</div>
          <div v-if="getConnection(provider.id)" class="provider-profile">
            <img
              v-if="getConnection(provider.id)?.profile?.avatar"
              :src="getConnection(provider.id)?.profile?.avatar"
              class="avatar"
            />
            <span class="profile-name">{{ getConnection(provider.id)?.profile?.name }}</span>
            <span v-if="getConnection(provider.id)?.profile?.email" class="profile-email">
              ({{ getConnection(provider.id)?.profile?.email }})
            </span>
          </div>
        </div>
        <div class="provider-actions">
          <template v-if="isConnected(provider.id)">
            <el-switch
              :model-value="isEnabled(provider.id)"
              size="small"
              @change="onToggleEnabled(provider.id, $event as boolean)"
            />
            <el-button
              text
              size="small"
              :loading="refreshingId === getConnection(provider.id)?.id"
              :title="$t('chat.connector.refresh')"
              @click="onRefresh(provider.id)"
            >
              <font-awesome-icon icon="fa-solid fa-arrows-rotate" />
            </el-button>
            <el-button size="small" type="danger" text @click="onDisconnect(provider.id)">
              {{ $t('chat.connector.disconnect') }}
            </el-button>
          </template>
          <el-button
            v-else
            size="small"
            type="primary"
            :loading="connecting === provider.id"
            @click="onConnect(provider.id)"
          >
            <font-awesome-icon icon="fa-solid fa-plug" class="mr-1" />
            {{ $t('chat.connector.connect') }}
          </el-button>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { connectorOperator, connectionOperator } from '@/operators';
import { openConnectionsManager } from '@/utils';
import { IConnectorProvider, IConnection } from '@/models';
import { ElMessage } from 'element-plus';

const PROVIDER_ICONS: Record<string, string> = {
  google: 'fa-brands fa-google',
  github: 'fa-brands fa-github',
  slack: 'fa-brands fa-slack'
};

export default defineComponent({
  name: 'ConnectorManager',
  props: {
    modelValue: {
      type: Boolean as PropType<boolean>,
      default: false
    },
    authConnections: {
      type: Array as PropType<IConnection[]>,
      default: () => []
    },
    enabledConnectionIds: {
      type: Array as PropType<string[]>,
      default: () => []
    }
  },
  emits: ['update:modelValue', 'change', 'update:enabledConnectionIds', 'refresh-connections'],
  data() {
    return {
      providers: [] as IConnectorProvider[],
      loading: false,
      loadError: false,
      connecting: '' as string,
      refreshingId: null as string | null
    };
  },
  computed: {
    visible: {
      get() {
        return this.modelValue;
      },
      set(val: boolean) {
        this.$emit('update:modelValue', val);
      }
    },
    token(): string | undefined {
      return this.$store.state.chat?.credential?.token;
    }
  },
  watch: {
    modelValue(val: boolean) {
      if (val) {
        this.loadData();
      }
    }
  },
  methods: {
    getProviderIcon(id: string): string {
      return PROVIDER_ICONS[id] || 'fa-solid fa-plug';
    },
    getConnection(providerId: string): IConnection | undefined {
      return this.authConnections.find((c) => c.kind === 'preset' && c.provider === providerId);
    },
    isConnected(providerId: string): boolean {
      const conn = this.getConnection(providerId);
      return !!conn && conn.status === 'active';
    },
    isEnabled(providerId: string): boolean {
      const conn = this.getConnection(providerId);
      return !!conn && this.enabledConnectionIds.includes(conn.id);
    },
    onToggleEnabled(providerId: string, enabled: boolean) {
      const conn = this.getConnection(providerId);
      if (!conn) return;
      const next = enabled
        ? Array.from(new Set([...this.enabledConnectionIds, conn.id]))
        : this.enabledConnectionIds.filter((x) => x !== conn.id);
      this.$emit('update:enabledConnectionIds', next);
      this.$emit('change');
    },
    async loadData() {
      if (!this.token) return;
      this.loading = true;
      this.loadError = false;
      try {
        const providersRes = await connectorOperator.listProviders(this.token);
        this.providers = providersRes.data.providers || [];
      } catch {
        this.loadError = true;
      } finally {
        this.loading = false;
      }
    },
    onConnect(providerId: string) {
      openConnectionsManager(providerId);
    },
    onDisconnect(providerId: string) {
      openConnectionsManager(providerId);
    },
    async onRefresh(providerId: string) {
      const conn = this.getConnection(providerId);
      if (!conn) return;
      this.refreshingId = conn.id;
      try {
        await connectionOperator.refresh(conn.id);
        ElMessage.success(this.$t('chat.connector.refreshed') as string);
        this.$emit('refresh-connections');
      } catch {
        ElMessage.error(this.$t('chat.connector.refreshFailed') as string);
      } finally {
        this.refreshingId = null;
      }
    }
  }
});
</script>

<style scoped lang="scss">
.connector-manager {
  min-height: 120px;
}

.empty {
  text-align: center;
  color: var(--el-text-color-secondary);
  padding: 40px 0;
}

.provider-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  margin-bottom: 12px;
  gap: 14px;

  &:last-child {
    margin-bottom: 0;
  }
}

.provider-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: var(--el-fill-color);
  flex-shrink: 0;

  .icon {
    font-size: 20px;
    color: var(--el-text-color-primary);
  }
}

.provider-info {
  flex: 1;
  min-width: 0;
}

.provider-name {
  font-weight: 600;
  font-size: 14px;
}

.provider-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
}

.provider-profile {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  font-size: 12px;
  color: var(--el-text-color-regular);

  .avatar {
    width: 16px;
    height: 16px;
    border-radius: 50%;
  }

  .profile-email {
    color: var(--el-text-color-secondary);
  }
}

.provider-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
</style>
