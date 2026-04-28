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
          <div v-if="getConnector(provider.id)" class="provider-profile">
            <img
              v-if="getConnector(provider.id)?.profile?.avatar"
              :src="getConnector(provider.id)?.profile?.avatar"
              class="avatar"
            />
            <span class="profile-name">{{ getConnector(provider.id)?.profile?.name }}</span>
            <span v-if="getConnector(provider.id)?.profile?.email" class="profile-email">
              ({{ getConnector(provider.id)?.profile?.email }})
            </span>
          </div>
        </div>
        <div class="provider-actions">
          <template v-if="provider.connected">
            <el-switch
              :model-value="getConnector(provider.id)?.is_enabled"
              size="small"
              @change="onToggle(provider.id, $event as boolean)"
            />
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
import { connectorOperator } from '@/operators';
import { openConnectionsManager } from '@/utils';
import { IConnectorProvider, IConnector } from '@/models';

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
    }
  },
  emits: ['update:modelValue', 'change'],
  data() {
    return {
      providers: [] as IConnectorProvider[],
      connectors: [] as IConnector[],
      loading: false,
      loadError: false,
      connecting: '' as string
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
    getConnector(providerId: string): IConnector | undefined {
      return this.connectors.find((c) => c.provider === providerId);
    },
    async loadData() {
      if (!this.token) return;
      this.loading = true;
      this.loadError = false;
      try {
        const [providersRes, connectorsRes] = await Promise.all([
          connectorOperator.listProviders(this.token),
          connectorOperator.list(this.token)
        ]);
        this.providers = providersRes.data.providers || [];
        this.connectors = connectorsRes.data.items || [];
      } catch {
        this.loadError = true;
      } finally {
        this.loading = false;
      }
    },
    onConnect(providerId: string) {
      // OAuth grants are managed centrally at AuthFrontend
      // (auth.acedata.cloud/user/connections). Redirect there with a
      // return_url so the user can come back to Nexior when finished.
      openConnectionsManager(providerId);
    },
    onDisconnect(providerId: string) {
      openConnectionsManager(providerId);
    },
    onToggle(providerId: string, _enabled: boolean) {
      void _enabled;
      openConnectionsManager(providerId);
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
