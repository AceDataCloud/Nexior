<template>
  <div class="detail">
    <header class="detail-header">
      <div class="lead">
        <div class="icon">
          <font-awesome-icon :icon="item.icon || 'fa-solid fa-plug'" />
        </div>
        <div class="info">
          <div class="title-row">
            <span class="title">{{ item.name }}</span>
            <el-tag v-if="item.isBuiltin" type="success" effect="plain" round>
              {{ $t('connector.badge.builtin') }}
            </el-tag>
            <el-tag v-else-if="item.isCustom" type="info" effect="plain" round>
              {{ $t('connector.badge.custom') }}
            </el-tag>
          </div>
          <div v-if="item.description" class="desc">{{ item.description }}</div>
        </div>
      </div>
      <div class="actions">
        <template v-if="item.kind === 'provider'">
          <template v-if="item.connected">
            <el-switch
              v-if="item.connector"
              :model-value="item.connector.is_enabled"
              @change="onToggleConnector($event as boolean)"
            />
            <el-button type="danger" plain @click="onDisconnectProvider">
              {{ $t('connector.detail.disconnect') }}
            </el-button>
          </template>
          <el-button v-else type="primary" :loading="connecting" @click="onConnectProvider">
            <font-awesome-icon icon="fa-solid fa-plug" class="mr-1" />
            {{ $t('connector.detail.connect') }}
          </el-button>
        </template>
        <template v-else-if="item.kind === 'custom' && item.mcp">
          <el-switch :model-value="item.mcp.is_enabled" @change="onToggleMcp($event as boolean)" />
          <el-button
            v-if="item.mcp.auth_type === 'oauth' && item.mcp.oauth_status !== 'authorized'"
            type="warning"
            :loading="authorizing"
            @click="onAuthorizeMcp"
          >
            <font-awesome-icon icon="fa-solid fa-key" class="mr-1" />
            {{ $t('connector.custom.authorize') }}
          </el-button>
          <el-button type="danger" plain @click="onDeleteMcp">
            {{ $t('connector.detail.disconnect') }}
          </el-button>
        </template>
      </div>
    </header>

    <!-- Connected account profile (for OAuth providers) -->
    <section v-if="item.connector?.profile" class="profile">
      <div class="section-title">{{ $t('connector.detail.profile') }}</div>
      <div class="profile-row">
        <img v-if="item.connector.profile.avatar" :src="item.connector.profile.avatar" class="avatar" />
        <span class="profile-name">{{ item.connector.profile.name }}</span>
        <span v-if="item.connector.profile.email" class="profile-email">
          {{ item.connector.profile.email }}
        </span>
      </div>
    </section>

    <!-- Custom MCP URL summary -->
    <section v-if="item.mcp?.url" class="profile">
      <div class="section-title">URL</div>
      <code class="url">{{ item.mcp.url }}</code>
    </section>

    <!-- Tool permissions -->
    <section v-if="tools.length || item.kind === 'custom'" class="permissions">
      <div class="section-title-row">
        <span class="section-title">{{ $t('connector.detail.toolPermissions') }} ({{ tools.length }})</span>
        <el-select v-model="defaultPermission" class="default-select" @change="onDefaultChanged">
          <el-option value="always" :label="$t('connector.permission.always')" />
          <el-option value="ask" :label="$t('connector.permission.ask')" />
          <el-option value="never" :label="$t('connector.permission.never')" />
        </el-select>
      </div>
      <p class="section-help">{{ $t('connector.detail.toolPermissions.help') }}</p>
      <div v-if="tools.length === 0" class="empty">{{ $t('connector.detail.noTools') }}</div>
      <ul v-else class="tool-list">
        <li v-for="tool in tools" :key="tool.name" class="tool-row">
          <div class="tool-info">
            <div class="tool-name">{{ tool.name }}</div>
            <div v-if="tool.description" class="tool-desc">{{ tool.description }}</div>
          </div>
          <el-radio-group
            :model-value="getPermission(tool.name)"
            @change="setPermission(tool.name, $event as ToolPermission)"
          >
            <el-radio-button value="always" :title="$t('connector.permission.always')">
              <font-awesome-icon icon="fa-solid fa-check" />
            </el-radio-button>
            <el-radio-button value="ask" :title="$t('connector.permission.ask')">
              <font-awesome-icon icon="fa-solid fa-hand" />
            </el-radio-button>
            <el-radio-button value="never" :title="$t('connector.permission.never')">
              <font-awesome-icon icon="fa-solid fa-ban" />
            </el-radio-button>
          </el-radio-group>
        </li>
      </ul>
    </section>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import {
  ElButton,
  ElSwitch,
  ElTag,
  ElSelect,
  ElOption,
  ElRadioGroup,
  ElRadioButton,
  ElMessage,
  ElMessageBox
} from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { connectorOperator, mcpServerOperator } from '@/operators';
import { IMcpTool } from '@/models';
import { IConnectorItem, ToolPermission, loadPermissions, savePermissions } from '@/components/connectors/types';

