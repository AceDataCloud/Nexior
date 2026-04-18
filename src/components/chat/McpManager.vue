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
        <el-button type="primary" size="small" @click="showAddForm = true">
          <font-awesome-icon icon="fa-solid fa-plus" class="mr-1" />
          {{ $t('chat.mcp.addServer') }}
        </el-button>
      </div>

      <!-- Add/Edit Form -->
      <el-card v-if="showAddForm || editingServer" shadow="never" class="form-card">
        <el-form :model="form" label-position="top" size="default">
          <el-form-item :label="$t('chat.mcp.name')" required>
            <el-input v-model="form.name" :placeholder="$t('chat.mcp.namePlaceholder')" />
          </el-form-item>
          <el-form-item :label="$t('chat.mcp.url')" required>
            <el-input v-model="form.url" :placeholder="$t('chat.mcp.urlPlaceholder')" />
          </el-form-item>
          <el-form-item :label="$t('chat.mcp.description')">
            <el-input v-model="form.description" :placeholder="$t('chat.mcp.descriptionPlaceholder')" />
          </el-form-item>
          <el-form-item :label="$t('chat.mcp.authType')">
            <el-select v-model="form.auth_type" style="width: 100%">
              <el-option value="none" :label="$t('chat.mcp.authNone')" />
              <el-option value="bearer" :label="$t('chat.mcp.authBearer')" />
              <el-option value="oauth" :label="$t('chat.mcp.authOAuth')" />
            </el-select>
          </el-form-item>
          <el-form-item v-if="form.auth_type === 'bearer'" :label="$t('chat.mcp.authToken')">
            <el-input
              v-model="form.auth_token"
              type="password"
              show-password
              :placeholder="$t('chat.mcp.authTokenPlaceholder')"
            />
          </el-form-item>
          <div v-if="form.auth_type === 'oauth'" class="oauth-hint">
            <el-text type="info" size="small">{{ $t('chat.mcp.oauthHint') }}</el-text>
          </div>
          <div class="form-actions">
            <el-button size="small" @click="onCancelForm">{{ $t('common.button.cancel') }}</el-button>
            <el-button size="small" :loading="testing" @click="onTest">
              <font-awesome-icon icon="fa-solid fa-link" class="mr-1" />
              {{ $t('chat.mcp.test') }}
            </el-button>
            <el-button type="primary" size="small" :loading="submitting" @click="onSave">
              {{ editingServer ? $t('common.button.save') : $t('chat.mcp.addServer') }}
            </el-button>
          </div>
        </el-form>
        <!-- Test Results -->
        <div v-if="testResult" class="test-result">
          <el-tag :type="testResult.success ? 'success' : 'danger'" size="small" effect="dark">
            {{ testResult.success ? $t('chat.mcp.testSuccess') : $t('chat.mcp.testFailed') }}
          </el-tag>
          <span v-if="testResult.success" class="test-info">
            {{ $t('chat.mcp.toolsFound', { count: testResult.tools_count }) }}
          </span>
          <span v-else class="test-error">{{ testResult.error }}</span>
          <div v-if="testResult.tools?.length" class="test-tools">
            <div v-for="tool in testResult.tools" :key="tool.name" class="test-tool">
              <span class="tool-name">{{ tool.name }}</span>
              <span v-if="tool.description" class="tool-desc">{{ tool.description }}</span>
            </div>
          </div>
        </div>
      </el-card>

      <!-- Server List -->
      <div v-loading="loading" class="server-list">
        <div v-if="servers.length === 0 && !loading && !loadError" class="empty">
          {{ $t('chat.mcp.empty') }}
        </div>
        <div v-if="loadError && !loading" class="empty">
          {{ $t('chat.mcp.loadErrorHint') }}
        </div>
        <div v-for="server in servers" :key="server.id" class="server-item">
          <div class="server-info">
            <div class="server-header">
              <el-switch :model-value="server.is_enabled" size="small" @change="onToggle(server, $event as boolean)" />
              <span class="server-name">{{ server.name }}</span>
              <el-tag v-if="server.tools_cache?.length" size="small" type="info" effect="plain">
                {{ server.tools_cache.length }} tools
              </el-tag>
              <el-tag v-if="server.auth_type === 'oauth' && server.oauth_status === 'authorized'" size="small" type="success" effect="plain">
                OAuth
              </el-tag>
              <el-button
                v-if="server.auth_type === 'oauth' && server.oauth_status !== 'authorized'"
                size="small"
                type="warning"
                :loading="authorizingServerId === server.id"
                @click="onAuthorize(server)"
              >
                <font-awesome-icon icon="fa-solid fa-key" class="mr-1" />
                {{ $t('chat.mcp.authorize') }}
              </el-button>
            </div>
            <div class="server-url">{{ server.url }}</div>
            <div v-if="server.description" class="server-desc">{{ server.description }}</div>
          </div>
          <div class="server-actions">
            <el-button text size="small" @click="onEdit(server)">
              <font-awesome-icon icon="fa-solid fa-pen-to-square" />
            </el-button>
            <el-button text size="small" type="danger" @click="onDelete(server)">
              <font-awesome-icon icon="fa-solid fa-trash" />
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import {
  ElDialog,
  ElButton,
  ElForm,
  ElFormItem,
  ElInput,
  ElSelect,
  ElOption,
  ElCard,
  ElSwitch,
  ElTag,
  ElMessage,
  ElMessageBox,
  ElText
} from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { mcpServerOperator } from '@/operators';
import { IMcpServer, IMcpServerTestResponse } from '@/models';

