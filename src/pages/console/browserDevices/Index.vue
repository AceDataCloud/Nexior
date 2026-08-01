<template>
  <div class="devices-page">
    <console-page-header :title="$t('user.browserDevice.title')" :subtitle="$t('user.browserDevice.subtitle')" />

    <div class="devices-actions">
      <el-button type="primary" @click="pairingVisible = true">
        <add-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
        {{ $t('user.browserDevice.pairButton') }}
      </el-button>
    </div>

    <el-card shadow="never" class="devices-panel" :body-style="{ padding: 0 }">
      <div v-if="loading" class="devices-loading"><el-skeleton :rows="5" animated /></div>
      <el-empty v-else-if="devices.length === 0" :description="$t('user.browserDevice.empty')" />
      <div v-else class="device-list">
        <article v-for="device in devices" :key="device.id" class="device-row">
          <div class="device-icon">
            <desktop-icon :size="'1em' as any" aria-hidden="true" focusable="false" />
          </div>
          <div class="device-content">
            <div class="device-heading">
              <strong>{{ device.name }}</strong>
              <el-tag :type="compatibilityTagType(device)" size="small">
                {{ compatibilityLabel(device) }}
              </el-tag>
            </div>
            <dl class="device-meta">
              <div>
                <dt>{{ $t('user.browserDevice.platform') }}</dt>
                <dd>{{ device.platform }}</dd>
              </div>
              <div>
                <dt>{{ $t('user.browserDevice.extensionVersion') }}</dt>
                <dd>{{ device.extension_version }}</dd>
              </div>
              <div>
                <dt>{{ $t('user.browserDevice.lastSeen') }}</dt>
                <dd>
                  {{ device.last_seen_at ? $dayjs.format(device.last_seen_at) : $t('user.browserDevice.neverSeen') }}
                </dd>
              </div>
              <div>
                <dt>{{ $t('user.browserDevice.capabilities') }}</dt>
                <dd>{{ device.capabilities.length ? device.capabilities.join(', ') : '—' }}</dd>
              </div>
              <div>
                <dt>{{ $t('user.browserDevice.onlineStatus') }}</dt>
                <dd>
                  {{ $t(device.online ? 'connection.message.browserOnline' : 'connection.message.browserOffline') }}
                </dd>
              </div>
              <div>
                <dt>{{ $t('user.browserDevice.activeSessions') }}</dt>
                <dd>{{ device.active_session_count }}</dd>
              </div>
              <div class="device-digest-row">
                <dt>{{ $t('user.browserDevice.wireContractDigest') }}</dt>
                <dd>{{ device.wire_contract_digest }}</dd>
              </div>
            </dl>
          </div>
          <div class="device-actions">
            <el-button
              v-if="device.status !== 'revoked' && device.active_session_count"
              size="small"
              @click="openConnectors"
            >
              {{ $t('user.browserDevice.manageSessions') }}
            </el-button>
            <el-button
              v-if="device.status !== 'revoked'"
              size="small"
              :disabled="busyId === device.id"
              @click="rename(device)"
            >
              {{ $t('user.browserDevice.rename') }}
            </el-button>
            <el-button
              v-if="device.status !== 'revoked'"
              size="small"
              type="danger"
              :loading="busyId === device.id"
              @click="remove(device)"
            >
              {{ $t('user.browserDevice.delete') }}
            </el-button>
          </div>
        </article>
      </div>
    </el-card>

    <browser-pairing-dialog v-model="pairingVisible" @paired="onPaired" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton, ElCard, ElEmpty, ElMessage, ElMessageBox, ElSkeleton, ElTag } from 'element-plus';
import { AddIcon, DesktopIcon } from '@acedatacloud/core/icons/components';
import ConsolePageHeader from '@/components/console/PageHeader.vue';
import BrowserPairingDialog from '@/components/browser/BrowserPairingDialog.vue';
import { browserDeviceOperator } from '@/operators/browserDevice';
import { IBrowserDevice } from '@/models/browserDevice';
import { ROUTE_CONSOLE_CONNECTORS } from '@/router/constants';

interface IData {
  devices: IBrowserDevice[];
  loading: boolean;
  busyId: string | null;
  pairingVisible: boolean;
}