export default defineComponent({
  name: 'ConnectorDetail',
  components: {
    ElButton,
    ElSwitch,
    ElTag,
    ElSelect,
    ElOption,
    ElRadioGroup,
    ElRadioButton,
    FontAwesomeIcon
  },
  props: {
    item: { type: Object as PropType<IConnectorItem>, required: true },
    token: { type: String as PropType<string>, default: '' }
  },
  emits: ['change'],
  data() {
    return {
      connecting: false,
      authorizing: false,
      defaultPermission: 'ask' as ToolPermission,
      permissions: {} as Record<string, ToolPermission>
    };
  },
  computed: {
    tools(): IMcpTool[] {
      return this.item.mcp?.tools_cache || [];
    }
  },
  watch: {
    'item.id': {
      immediate: true,
      handler() {
        this.reloadPermissions();
      }
    }
  },
  methods: {
    reloadPermissions() {
      const all = loadPermissions();
      const entry = all[this.item.id] || {};
      this.permissions = { ...entry };
      this.defaultPermission = (entry.__default as ToolPermission) || 'ask';
    },
    persist() {
      const all = loadPermissions();
      const merged: Record<string, ToolPermission> = { ...this.permissions, __default: this.defaultPermission };
      all[this.item.id] = merged;
      savePermissions(all);
    },
    getPermission(toolName: string): ToolPermission {
      return this.permissions[toolName] || this.defaultPermission;
    },
    setPermission(toolName: string, value: ToolPermission) {
      this.permissions = { ...this.permissions, [toolName]: value };
      this.persist();
    },
    onDefaultChanged() {
      this.persist();
    },
    // Provider OAuth
    async onConnectProvider() {
      const providerId = this.item.provider?.id;
      if (!providerId || !this.token) return;
      this.connecting = true;
      try {
        const { data } = await connectorOperator.authorize(providerId, this.token);
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
            this.$emit('change');
          } catch {
            ElMessage.error(this.$t('connector.common.authFailed'));
          }
        };
        window.addEventListener('message', handler);
        const pollTimer = setInterval(() => {
          if (popup?.closed) {
            clearInterval(pollTimer);
            this.connecting = false;
          }
        }, 500);
      } catch {
        ElMessage.error(this.$t('connector.common.authFailed'));
        this.connecting = false;
      }
    },
    async onDisconnectProvider() {
      const providerId = this.item.provider?.id;
      if (!providerId || !this.token) return;
      try {
        await connectorOperator.disconnect(providerId, this.token);
        ElMessage.success(this.$t('connector.detail.disconnected'));
        this.$emit('change');
      } catch {
        ElMessage.error(this.$t('connector.common.toggleError'));
      }
    },
    async onToggleConnector(enabled: boolean) {
      const providerId = this.item.provider?.id;
      if (!providerId || !this.token) return;
      try {
        await connectorOperator.toggle(providerId, enabled, this.token);
        this.$emit('change');
      } catch {
        ElMessage.error(this.$t('connector.common.toggleError'));
      }
    },
    // Custom MCP
    async onToggleMcp(enabled: boolean) {
      const id = this.item.mcp?.id;
      if (!id || !this.token) return;
      try {
        await mcpServerOperator.update({ id, is_enabled: enabled }, this.token);
        this.$emit('change');
      } catch {
        ElMessage.error(this.$t('connector.common.toggleError'));
      }
    },
    async onDeleteMcp() {
      const mcp = this.item.mcp;
      if (!mcp || !this.token) return;
      try {
        await ElMessageBox.confirm(
          this.$t('connector.custom.deleteConfirm', { name: mcp.name }),
          this.$t('connector.common.confirm'),
          { type: 'warning' }
        );
      } catch {
        return;
      }
      try {
        await mcpServerOperator.delete(mcp.id, this.token);
        ElMessage.success(this.$t('connector.custom.deleted'));
        this.$emit('change');
      } catch {
        ElMessage.error(this.$t('connector.common.toggleError'));
      }
    },
    async onAuthorizeMcp() {
      const id = this.item.mcp?.id;
      if (!id || !this.token) return;
      this.authorizing = true;
      try {
        const { data } = await mcpServerOperator.oauthStart(id, this.token);
        if (data.status === 'authorized') {
          ElMessage.success(this.$t('connector.common.authSuccess'));
          this.$emit('change');
          return;
        }
        if (!data.authorization_url) return;
        const popup = window.open(data.authorization_url, 'oauth-popup', 'width=600,height=700,scrollbars=yes');
        const handler = async (event: MessageEvent) => {
          if (event.data?.type !== 'oauth-callback') return;
          window.removeEventListener('message', handler);
          const { code } = event.data;
          if (!code) {
            ElMessage.error(this.$t('connector.common.authFailed'));
            return;
          }
          try {
            await mcpServerOperator.oauthCallback(id, code, this.token);
            ElMessage.success(this.$t('connector.common.authSuccess'));
            this.$emit('change');
          } catch {
            ElMessage.error(this.$t('connector.common.authFailed'));
          }
        };
        window.addEventListener('message', handler);
        const pollTimer = setInterval(() => {
          if (popup?.closed) {
            clearInterval(pollTimer);
            this.authorizing = false;
          }
        }, 500);
      } catch {
        ElMessage.error(this.$t('connector.common.authFailed'));
        this.authorizing = false;
      }
    }
  }
});
</script>

