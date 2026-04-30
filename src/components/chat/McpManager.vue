<template>
  <el-dialog
    v-model="visible"
    :title="$t('chat.mcp.title')"
    width="600px"
    :close-on-click-modal="false"
    @close="$emit('update:modelValue', false)"
  >
    <div class="mcp-manager">
      <div class="header">
        <el-button type="primary" size="small" @click="onManageAtAuth">
          <font-awesome-icon icon="fa-solid fa-up-right-from-square" class="mr-1" />
          {{ $t('chat.mcp.manageAtAuth') }}
        </el-button>
      </div>

      <div v-if="authConnections.length === 0" class="empty">
        {{ $t('chat.mcp.empty') }}
      </div>

      <div v-else class="server-list">
        <div v-for="conn in authConnections" :key="conn.id" class="server-item">
          <div class="server-info">
            <div class="server-header">
              <el-switch
                :model-value="isEnabled(conn.id)"
                size="small"
                :disabled="conn.status !== 'active'"
                @change="onToggle(conn.id, $event as boolean)"
              />
              <span class="server-name">{{ getName(conn) }}</span>
              <el-tag size="small" type="success" effect="plain">OAuth</el-tag>
              <el-tag v-if="conn.status !== 'active'" size="small" type="warning" effect="plain">
                {{ conn.status }}
              </el-tag>
            </div>
            <div class="server-url">{{ conn.server_url }}</div>
          </div>
          <div class="server-actions">
            <el-button
              text
              size="small"
              :loading="refreshingId === conn.id"
              :title="$t('chat.mcp.refresh')"
              @click="onRefresh(conn)"
            >
              <font-awesome-icon icon="fa-solid fa-arrows-rotate" />
            </el-button>
            <el-button text size="small" :title="$t('chat.mcp.manage')" @click="onManageAtAuth">
              <font-awesome-icon icon="fa-solid fa-up-right-from-square" />
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { ElDialog, ElButton, ElSwitch, ElTag, ElMessage } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { connectionOperator } from '@/operators';
import { IConnection } from '@/models';
import { openConnectionsManager } from '@/utils';

/**
 * MCP server picker for chat.
 *
 * Source of truth is AuthBackend `Connection` (kind=custom_oauth) — the
 * user authorizes / adds / revokes MCP servers at
 * https://auth.acedata.cloud/user/connections. This dialog only:
 *   1. lists those connections,
 *   2. lets the user toggle which ones to use in this chat (persisted
 *      by the parent),
 *   3. exposes a per-row token refresh,
 *   4. deep-links to AuthBackend for any management action.
 *
 * No CRUD lives here. AuthBackend owns the secrets.
 */
export default defineComponent({
  name: 'McpManager',
  components: { ElDialog, ElButton, ElSwitch, ElTag, FontAwesomeIcon },
  props: {
    modelValue: {
      type: Boolean,
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
      refreshingId: null as string | null
    };
  },
  computed: {
    visible: {
      get(): boolean {
        return this.modelValue;
      },
      set(val: boolean) {
        this.$emit('update:modelValue', val);
      }
    }
  },
  methods: {
    isEnabled(id: string): boolean {
      return this.enabledConnectionIds.includes(id);
    },
    getName(conn: IConnection): string {
      return (
        (conn.metadata?.server_name as string | undefined) ||
        (conn.profile?.server_name as string | undefined) ||
        (conn.metadata?.name as string | undefined) ||
        conn.provider ||
        conn.server_url
      );
    },
    onToggle(id: string, enabled: boolean) {
      const next = enabled
        ? Array.from(new Set([...this.enabledConnectionIds, id]))
        : this.enabledConnectionIds.filter((x) => x !== id);
      this.$emit('update:enabledConnectionIds', next);
      this.$emit('change');
    },
    onManageAtAuth() {
      openConnectionsManager('mcp');
    },
    async onRefresh(conn: IConnection) {
      this.refreshingId = conn.id;
      try {
        await connectionOperator.refresh(conn.id);
        ElMessage.success(this.$t('chat.mcp.refreshed') as string);
        this.$emit('refresh-connections');
      } catch {
        ElMessage.error(this.$t('chat.mcp.refreshFailed') as string);
      } finally {
        this.refreshingId = null;
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.mcp-manager {
  .header {
    margin-bottom: 12px;
  }

  .empty {
    text-align: center;
    color: var(--el-text-color-secondary);
    padding: 32px 0;
    font-size: 14px;
  }

  .server-list {
    min-height: 60px;
  }

  .server-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    margin-bottom: 8px;

    &:hover {
      border-color: var(--el-border-color);
    }

    .server-info {
      flex: 1;
      min-width: 0;

      .server-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 4px;

        .server-name {
          font-weight: 500;
          font-size: 14px;
        }
      }

      .server-url {
        font-size: 12px;
        color: var(--el-text-color-secondary);
        word-break: break-all;
      }
    }

    .server-actions {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-shrink: 0;
    }
  }
}
</style>
