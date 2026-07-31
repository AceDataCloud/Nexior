<template>
  <el-dialog
    v-model="visible"
    :title="$t('connection.title.browse')"
    width="min(900px, 94vw)"
    top="5vh"
    :close-on-click-modal="false"
    @open="onOpen"
  >
    <p class="browse-intro">{{ $t('connection.message.browseHint') }}</p>

    <div class="browse-toolbar">
      <el-input
        v-model="query"
        class="search-input"
        size="default"
        clearable
        :placeholder="$t('connection.placeholder.search')"
      >
        <template #prefix>
          <search-icon :size="14" aria-hidden="true" focusable="false" />
        </template>
      </el-input>
      <el-select v-model="sort" size="default" class="sort-select" @change="fetchItems">
        <el-option :label="$t('connection.label.featured')" value="popular" />
        <el-option :label="$t('connection.label.new')" value="new" />
        <el-option label="A-Z" value="name" />
      </el-select>
    </div>

    <div v-loading="loading" class="browse-shell">
      <aside class="browse-sidebar">
        <div class="sidebar-section">
          <div
            v-for="opt in sourceOptions"
            :key="opt.key"
            :class="['sidebar-item', { active: source === opt.key }]"
            @click="setSource(opt.key)"
          >
            <span class="sidebar-label">{{ opt.label }}</span>
            <span v-if="opt.count > 0" class="sidebar-count">{{ opt.count }}</span>
          </div>
        </div>
        <div class="sidebar-divider" />
        <div class="sidebar-section">
          <div class="sidebar-heading">{{ $t('connection.field.account') }}</div>
          <div
            v-for="opt in categoryOptions"
            :key="opt.key"
            :class="['sidebar-item', { active: category === opt.key }]"
            @click="setCategory(opt.key)"
          >
            <span class="sidebar-label">{{ opt.label }}</span>
            <span v-if="opt.count > 0" class="sidebar-count">{{ opt.count }}</span>
          </div>
        </div>
      </aside>

      <section class="browse-grid-wrapper">
        <div v-if="!loading && filteredItems.length === 0" class="browse-empty">
          {{ $t('connection.message.browseEmpty') }}
        </div>
        <div v-else class="browse-grid">
          <article v-for="item in filteredItems" :key="item.id" class="card">
            <div class="card-head">
              <span class="card-icon">
                <img v-if="item.icon_url" :src="item.icon_url" :alt="item.name" />
                <connection-icon v-else :size="16" aria-hidden="true" focusable="false" />
              </span>
              <div class="card-title-block">
                <div class="card-title-row">
                  <h4 class="card-title">{{ item.name }}</h4>
                </div>
                <div class="card-meta">
                  <span
                    v-if="item.is_featured"
                    class="card-pill card-pill-featured"
                    :title="$t('connection.label.featured')"
                  >
                    {{ $t('connection.label.featured') }}
                  </span>
                  <span v-else-if="item.is_new" class="card-pill card-pill-new">
                    {{ $t('connection.label.new') }}
                  </span>
                  <span v-else-if="item.is_trending" class="card-pill card-pill-trending">
                    {{ $t('connection.label.trending') }}
                  </span>
                  <span :class="['source-badge', `source-${item.source}`]">{{ sourceLabel(item.source) }}</span>
                  <span v-if="item.publisher" class="card-publisher">{{ item.publisher }}</span>
                </div>
              </div>
              <el-tooltip
                v-if="!item.installed"
                :disabled="item.installable"
                :content="$t('skill.menu.soon')"
                placement="top"
              >
                <!-- Wrapper span: native disabled buttons swallow hover
                     events, so the tooltip must attach to an enabled
                     element. -->
                <span class="card-action-slot">
                  <button
                    type="button"
                    class="card-action card-action-add"
                    :disabled="!item.installable || installingId === item.id"
                    @click="onInstall(item)"
                  >
                    <loading-icon
                      v-if="installingId === item.id"
                      class="icon-spin"
                      :size="16"
                      aria-hidden="true"
                      focusable="false"
                    />
                    <add-icon v-else :size="16" aria-hidden="true" focusable="false" />
                    <span class="ml-1">{{ $t('connection.button.install') }}</span>
                  </button>
                </span>
              </el-tooltip>
              <el-dropdown
                v-else
                trigger="click"
                placement="bottom-end"
                popper-class="connection-actions-popper"
                @command="(command: string) => onInstalledCommand(command, item)"
              >
                <button
                  type="button"
                  class="card-action card-action-installed"
                  :aria-label="accountLabel(item)"
                  :title="accountLabel(item)"
                >
                  <success-icon :size="16" aria-hidden="true" focusable="false" />
                  <span class="ml-1 card-action-count">{{ accountCount(item) }}</span>
                  <expand-down-icon class="ml-1 card-action-caret" :size="12" aria-hidden="true" focusable="false" />
                </button>
                <template #dropdown>
                  <el-dropdown-menu class="connection-actions-menu">
                    <el-dropdown-item command="addAccount" :disabled="!item.installable">
                      {{ $t('connection.button.addAccount') }}
                    </el-dropdown-item>
                    <el-dropdown-item command="manage">
                      {{ $t('connection.button.manageAccounts') }}
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
            <p v-if="item.short_description || item.description" class="card-description">
              {{ item.short_description || item.description }}
            </p>
          </article>
        </div>
      </section>
    </div>
    <connector-method-picker v-model="pickerVisible" :item="pickerItem" @select="onMethodSelected" />
    <browser-pairing-dialog v-model="pairingDialogVisible" @paired="onBrowserPaired" />
    <browser-device-picker
      ref="browserDevicePicker"
      v-model="browserDevicePickerVisible"
      :method="browserDialogMethod"
      :installing="browserInstalling"
      @pair="openBrowserPairing"
      @select="onBrowserDeviceSelected"
    />
    <byoc-credentials-dialog
      v-model="byocDialogVisible"
      :item="byocDialogItem"
      :method="byocDialogMethod"
      @installed="onByocInstalled"
    />
  </el-dialog>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import {
  ElDialog,
  ElInput,
  ElSelect,
  ElOption,
  ElMessage,
  ElTooltip,
  ElDropdown,
  ElDropdownMenu,
  ElDropdownItem
} from 'element-plus';
import {
  AddIcon,
  ConnectionIcon,
  ExpandDownIcon,
  LoadingIcon,
  SearchIcon,
  SuccessIcon
} from '@acedatacloud/core/icons/components';
import {
  ConnectorSource,
  IConnectorConnectionMethod,
  IConnectorCatalogItem,
  IConnectorCatalogListQuery,
  connectionOperator,
  getConnectorMethods,
  resolveConnectorMethod
} from '@/operators/connection';
import ByocCredentialsDialog from '@/components/connections/ByocCredentialsDialog.vue';
import ConnectorMethodPicker from '@/components/connections/ConnectorMethodPicker.vue';
import BrowserPairingDialog from '@/components/browser/BrowserPairingDialog.vue';
import BrowserDevicePicker from '@/components/browser/BrowserDevicePicker.vue';
import type { IBrowserDevice } from '@/models/browserDevice';
import { popupReturnUrl } from '@/utils/connections/authorizePopup';
import { openAuthorizeFlow } from '@/utils/connections/authorizeFlow';