<style scoped lang="scss">
.detail {
  padding: 24px 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.detail-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;

  .lead {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    flex: 1;
    min-width: 0;

    .icon {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      border-radius: 8px;
      background: var(--el-fill-color);
      flex-shrink: 0;
    }

    .info {
      min-width: 0;
      .title-row {
        display: flex;
        align-items: center;
        gap: 8px;
        .title {
          font-size: 18px;
          font-weight: 600;
        }
      }
      .desc {
        margin-top: 4px;
        font-size: 13px;
        color: var(--el-text-color-secondary);
      }
    }
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }
}

.profile {
  .section-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin-bottom: 8px;
  }

  .profile-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: var(--el-text-color-regular);

    .avatar {
      width: 24px;
      height: 24px;
      border-radius: 50%;
    }

    .profile-email {
      color: var(--el-text-color-secondary);
    }
  }

  .url {
    font-size: 12px;
    padding: 6px 10px;
    background: var(--el-fill-color);
    border-radius: 4px;
    word-break: break-all;
    display: inline-block;
  }
}

.permissions {
  .section-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    .section-title {
      font-size: 13px;
      font-weight: 600;
    }
    .default-select {
      width: 160px;
    }
  }
  .section-help {
    margin: 6px 0 12px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
  .empty {
    text-align: center;
    color: var(--el-text-color-secondary);
    font-size: 13px;
    padding: 20px 0;
  }
}

.tool-list {
  list-style: none;
  margin: 0;
  padding: 0;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  overflow: hidden;
}

.tool-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  gap: 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);

  &:last-child {
    border-bottom: none;
  }

  .tool-info {
    flex: 1;
    min-width: 0;
    .tool-name {
      font-size: 13px;
      font-weight: 500;
    }
    .tool-desc {
      margin-top: 2px;
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }
}
</style>