export default defineComponent({
  name: 'ConsoleBrowserDevices',
  components: {
    AddIcon,
    BrowserPairingDialog,
    ConsolePageHeader,
    DesktopIcon,
    ElButton,
    ElCard,
    ElEmpty,
    ElSkeleton,
    ElTag
  },
  data(): IData {
    return { devices: [], loading: false, busyId: null, pairingVisible: false };
  },
  mounted() {
    this.refresh();
  },
  methods: {
    async refresh() {
      this.loading = true;
      try {
        const { data } = await browserDeviceOperator.list();
        this.devices = data.filter((device) => device.status === 'active');
      } catch (error: unknown) {
        ElMessage.error(this.errorDetail(error, 'user.browserDevice.loadFailed'));
      } finally {
        this.loading = false;
      }
    },
    async rename(device: IBrowserDevice) {
      const result = await ElMessageBox.prompt(
        this.$t('user.browserDevice.renamePrompt') as string,
        this.$t('user.browserDevice.renameTitle') as string,
        {
          confirmButtonText: this.$t('common.button.confirm') as string,
          cancelButtonText: this.$t('common.button.cancel') as string,
          inputValue: device.name,
          inputValidator: (value: string) =>
            (Boolean(value.trim()) && value.trim().length <= 128) ||
            (this.$t('user.browserDevice.nameRequired') as string)
        }
      ).catch(() => null);
      if (!result) return;
      const name = (result as { value?: string }).value?.trim();
      if (!name) return;
      this.busyId = device.id;
      try {
        const { data } = await browserDeviceOperator.rename(device.id, name);
        this.devices = this.devices.map((item) => (item.id === data.id ? data : item));
        ElMessage.success(this.$t('user.browserDevice.renameSuccess'));
      } catch (error: unknown) {
        ElMessage.error(this.errorDetail(error, 'user.browserDevice.renameFailed'));
      } finally {
        this.busyId = null;
      }
    },
    async remove(device: IBrowserDevice) {
      const confirmed = await ElMessageBox.confirm(
        this.$t('user.browserDevice.deleteConfirm', {
          name: device.name,
          count: device.active_session_count
        }) as string,
        this.$t('user.browserDevice.deleteTitle') as string,
        {
          confirmButtonText: this.$t('user.browserDevice.delete') as string,
          cancelButtonText: this.$t('common.button.cancel') as string,
          type: 'warning'
        }
      ).catch(() => false);
      if (!confirmed) return;
      this.busyId = device.id;
      try {
        await browserDeviceOperator.delete(device.id);
        await this.refresh();
        ElMessage.success(this.$t('user.browserDevice.deleteSuccess'));
      } catch (error: unknown) {
        ElMessage.error(this.errorDetail(error, 'user.browserDevice.deleteFailed'));
      } finally {
        this.busyId = null;
      }
    },
    onPaired(device: IBrowserDevice) {
      if (device.status === 'active') {
        this.devices = [device, ...this.devices.filter((item) => item.id !== device.id)];
      }
    },
    openConnectors() {
      this.$router.push({ name: ROUTE_CONSOLE_CONNECTORS });
    },
    compatibilityLabel(device: IBrowserDevice): string {
      if (device.compatible) return String(this.$t('connection.message.browserCompatible'));
      return String(this.$t(`connection.message.browserIncompatibility.${device.incompatibility_reason}`));
    },
    compatibilityTagType(device: IBrowserDevice): 'success' | 'warning' | 'danger' | 'info' {
      if (device.compatible) return 'success';
      return device.incompatibility_reason === 'device_offline' ? 'warning' : 'danger';
    },
    errorDetail(error: unknown, fallbackKey: string): string {
      const data = (error as { response?: { data?: { detail?: string; name?: string[] | string } } })?.response?.data;
      const nameError = Array.isArray(data?.name) ? data.name[0] : data?.name;
      return nameError || data?.detail || String(this.$t(fallbackKey));
    }
  }
});
</script>

<style lang="scss" scoped>
.devices-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
}
.devices-panel {
  border-radius: var(--app-card-radius, 12px);
}
.devices-loading {
  padding: 24px;
}
.device-row {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr) auto;
  gap: 16px;
  align-items: start;
  padding: 20px 22px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.device-row:last-child {
  border-bottom: 0;
}
.device-icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 6px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
}
.device-content {
  min-width: 0;
}
.device-heading {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 28px;
}
.device-meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 24px;
  margin: 12px 0 0;
}
.device-meta div {
  min-width: 0;
}
.device-meta dt {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
.device-meta dd {
  margin: 2px 0 0;
  overflow-wrap: anywhere;
  color: var(--el-text-color-primary);
  font-size: 13px;
}
.device-digest-row {
  grid-column: 1 / -1;
}
.device-digest-row dd {
  font-family: monospace;
  font-size: 11px;
}
.device-actions {
  display: flex;
  gap: 8px;
}
@media (max-width: 800px) {
  .device-row {
    grid-template-columns: 40px minmax(0, 1fr);
    padding: 18px 16px;
  }
  .device-actions {
    grid-column: 2;
    flex-wrap: wrap;
  }
  .device-meta {
    grid-template-columns: 1fr;
  }
}
</style>