interface ISourceOption {
  key: 'all' | ConnectorSource | 'featured';
  label: string;
  count: number;
}

interface ICategoryOption {
  key: string; // empty string => "all"
  label: string;
  count: number;
}

interface IData {
  visible: boolean;
  loading: boolean;
  installingId: string | null;
  query: string;
  source: 'all' | ConnectorSource | 'featured';
  category: string;
  sort: 'popular' | 'new' | 'name';
  items: IConnectorCatalogItem[];
  facets: Array<{ source: ConnectorSource; category: string; count: number }>;
  byocDialogVisible: boolean;
  byocDialogItem: IConnectorCatalogItem | null;
  byocDialogMethod: IConnectorConnectionMethod | null;
  pickerVisible: boolean;
  pickerItem: IConnectorCatalogItem | null;
  pairingDialogVisible: boolean;
  browserDevicePickerVisible: boolean;
  browserDialogItem: IConnectorCatalogItem | null;
  browserDialogMethod: IConnectorConnectionMethod | null;
  browserInstalling: boolean;
}

function normalizeConnectorSearchText(value: unknown): string {
  return String(value ?? '')
    .normalize('NFKC')
    .trim()
    .toLowerCase();
}

function buildConnectorSearchText(item: IConnectorCatalogItem): string {
  const parts: unknown[] = [
    item.name,
    item.identifier,
    item.namespace,
    item.slug,
    item.short_description,
    item.description,
    item.publisher,
    item.category,
    item.acedata_service_alias,
    ...(Array.isArray(item.tags) ? item.tags : [])
  ];
  for (const permission of item.permissions || []) {
    parts.push(permission.id, permission.label, permission.desc);
  }
  for (const method of getConnectorMethods(item)) {
    parts.push(
      method.id,
      method.label,
      method.execution.type,
      method.execution.server_url,
      method.credential.type,
      method.credential.provider_id
    );
    for (const permission of method.permissions || []) {
      parts.push(permission.id, permission.label, permission.desc);
    }
  }
  return parts.map(normalizeConnectorSearchText).filter(Boolean).join(' ');
}