interface IForm {
  name: string;
  url: string;
  description: string;
  auth_type: string;
  auth_token: string;
}

export default defineComponent({
  name: 'McpManager',
  components: {
    ElDialog,
    ElButton,
    ElForm,
    ElFormItem,
    ElInput,
    ElSelect,
    ElOption,
    ElCard,
    ElSwitch,
    ElTag,
    ElText,
    FontAwesomeIcon
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue', 'change'],
  data() {
    return {
      servers: [] as IMcpServer[],
      loading: false,
      loadError: false,
      submitting: false,
      testing: false,
      showAddForm: false,
      editingServer: null as IMcpServer | null,
      testResult: null as IMcpServerTestResponse | null,
      form: {
        name: '',
        url: '',
        description: '',
        auth_type: 'none',
        auth_token: ''
      } as IForm,
      authorizingServerId: null as string | null,
      oauthMessageHandler: null as ((event: MessageEvent) => void) | null
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
    },
    token(): string {
      return this.$store.state.chat?.credential?.token || '';
    }
  },
  watch: {
    modelValue(val) {
      if (val) {
        this.onLoad();
      }
    }
  },
  beforeUnmount() {
    if (this.oauthMessageHandler) {
      window.removeEventListener('message', this.oauthMessageHandler);
    }
  },
  methods: {
    async onLoad() {
      this.loading = true;
      this.loadError = false;
      try {
        const { data } = await mcpServerOperator.list(this.token);
        this.servers = data.items || [];
      } catch {
        this.loadError = true;
      } finally {
        this.loading = false;
      }
    },
    resetForm() {
      this.form = { name: '', url: '', description: '', auth_type: 'none', auth_token: '' };
      this.testResult = null;
      this.showAddForm = false;
      this.editingServer = null;
    },
    onCancelForm() {
      this.resetForm();
    },
    onEdit(server: IMcpServer) {
      this.editingServer = server;
      this.showAddForm = false;
      this.testResult = null;
      this.form = {
        name: server.name,
        url: server.url,
        description: server.description || '',
        auth_type: server.auth_type || 'none',
        auth_token: server.auth_token || ''
      };
    },
    async onSave() {
      if (!this.form.name || !this.form.url) {
        ElMessage.warning(this.$t('chat.mcp.nameUrlRequired') as string);
        return;
      }
      this.submitting = true;
      try {
        if (this.editingServer) {
          await mcpServerOperator.update({ id: this.editingServer.id, ...this.form }, this.token);
          ElMessage.success(this.$t('chat.mcp.updated') as string);
        } else {
          await mcpServerOperator.create(this.form, this.token);
          ElMessage.success(this.$t('chat.mcp.created') as string);
        }
        this.resetForm();
        await this.onLoad();
        this.$emit('change');
      } catch {
        ElMessage.error(this.$t('chat.mcp.saveFailed') as string);
      } finally {
        this.submitting = false;
      }
    },
    async onDelete(server: IMcpServer) {
      try {
        await ElMessageBox.confirm(
          this.$t('chat.mcp.deleteConfirm', { name: server.name }) as string,
          this.$t('common.button.delete') as string,
          { type: 'warning', confirmButtonClass: 'el-button--danger' }
        );
        await mcpServerOperator.delete(server.id, this.token);
        ElMessage.success(this.$t('chat.mcp.deleted') as string);
        await this.onLoad();
        this.$emit('change');
      } catch {
        // cancelled
      }
    },
    async onToggle(server: IMcpServer, enabled: boolean) {
      try {
        await mcpServerOperator.update({ id: server.id, is_enabled: enabled }, this.token);
        server.is_enabled = enabled;
        this.$emit('change');
      } catch {
        ElMessage.error('Failed to update server');
      }
    },
    async onTest() {
      if (!this.form.url) {
        ElMessage.warning(this.$t('chat.mcp.urlRequired') as string);
        return;
      }
      this.testing = true;
      this.testResult = null;
      try {
        const { data } = await mcpServerOperator.test(
          { url: this.form.url, auth_type: this.form.auth_type, auth_token: this.form.auth_token },
          this.token
        );
        this.testResult = data;
      } catch (err: any) {
        this.testResult = {
          success: false,
          error: err?.response?.data?.error || 'Connection failed'
        };
      } finally {
        this.testing = false;
      }
    },
    async onAuthorize(server: IMcpServer) {
      this.authorizingServerId = server.id;
      try {
        const { data } = await mcpServerOperator.oauthStart(server.id, this.token);
        if (data.status === 'authorized') {
          ElMessage.success(this.$t('chat.mcp.oauthAuthorized') as string);
          await this.onLoad();
          this.$emit('change');
          return;
        }
        if (data.status === 'redirect' && data.authorization_url) {
          const popup = window.open(data.authorization_url, 'mcp-oauth', 'width=600,height=700');
          if (!popup) {
            ElMessage.error(this.$t('chat.mcp.popupBlocked') as string);
            return;
          }
          const popupPollTimer = window.setInterval(() => {
            if (!popup.closed) return;
            window.clearInterval(popupPollTimer);
            if (this.oauthMessageHandler) {
              window.removeEventListener('message', this.oauthMessageHandler);
              this.oauthMessageHandler = null;
            }
            this.authorizingServerId = null;
          }, 500);
          // Clean up any previous listener
          if (this.oauthMessageHandler) {
            window.removeEventListener('message', this.oauthMessageHandler);
          }
          this.oauthMessageHandler = async (event: MessageEvent) => {
            if (event.origin !== window.location.origin) return;
            if (event.data?.type !== 'oauth-callback') return;
            window.clearInterval(popupPollTimer);
            window.removeEventListener('message', this.oauthMessageHandler!);
            this.oauthMessageHandler = null;
            try {
              const { data: cbData } = await mcpServerOperator.oauthCallback(server.id, event.data.code, this.token);
              if (cbData.status === 'authorized') {
                ElMessage.success(this.$t('chat.mcp.oauthAuthorized') as string);
                await this.onLoad();
                this.$emit('change');
              } else {
                ElMessage.error(cbData.error || this.$t('chat.mcp.oauthFailed') as string);
              }
            } catch {
              ElMessage.error(this.$t('chat.mcp.oauthFailed') as string);
            } finally {
              this.authorizingServerId = null;
            }
          };
          window.addEventListener('message', this.oauthMessageHandler);
        }
      } catch {
        ElMessage.error(this.$t('chat.mcp.oauthFailed') as string);
      } finally {
        if (!this.oauthMessageHandler) {
          this.authorizingServerId = null;
        }
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

  .form-card {
    margin-bottom: 16px;

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }

    .oauth-hint {
      margin-bottom: 12px;
    }
  }

  .test-result {
    margin-top: 12px;
    padding: 8px 12px;
    background: var(--el-fill-color-light);
    border-radius: 6px;
    font-size: 13px;

    .test-info {
      margin-left: 8px;
      color: var(--el-text-color-secondary);
    }

    .test-error {
      margin-left: 8px;
      color: var(--el-color-danger);
    }

    .test-tools {
      margin-top: 8px;

      .test-tool {
        padding: 4px 0;
        display: flex;
        gap: 8px;
        align-items: baseline;

        .tool-name {
          font-family: monospace;
          font-weight: 500;
          color: var(--el-text-color-primary);
        }

        .tool-desc {
          font-size: 12px;
          color: var(--el-text-color-secondary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
    }
  }

  .server-list {
    min-height: 60px;

    .empty {
      text-align: center;
      color: var(--el-text-color-secondary);
      padding: 20px 0;
      font-size: 14px;
    }
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
        font-family: monospace;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .server-desc {
        font-size: 12px;
        color: var(--el-text-color-secondary);
        margin-top: 2px;
      }
    }

    .server-actions {
      display: flex;
      gap: 2px;
      flex-shrink: 0;
    }
  }
}

.mr-1 {
  margin-right: 4px;
}
</style>
