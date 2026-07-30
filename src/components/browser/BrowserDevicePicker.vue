<template>
  <el-dialog
    v-model="visible"
    :title="$t('connection.message.selectBrowserDevice')"
    width="min(520px, 94vw)"
    append-to-body
    :close-on-click-modal="false"
    @open="loadDevices"
  >
    <el-alert v-if="loadError" :title="loadError" type="error" :closable="false" show-icon class="mb-4" />
    <p v-if="origins.length" class="browser-policy">
      {{ $t('connection.message.browserAllowedSites') }}: {{ origins.join(', ') }}
    </p>
    <el-alert
      :title="$t('connection.message.browserHighPrivilegeDisclosure')"
      type="warning"
      :closable="false"
      show-icon
      class="mb-4"
    />
    <div v-loading="loading" class="device-list">
      <el-radio-group v-if="devices.length" v-model="selectedId" class="device-options">
        <el-radio
          v-for="device in devices"
          :key="device.id"
          :value="device.id"
          :label="device.id"
          :disabled="!compatible(device)"
          border
          class="device-option"
        >
          <span class="device-name">{{ device.name }}</span>
          <span class="device-meta">{{ device.platform }} · v{{ device.extension_version || '?' }}</span>
          <span class="device-meta">
            {{ $t(device.online ? 'connection.message.browserOnline' : 'connection.message.browserOffline') }} ·
            {{ $t('connection.message.browserActiveSessions', { count: device.active_session_count }) }}
          </span>
          <span class="device-digest">{{ device.wire_contract_digest }}</span>
          <span v-if="!compatible(device)" class="device-missing">{{ incompatibilityText(device) }}</span>
        </el-radio>
      </el-radio-group>
      <el-empty v-else-if="!loading" :description="$t('user.browserDevice.empty')" />
    </div>
    <template #footer>
      <el-button @click="$emit('pair')">{{ $t('user.browserDevice.pairButton') }}</el-button>
      <el-button type="primary" :disabled="!selectedId" :loading="installing" @click="confirm">
        {{ $t('connection.button.connect') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import { ElAlert, ElButton, ElDialog, ElEmpty, ElRadio, ElRadioGroup } from 'element-plus';
import type { IBrowserDevice } from '@/models/browserDevice';
import type { IConnectorConnectionMethod } from '@/operators/connection';
import { browserDeviceOperator } from '@/operators/browserDevice';
import { resolveBrowserDeviceCompatibility } from '@/utils/browserDeviceCompatibility';

export default defineComponent({
  name: 'BrowserDevicePicker',
  components: { ElAlert, ElButton, ElDialog, ElEmpty, ElRadio, ElRadioGroup },
  props: {
    modelValue: { type: Boolean, required: true },
    method: { type: Object as PropType<IConnectorConnectionMethod | null>, default: null },
    installing: { type: Boolean, default: false }
  },
  emits: ['update:modelValue', 'select', 'pair'],
  data() {
    return {
      devices: [] as IBrowserDevice[],
      selectedId: '',
      loading: false,
      loadError: ''
    };
  },
  computed: {
    visible: {
      get(): boolean {
        return this.modelValue;
      },
      set(value: boolean) {
        this.$emit('update:modelValue', value);
      }
    },
    origins(): string[] {
      return this.method?.execution.origins || [];
    },
    requiredCapabilities(): string[] {
      return this.method?.execution.capabilities || [];
    }
  },
  methods: {
    missingCapabilities(device: IBrowserDevice): string[] {
      return resolveBrowserDeviceCompatibility(device, this.requiredCapabilities).missingCapabilities;
    },
    compatible(device: IBrowserDevice): boolean {
      return resolveBrowserDeviceCompatibility(device, this.requiredCapabilities).compatible;
    },
    incompatibilityText(device: IBrowserDevice): string {
      const result = resolveBrowserDeviceCompatibility(device, this.requiredCapabilities);
      if (result.reason === 'missing_capabilities') {
        return this.$t('connection.message.browserMissingCapabilities', {
          capabilities: result.missingCapabilities.join(', ')
        }).toString();
      }
      return this.$t(`connection.message.browserIncompatibility.${result.reason}`).toString();
    },
    async loadDevices(preferredId = '') {
      this.loading = true;
      this.loadError = '';
      try {
        const { data } = await browserDeviceOperator.list();
        this.devices = data.filter((device) => device.status === 'active');
        const compatibleDevices = this.devices.filter(this.compatible);
        if (preferredId && compatibleDevices.some((device) => device.id === preferredId)) {
          this.selectedId = preferredId;
        } else if (compatibleDevices.length === 1) {
          this.selectedId = compatibleDevices[0].id;
        } else if (!compatibleDevices.some((device) => device.id === this.selectedId)) {
          this.selectedId = '';
        }
      } catch {
        this.loadError = this.$t('user.browserDevice.loadFailed').toString();
      } finally {
        this.loading = false;
      }
    },
    async refreshAfterPair(device: IBrowserDevice) {
      this.visible = true;
      await this.loadDevices(device.id);
      const refreshed = this.devices.find((item) => item.id === device.id) || device;
      if (!this.compatible(refreshed)) {
        this.loadError = this.$t('connection.message.browserPairedIncompatible', {
          version: refreshed.extension_version || '?',
          capabilities: this.missingCapabilities(refreshed).join(', ')
        }).toString();
      }
    },
    showInstallError(message: string) {
      this.loadError = message;
    },
    confirm() {
      if (this.selectedId) this.$emit('select', this.selectedId);
    }
  }
});
</script>

<style scoped>
.browser-policy {
  margin: 0 0 16px;
  color: var(--el-text-color-secondary);
  word-break: break-word;
}

.device-list {
  min-height: 128px;
}

.device-options {
  display: grid;
  gap: 10px;
  width: 100%;
}

.device-option {
  width: 100%;
  height: auto;
  min-height: 64px;
  margin: 0;
  padding: 12px;
}

.device-name,
.device-meta,
.device-missing,
.device-digest {
  display: block;
  white-space: normal;
}

.device-name {
  font-weight: 600;
}

.device-meta {
  margin-top: 4px;
  color: var(--el-text-color-secondary);
}

.device-digest {
  margin-top: 4px;
  overflow-wrap: anywhere;
  color: var(--el-text-color-placeholder);
  font-family: monospace;
  font-size: 11px;
}

.device-missing {
  margin-top: 4px;
  color: var(--el-color-danger);
}
</style>