export default defineComponent({
  name: 'BrowseConnectors',
  components: {
    ElDialog,
    ElInput,
    ElSelect,
    ElOption,
    ElTooltip,
    ElDropdown,
    ElDropdownMenu,
    ElDropdownItem,
    AddIcon,
    ConnectionIcon,
    ExpandDownIcon,
    LoadingIcon,
    SearchIcon,
    SuccessIcon,
    ByocCredentialsDialog,
    ConnectorMethodPicker,
    BrowserPairingDialog,
    BrowserDevicePicker
  },
  props: {
    modelValue: {
      type: Boolean as PropType<boolean>,
      default: false
    }
  },
  emits: ['update:modelValue', 'installed', 'add-account', 'manage'],
  data(): IData {
    return {
      visible: this.modelValue,
      loading: false,
      installingId: null,
      query: '',
      source: 'all',
      category: '',
      sort: 'popular',
      items: [],
      facets: [],
      byocDialogVisible: false,
      byocDialogItem: null,
      byocDialogMethod: null,
      pickerVisible: false,
      pickerItem: null,
      pairingDialogVisible: false,
      browserDevicePickerVisible: false,
      browserDialogItem: null,
      browserDialogMethod: null,
      browserInstalling: false
    };
  },
  computed: {
    sourceOptions(): ISourceOption[] {
      const totalAll = this.facets.reduce((acc, f) => acc + f.count, 0);
      const totals: Record<ConnectorSource, number> = {
        official: 0,
        partner: 0,
        public: 0
      };
      for (const f of this.facets) {
        totals[f.source] = (totals[f.source] || 0) + f.count;
      }
      return [
        { key: 'all', label: String(this.$t('connection.label.all')), count: totalAll },
        { key: 'official', label: String(this.$t('connection.label.official')), count: totals.official },
        { key: 'partner', label: String(this.$t('connection.label.partner')), count: totals.partner },
        { key: 'public', label: String(this.$t('connection.label.community')), count: totals.public }
      ];
    },
    categoryOptions(): ICategoryOption[] {
      // Aggregate facet counts by category, filtered by current source.
      const counts: Record<string, number> = {};
      for (const f of this.facets) {
        if (this.source !== 'all' && this.source !== 'featured' && f.source !== this.source) continue;
        const key = f.category || 'uncategorized';
        counts[key] = (counts[key] || 0) + f.count;
      }
      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      const result: ICategoryOption[] = [{ key: '', label: String(this.$t('connection.category.all')), count: total }];
      for (const [key, count] of Object.entries(counts)) {
        if (count <= 0) continue;
        const labelKey = `connection.category.${key}`;
        const translated = String(this.$t(labelKey));
        result.push({
          key,
          label: translated === labelKey ? key : translated,
          count
        });
      }
      return result;
    },
    filteredItems(): IConnectorCatalogItem[] {
      const q = normalizeConnectorSearchText(this.query);
      let items = this.items;
      if (q) {
        items = items.filter((it) => buildConnectorSearchText(it).includes(q));
      }
      // Source filter is enforced client-side as well (cheap; also runs without
      // a network round-trip when toggling).
      if (this.source !== 'all' && this.source !== 'featured') {
        items = items.filter((it) => it.source === this.source);
      }
      if (this.source === 'featured') {
        items = items.filter((it) => it.is_featured);
      }
      if (this.category) {
        items = items.filter((it) => (it.category || 'uncategorized') === this.category);
      }
      return items;
    }
  },
  watch: {
    modelValue(val: boolean) {
      this.visible = val;
    },
    visible(val: boolean) {
      this.$emit('update:modelValue', val);
    }
  },
  methods: {
    onOpen() {
      this.fetchItems();
      this.fetchFacets();
    },
    /** Account count for the badge. An older backend omits the field, so a
     *  connector that reports installed but no count reads as exactly 1. The
     *  badge only renders when ``installed``, so never let it show 0 — the
     *  backend derives ``installed = count > 0`` and can't disagree, but a
     *  stale local flip could. */
    accountCount(item: IConnectorCatalogItem): number {
      const count = typeof item.account_count === 'number' ? item.account_count : 0;
      return item.installed ? Math.max(1, count) : count;
    },
    /** Accessible name / tooltip for the badge. The visible badge is just the
     *  number — spelling out "N accounts" there would need per-language plural
     *  forms (Slavic languages have three), and the card has no room for the
     *  longest ones. This carries the meaning instead, phrased so no word has
     *  to agree with the count. */
    accountLabel(item: IConnectorCatalogItem): string {
      return String(
        this.$t('connection.message.connectedAccounts', {
          name: item.name,
          count: this.accountCount(item)
        })
      );
    },
    /** Flip one card to connected without a refetch round-trip.
     *  Only ever a first install: "add account" leaves this dialog entirely
     *  (the parent closes it and drives the connect flow), so the count this
     *  bumps is always 0 → 1. */
    markInstalled(itemId: string) {
      this.items = this.items.map((it) =>
        it.id === itemId
          ? {
              ...it,
              installed: true,
              install_count: it.install_count + 1,
              account_count: this.accountCount(it) + 1
            }
          : it
      );
    },
    onInstalledCommand(command: string, item: IConnectorCatalogItem) {
      if (command === 'addAccount') {
        if (!item.installable) return;
        this.$emit('add-account', { item });
        return;
      }
      if (command === 'manage') {
        this.$emit('manage', { item });
      }
    },
    sourceLabel(src: ConnectorSource): string {
      switch (src) {
        case 'official':
          return String(this.$t('connection.label.official'));
        case 'partner':
          return String(this.$t('connection.label.partner'));
        case 'public':
          return String(this.$t('connection.label.community'));
        default:
          return src;
      }
    },
    setSource(key: 'all' | ConnectorSource | 'featured') {
      this.source = key;
      this.fetchItems();
    },
    setCategory(key: string) {
      this.category = key;
      this.fetchItems();
    },
    async fetchItems() {
      this.loading = true;
      try {
        // Fetch a generously large page; the catalog is small (tens of items).
        const params: IConnectorCatalogListQuery = { sort: this.sort, limit: 200 };
        if (this.source !== 'all' && this.source !== 'featured') {
          params.source = this.source;
        }
        if (this.source === 'featured') {
          params.featured = true;
        }
        if (this.category) {
          params.category = this.category;
        }
        const { data } = await connectionOperator.listCatalog(params);
        this.items = data.items || [];
      } catch (error: any) {
        ElMessage.error(error?.response?.data?.detail || error?.message || 'Failed to load directory');
      } finally {
        this.loading = false;
      }
    },
    async fetchFacets() {
      try {
        const { data } = await connectionOperator.catalogCategories();
        this.facets = data.facets || [];
      } catch {
        // Non-fatal: sidebar counts just won't render.
        this.facets = [];
      }
    },
    async onInstall(item: IConnectorCatalogItem) {
      if (!item.installable) return;
      // Multi-method connectors: let the user choose how to connect
      // first. Single-method connectors skip the picker and install
      // straight through, exactly as before.
      if (getConnectorMethods(item).length > 1) {
        this.pickerItem = item;
        this.pickerVisible = true;
        return;
      }
      const method = resolveConnectorMethod(item);
      if (!method) return;
      await this.installWithMethod(item, method);
    },
    onMethodSelected(payload: { item: IConnectorCatalogItem; method: IConnectorConnectionMethod }) {
      this.pickerVisible = false;
      this.installWithMethod(payload.item, payload.method);
    },
    async installWithMethod(item: IConnectorCatalogItem, method: IConnectorConnectionMethod) {
      if (method.execution.type === 'browser_device') {
        this.browserDialogItem = item;
        this.browserDialogMethod = method;
        this.browserDevicePickerVisible = true;
        return;
      }
      // BYOC methods collect credentials inline — no upstream redirect,
      // so open the credential dialog directly with the chosen method
      // (its schema / cookie domains / login url drive the dialog).
      if (method.credential.type === 'user_secret' || method.credential.type === 'cookie_jar') {
        this.byocDialogItem = item;
        this.byocDialogMethod = method;
        this.byocDialogVisible = true;
        return;
      }
      this.installingId = item.id;
      try {
        const { data } = await connectionOperator.installFromCatalog(item.id, {
          return_url: popupReturnUrl(),
          method_id: method.id
        });
        if (data.type === 'redirect') {
          // Popup (web) / in-app browser (native) / system browser (desktop)
          // all keep this dialog and the page behind it alive.
          await openAuthorizeFlow(data.authorization_url);
          this.$emit('installed');
          await this.fetchItems();
          return;
        }
        if (data.type === 'form') {
          // Defensive: an OAuth/public method shouldn't return a form,
          // but if it does, fall back to the credential dialog.
          this.byocDialogItem = item;
          this.byocDialogMethod = method;
          this.byocDialogVisible = true;
          return;
        }
        // Zero-step success (public): flip card to "Connected"
        // locally so the UI reflects the change without a refetch round-trip,
        // bump the parent so its connections list refreshes.
        this.markInstalled(item.id);
        ElMessage.success(this.$t('connection.message.installed', { name: item.name }) as string);
        this.$emit('installed', { item, connection_id: data.connection_id });
      } catch (error: any) {
        ElMessage.error(
          error?.message === 'desktop-authorize-unsupported'
            ? (this.$t('connection.message.desktopUpdateRequired') as string)
            : error?.response?.data?.detail || this.$t('connection.message.installFailed')
        );
      } finally {
        this.installingId = null;
      }
    },
    onByocInstalled(payload: { item: IConnectorCatalogItem; connection_id: string }) {
      // Mirror the zero-step success path: flip the card without
      // refetching, bubble up so the parent's connections list refreshes.
      this.markInstalled(payload.item.id);
      this.$emit('installed', payload);
    },
    openBrowserPairing() {
      this.browserDevicePickerVisible = false;
      this.pairingDialogVisible = true;
    },
    async onBrowserPaired(device: IBrowserDevice) {
      this.pairingDialogVisible = false;
      const picker = this.$refs.browserDevicePicker as InstanceType<typeof BrowserDevicePicker> | undefined;
      await picker?.refreshAfterPair(device);
    },
    async onBrowserDeviceSelected(browserDeviceId: string) {
      const item = this.browserDialogItem;
      const method = this.browserDialogMethod;
      if (!item || !method) return;
      this.browserInstalling = true;
      this.installingId = item.id;
      try {
        const { data } = await connectionOperator.installFromCatalog(item.id, {
          return_url: popupReturnUrl(),
          method_id: method.id,
          browser_device_id: browserDeviceId
        });
        if (data.type !== 'active') {
          throw new Error(this.$t('connection.message.installFailed') as string);
        }
        this.browserDevicePickerVisible = false;
        this.browserDialogItem = null;
        this.browserDialogMethod = null;
        this.markInstalled(item.id);
        ElMessage.success(this.$t('connection.message.installed', { name: item.name }) as string);
        this.$emit('installed', { item, connection_id: data.connection_id });
      } catch (error: any) {
        const message = error?.response?.data?.detail || error?.message || this.$t('connection.message.installFailed');
        const picker = this.$refs.browserDevicePicker as InstanceType<typeof BrowserDevicePicker> | undefined;
        picker?.showInstallError(String(message));
      } finally {
        this.browserInstalling = false;
        this.installingId = null;
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.browse-intro {
  margin: 0 0 14px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.browse-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

// Styling comes from the global `.el-input__wrapper` rules in _common.scss,
// so the field matches every other input in the console.
.search-input {
  flex: 1 1 auto;
}

.sort-select {
  width: 140px;
  flex-shrink: 0;
}

.browse-shell {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 16px;
  min-height: 420px;
}

.browse-sidebar {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 0;
  border-right: 1px solid var(--el-border-color-lighter);
  padding-right: 8px;
}

.sidebar-section {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sidebar-divider {
  height: 1px;
  background: var(--el-border-color-lighter);
  margin: 6px 0;
}

.sidebar-heading {
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--el-text-color-placeholder);
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  color: var(--el-text-color-primary);
  transition: background 0.1s;
  user-select: none;

  &:hover {
    background: var(--el-fill-color-light);
  }

  &.active {
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
    font-weight: 500;
  }
}

.sidebar-label {
  flex: 1 1 auto;
}

.sidebar-count {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  font-variant-numeric: tabular-nums;
}

.browse-grid-wrapper {
  min-height: 0;
  max-height: 60vh;
  overflow-y: auto;
  padding: 0 4px 4px;
}

.browse-empty {
  padding: 60px 20px;
  text-align: center;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.browse-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px;
  // Global tokens. `--el-card-*` is scoped inside Element Plus's `.el-card`
  // rule, so a non-card element never inherits it and falls back to a square
  // border-radius and `currentColor` border.
  border: 1px solid var(--app-border-subtle);
  border-radius: var(--adc-radius-control);
  background: var(--el-card-bg-color);
  transition:
    border-color 0.1s,
    box-shadow 0.1s;

  &:hover {
    border-color: var(--el-border-color);
    // A literal black shadow is invisible on the dark background; the token
    // adapts.
    box-shadow: var(--app-shadow-sm);
  }
}

.card-head {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr) auto;
  align-items: flex-start;
  gap: 12px;
}

.card-icon {
  flex: 0 0 auto;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: var(--el-fill-color-light);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  font-size: 18px;
  color: var(--el-text-color-placeholder);

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}

.card-title-block {
  flex: 1 1 auto;
  min-width: 0;
}

.card-title-row {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.card-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.35;
  color: var(--el-text-color-primary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  overflow-wrap: anywhere;
}

.card-pill {
  flex-shrink: 0;
  font-size: 10px;
  font-weight: 500;
  padding: 1px 6px;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  line-height: 1.6;
}

.card-pill-featured {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.card-pill-new {
  background: var(--el-color-success-light-9);
  color: var(--el-color-success);
}

.card-pill-trending {
  background: var(--el-color-warning-light-9);
  color: var(--el-color-warning);
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.source-badge {
  font-size: 10px;
  font-weight: 500;
  padding: 1px 6px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  line-height: 1.6;

  &.source-official {
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
  }

  &.source-partner {
    background: var(--el-fill-color);
    color: var(--el-text-color-secondary);
  }

  &.source-public {
    background: var(--el-fill-color);
    color: var(--el-text-color-secondary);
  }
}

.card-publisher {
  min-width: 0;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-action-slot {
  // Tooltip trigger wrapper around the (possibly disabled) install
  // button — keep it sized like the button so the card layout is
  // unchanged.
  flex-shrink: 0;
  display: inline-flex;
}

.card-action {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  transition:
    background 0.15s,
    border-color 0.15s;
}

.card-action-add {
  border-color: var(--el-border-color);
  color: var(--el-text-color-primary);

  &:hover:not(:disabled) {
    border-color: var(--el-color-primary);
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
}

.card-action-installed {
  color: var(--el-color-success);
  background: var(--el-color-success-light-9);
  // Was a dead <span>; it is now the entry point for "add another account"
  // and "manage", so it has to read as pressable.
  cursor: pointer;

  &:hover {
    border-color: var(--el-color-success-light-5);
    background: var(--el-color-success-light-8);
  }

  // It became keyboard-reachable when it stopped being a <span>, and the
  // custom border/background makes the UA default outline hard to see.
  &:focus-visible {
    outline: 2px solid var(--el-color-success);
    outline-offset: 1px;
  }
}

.card-action-count {
  font-variant-numeric: tabular-nums;
}

.card-action-caret {
  opacity: 0.7;
}

.icon-spin {
  animation: adc-icon-spin 1s linear infinite;
}

@keyframes adc-icon-spin {
  to {
    transform: rotate(360deg);
  }
}

.card-description {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
