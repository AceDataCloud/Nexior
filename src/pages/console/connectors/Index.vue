<template>
  <div class="connectors-page">
    <console-page-header
      :title="$t('connection.title.connections')"
      :subtitle="$t('connection.message.pageDescription')"
    />
    <div class="connectors-shell">
      <!-- Left pane -->
      <aside class="connectors-list">
        <div class="list-toolbar">
          <el-input
            v-model="searchQuery"
            class="search-input"
            size="default"
            clearable
            :placeholder="$t('connection.placeholder.search')"
          >
            <template #prefix>
              <search-icon :size="14" aria-hidden="true" focusable="false" />
            </template>
          </el-input>
          <el-dropdown trigger="click" placement="bottom-end" @command="onAddCommand">
            <button
              type="button"
              class="add-button"
              :aria-label="$t('connection.title.addCustomConnector')"
              :title="$t('connection.title.addCustomConnector')"
            >
              <add-icon :size="16" aria-hidden="true" focusable="false" />
            </button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="browse">
                  <search-icon class="mr-2" :size="16" aria-hidden="true" focusable="false" />
                  {{ $t('connection.title.browse') }}
                </el-dropdown-item>
                <el-dropdown-item command="custom">
                  <add-icon class="mr-2" :size="16" aria-hidden="true" focusable="false" />
                  {{ $t('connection.button.addCustomConnector') }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>

        <div v-loading="firstLoadComplete && (loading || loadingCatalog)" class="list-scroll">
          <!-- Initial load: render skeleton rows so the list does not flash
               raw provider names ("google", "microsoft") with the fallback
               plug icon while the localized catalog is still in flight.
               The <el-skeleton animated> wrapper is load-bearing — the shimmer
               is keyed off `.el-skeleton.is-animated .el-skeleton__item`, so
               bare items render as flat grey blocks. -->
          <template v-if="!firstLoadComplete">
            <el-skeleton animated>
              <template #template>
                <div class="list-group">
                  <div class="group-header skeleton-header">
                    <el-skeleton-item variant="text" style="width: 100px; height: 11px" />
                  </div>
                  <ul class="group-items">
                    <li v-for="i in 5" :key="`skeleton-${i}`" class="list-item skeleton-item">
                      <el-skeleton-item variant="image" style="width: 20px; height: 20px; border-radius: 4px" />
                      <el-skeleton-item variant="text" style="flex: 1 1 auto; height: 14px" />
                    </li>
                  </ul>
                </div>
              </template>
            </el-skeleton>
          </template>
          <template v-else-if="filteredGroups.length">
            <div v-for="group in filteredGroups" :key="group.key" class="list-group">
              <div class="group-header">
                <button
                  type="button"
                  class="group-chevron-button"
                  :aria-label="$t(group.collapsed ? 'common.button.expand' : 'common.button.collapse')"
                  :title="$t(group.collapsed ? 'common.button.expand' : 'common.button.collapse')"
                  @click="toggleGroup(group.key)"
                >
                  <expand-right-icon
                    v-if="group.collapsed"
                    class="group-chevron"
                    :size="14"
                    aria-hidden="true"
                    focusable="false"
                  />
                  <expand-down-icon v-else class="group-chevron" :size="14" aria-hidden="true" focusable="false" />
                </button>
                <span class="group-title" @click="toggleGroup(group.key)">{{ group.label }}</span>
              </div>
              <ul v-show="!group.collapsed" class="group-items">
                <li
                  v-for="item in group.items"
                  :key="item.key"
                  :class="{ 'list-item': true, active: selectedKey === item.key }"
                  @click="onSelect(item)"
                >
                  <span class="list-item-icon">
                    <img v-if="item.faviconUrl" :src="item.faviconUrl" :alt="item.name" @error="onFaviconError(item)" />
                    <desktop-icon v-else-if="item.browserSession" :size="16" aria-hidden="true" focusable="false" />
                    <connection-icon v-else :size="16" aria-hidden="true" focusable="false" />
                  </span>
                  <span class="list-item-name">{{ item.name }}</span>
                  <span v-if="item.accountLabel" class="list-item-account" :title="item.accountLabel">{{
                    item.accountLabel
                  }}</span>
                  <span v-if="item.isDefault" class="list-item-badge list-item-badge-default">{{
                    $t('connection.label.defaultAccount')
                  }}</span>
                  <span v-if="item.byo" class="list-item-badge">{{ $t('connection.label.custom') }}</span>
                  <span
                    v-else-if="group.key === 'available'"
                    class="list-item-badge list-item-badge-hint"
                    :title="$t('connection.message.notConnectedYet')"
                  >
                    {{ $t('connection.label.notConnected') }}
                  </span>
                </li>
              </ul>
            </div>
          </template>
          <div v-else class="list-empty">
            {{ searchQuery ? $t('connection.message.noMatch') : $t('connection.message.noConnections') }}
          </div>
        </div>
        <div class="list-footer">
          <button type="button" class="browse-all-button" @click="browseDialogVisible = true">
            <search-icon class="mr-1" :size="16" aria-hidden="true" focusable="false" />
            {{ $t('connection.button.browseAll') }}
          </button>
        </div>
      </aside>

      <!-- Right pane -->
      <section class="connectors-detail">
        <!-- Initial load: keep the right pane quiet too so we don't flash
             a "select a connector" empty state before the list resolves. -->
        <div v-if="!firstLoadComplete" class="detail-skeleton">
          <el-skeleton animated>
            <template #template>
              <div class="detail-skeleton-header">
                <el-skeleton-item variant="circle" style="width: 32px; height: 32px" />
                <el-skeleton-item variant="h3" style="width: 220px; height: 22px; margin-left: 12px" />
              </div>
              <el-skeleton-item variant="text" style="width: 60%; height: 12px; margin-top: 12px" />
              <div class="detail-skeleton-section">
                <el-skeleton-item variant="text" style="width: 140px; height: 14px" />
                <!-- 5 lines, matching what <el-skeleton :rows="4"> used to
                     render (1 "first" + 4 paragraphs) so the pane doesn't
                     jump in height when the real content lands. -->
                <el-skeleton-item variant="p" style="width: 33%; margin-top: 16px" />
                <el-skeleton-item variant="p" style="margin-top: 16px" />
                <el-skeleton-item variant="p" style="margin-top: 16px" />
                <el-skeleton-item variant="p" style="margin-top: 16px" />
                <el-skeleton-item variant="p" style="width: 61%; margin-top: 16px" />
              </div>
            </template>
          </el-skeleton>
        </div>

        <div v-else-if="!selectedItem" class="detail-empty">
          <connection-icon class="detail-empty-icon" size="1em" aria-hidden="true" focusable="false" />
          <p class="detail-empty-title">{{ $t('connection.message.selectConnector') }}</p>
          <p class="detail-empty-hint">{{ $t('connection.message.noConnectionsHint') }}</p>
        </div>

        <template v-if="firstLoadComplete && selectedItem">
          <header class="detail-header">
            <div class="detail-title-row">
              <span class="detail-icon">
                <img
                  v-if="selectedItem.faviconUrl"
                  :src="selectedItem.faviconUrl"
                  :alt="selectedItem.name"
                  @error="onFaviconError(selectedItem!)"
                />
                <desktop-icon v-else-if="selectedItem.browserSession" :size="20" aria-hidden="true" focusable="false" />
                <connection-icon v-else :size="20" aria-hidden="true" focusable="false" />
              </span>
              <h3 class="detail-title">{{ selectedItem.name }}</h3>
              <el-tag v-if="selectedItem.byo" size="small" type="info" class="detail-custom-tag">
                {{ $t('connection.label.custom') }}
              </el-tag>
              <div class="detail-actions">
                <!-- Primary action stays in the open; everything else lives in
                     the overflow menu. Eight buttons could surface at once,
                     which crowded the header and buried Disconnect. -->
                <el-button
                  v-if="!selectedItem.connection && selectedItem.catalog"
                  type="primary"
                  size="small"
                  :disabled="!selectedItem.catalog?.installable"
                  @click="selectedItem!.catalog && onConnect(selectedItem!.catalog)"
                >
                  {{ $t('connection.button.connect') }}
                </el-button>
                <el-dropdown
                  v-if="selectedItem.connection && detailActions.length"
                  trigger="click"
                  placement="bottom-end"
                  popper-class="connection-actions-popper"
                  @command="onDetailAction"
                >
                  <button
                    type="button"
                    class="actions-button"
                    :aria-label="$t('connection.title.actions')"
                    :title="$t('connection.title.actions')"
                  >
                    <more-icon :size="16" aria-hidden="true" focusable="false" />
                  </button>
                  <template #dropdown>
                    <el-dropdown-menu class="connection-actions-menu">
                      <el-dropdown-item
                        v-for="action in detailActions"
                        :key="action.command"
                        :command="action.command"
                        :disabled="action.disabled"
                        :divided="action.divided"
                        :class="{ 'actions-item-danger': action.danger }"
                      >
                        {{ action.label }}
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>

            <p v-if="selectedItem.serverUrl" class="detail-server-url">{{ selectedItem.serverUrl }}</p>
            <p v-else-if="selectedItem.description" class="detail-description">{{ selectedItem.description }}</p>
          </header>

          <!-- Overview: the connector's long-form description. Rendered for
               every connector that ships one, but it earns its keep on the
               *unconnected* rows: there's no live tools/list yet, so this
               prose (which enumerates the tools/capabilities) is the only
               thing standing between the user and an empty pane. -->
          <div v-if="overviewText" class="detail-section">
            <div class="section-heading">
              <span class="section-title">{{ $t('connection.title.overview') }}</span>
            </div>
            <p class="overview-text">{{ overviewText }}</p>
          </div>

          <!-- Connected: account info -->
          <div v-if="selectedItem!.connection && !selectedItem.custom && showsAccountIdentity" class="detail-section">
            <div class="account-row">
              <el-avatar
                v-if="connectionAvatar(selectedItem.connection)"
                :src="connectionAvatar(selectedItem.connection)"
                :size="40"
              />
              <el-avatar v-else :size="40" class="account-avatar-fallback">
                {{ connectionAccountInitial(selectedItem.connection) }}
              </el-avatar>
              <div class="account-info">
                <span class="account-name">{{ connectionAccountName(selectedItem.connection) }}</span>
                <span v-if="connectionAccountSubtext(selectedItem.connection)" class="account-sub">
                  {{ connectionAccountSubtext(selectedItem.connection) }}
                </span>
              </div>
              <el-tag :type="statusTagType(selectedItem.connection.status)" size="small">
                {{ statusLabel(selectedItem.connection.status) }}
              </el-tag>
            </div>
          </div>

          <div v-if="selectedItem!.connection && selectedItem.browserSession" class="detail-section browser-session">
            <div class="browser-session-heading">
              <span class="browser-session-icon">
                <desktop-icon size="1em" aria-hidden="true" focusable="false" />
              </span>
              <div class="browser-session-copy">
                <strong>{{ selectedItem.connection.browser_device?.name || $t('user.browserDevice.title') }}</strong>
                <span>{{ $t('user.browserDevice.localApprovalOnly') }}</span>
              </div>
              <el-tag :type="browserDeviceStatusTagType(selectedItem.connection)" size="small">
                {{ browserDeviceCompatibilityLabel(selectedItem.connection) }}
              </el-tag>
            </div>
            <dl class="meta-grid browser-session-meta">
              <div>
                <dt>{{ $t('user.browserDevice.platform') }}</dt>
                <dd>{{ selectedItem.connection.browser_device?.platform || '—' }}</dd>
              </div>
              <div>
                <dt>{{ $t('user.browserDevice.extensionVersion') }}</dt>
                <dd>{{ selectedItem.connection.browser_device?.extension_version || '—' }}</dd>
              </div>
              <div>
                <dt>{{ $t('user.browserDevice.lastSeen') }}</dt>
                <dd>
                  <span v-if="selectedItem.connection.browser_device?.last_seen_at">
                    {{ $dayjs.format(selectedItem.connection.browser_device.last_seen_at) }}
                  </span>
                  <span v-else class="muted">{{ $t('user.browserDevice.neverSeen') }}</span>
                </dd>
              </div>
              <div>
                <dt>{{ $t('connection.field.createdAt') }}</dt>
                <dd>
                  {{
                    $dayjs.format(
                      selectedItem.connection.browser_device?.created_at || selectedItem.connection.created_at
                    )
                  }}
                </dd>
              </div>
              <div>
                <dt>{{ $t('connection.field.connectionRevision') }}</dt>
                <dd>{{ selectedItem.connection.revision }}</dd>
              </div>
              <div>
                <dt>{{ $t('connection.field.activeSessions') }}</dt>
                <dd>{{ selectedItem.connection.browser_device?.active_session_count ?? 0 }}</dd>
              </div>
              <div class="browser-digest-row">
                <dt>{{ $t('connection.field.wireContractDigest') }}</dt>
                <dd>{{ selectedItem.connection.browser_device?.wire_contract_digest || '—' }}</dd>
              </div>
            </dl>
            <div v-if="selectedItem.connection.browser_device?.capabilities?.length" class="browser-capabilities">
              <span class="browser-capabilities-label">{{ $t('user.browserDevice.capabilities') }}</span>
              <div class="browser-capability-list">
                <el-tag
                  v-for="capability in selectedItem.connection.browser_device.capabilities"
                  :key="capability"
                  size="small"
                  effect="plain"
                >
                  {{ capability.replaceAll('_', ' ') }}
                </el-tag>
              </div>
            </div>
          </div>

          <!-- Connected custom (MCP): meta -->
          <div v-if="selectedItem!.connection && selectedItem.custom" class="detail-section">
            <dl class="meta-grid">
              <div>
                <dt>{{ $t('connection.field.status') }}</dt>
                <dd>
                  <el-tag :type="statusTagType(selectedItem.connection.status)" size="small">
                    {{ statusLabel(selectedItem.connection.status) }}
                  </el-tag>
                </dd>
              </div>
              <div v-if="customAuthSummary(selectedItem.connection)">
                <dt>{{ $t('connection.label.authMethod') }}</dt>
                <dd>{{ customAuthSummary(selectedItem.connection) }}</dd>
              </div>
            </dl>
          </div>

          <!-- Connected BYOC: the credential meta grid. Its status tag is
               dropped when the identity card above already carries one —
               cookie connectors that resolve an account render both. -->
          <div v-if="selectedItem!.connection && selectedItem.byoc" class="detail-section">
            <dl class="meta-grid">
              <div v-if="!showsAccountIdentity">
                <dt>{{ $t('connection.field.status') }}</dt>
                <dd>
                  <el-tag :type="statusTagType(selectedItem.connection.status)" size="small">
                    {{ statusLabel(selectedItem.connection.status) }}
                  </el-tag>
                </dd>
              </div>
              <div v-if="byocCredentialSummary(selectedItem)">
                <dt>{{ $t('connection.label.credentials') }}</dt>
                <dd>{{ byocCredentialSummary(selectedItem) }}</dd>
              </div>
            </dl>
          </div>

          <!-- "Try It" — server-curated suggested chat prompts that
               deep-link to Studio. Shown as soon as the connector's
               catalog manifest carries any, even before the user
               connects: on an unconnected row the prompts render locked
               (non-interactive) with a hover tooltip nudging the user to
               connect first. Prompts are pre-localized server-side; no
               client-side i18n table for the prompt text. -->
          <div v-if="suggestions.length" class="detail-section">
            <div class="section-heading">
              <span class="section-title">{{ $t('connection.title.tryIt') }}</span>
              <span class="section-count">{{ suggestions.length }}</span>
            </div>
            <p class="section-hint">
              {{ suggestionsLocked ? $t('connection.message.tryItConnectFirst') : $t('connection.message.tryItHint') }}
            </p>
            <ul class="suggestion-list">
              <el-tooltip
                v-for="s in suggestions"
                :key="s.id"
                :content="$t('connection.message.tryItConnectFirst')"
                :disabled="!suggestionsLocked"
                placement="top"
              >
                <li
                  class="suggestion-row"
                  :class="{ locked: suggestionsLocked }"
                  :role="suggestionsLocked ? undefined : 'button'"
                  :tabindex="suggestionsLocked ? undefined : 0"
                  :aria-disabled="suggestionsLocked ? 'true' : undefined"
                  @click="!suggestionsLocked && onSuggestionClick(s)"
                  @keyup.enter="!suggestionsLocked && onSuggestionClick(s)"
                  @keyup.space.prevent="!suggestionsLocked && onSuggestionClick(s)"
                >
                  <suggestion-icon class="suggestion-icon" :size="16" aria-hidden="true" focusable="false" />
                  <span class="suggestion-text">{{ s.prompt }}</span>
                  <lock-icon
                    v-if="suggestionsLocked"
                    class="suggestion-cta"
                    :size="16"
                    aria-hidden="true"
                    focusable="false"
                  />
                  <external-link-icon v-else class="suggestion-cta" :size="16" aria-hidden="true" focusable="false" />
                </li>
              </el-tooltip>
            </ul>
          </div>

          <!-- Scopes / tools exposed by this connector (informational). -->
          <div v-if="!selectedItem.browserSession" class="detail-section">
            <div class="section-heading">
              <span class="section-title">{{ $t('connection.title.toolPermissions') }}</span>
              <span v-if="permissionRowCount" class="section-count">{{ permissionRowCount }}</span>
            </div>

            <!-- oauth_dcr (MCP) connection: live tools/list from the server -->
            <template v-if="selectedItem.custom && selectedItem.connection">
              <p v-if="selectedMcpToolsLoading" class="permission-empty">
                {{ $t('connection.message.toolsLoading') }}
              </p>
              <p v-else-if="selectedMcpToolsError" class="permission-empty error">
                {{ selectedMcpToolsError }}
              </p>
              <ul v-else-if="selectedMcpTools && selectedMcpTools.length" class="permission-list">
                <li v-for="tool in selectedMcpTools" :key="tool.name" class="permission-row">
                  <span class="permission-name">
                    <span class="permission-tool-name">{{ tool.name }}</span>
                    <span v-if="tool.description" class="permission-tool-desc">{{ tool.description }}</span>
                  </span>
                </li>
              </ul>
              <p v-else class="permission-empty">{{ $t('connection.label.noTools') }}</p>
            </template>

            <!-- Unconnected MCP connector: a live tools/list needs an active
                 session, so there are no structured rows to show yet. Point
                 the user at connecting instead of the misleading OAuth
                 "no authorization scopes" line — the tool rundown is in the
                 Overview prose above. -->
            <template v-else-if="isMcpConnector && !selectedItem.connection">
              <p class="permission-empty">{{ $t('connection.label.toolsConnectFirst') }}</p>
            </template>

            <!-- Preset OAuth connection / available provider: scope bundles -->
            <template v-else>
              <ul v-if="detailScopes.length" class="permission-list">
                <li v-for="scope in detailScopes" :key="scope.id" class="permission-row">
                  <span class="permission-name">
                    <span class="permission-scope-label">{{ scope.label }}</span>
                    <span v-if="scope.desc" class="permission-tool-desc">{{ scope.desc }}</span>
                  </span>
                </li>
              </ul>
              <p v-else class="permission-empty">{{ $t('connection.label.noScopes') }}</p>
            </template>
          </div>

          <!-- Connected: timestamps -->
          <div v-if="selectedItem.connection && !selectedItem.browserSession" class="detail-section meta-section">
            <dl class="meta-grid">
              <div>
                <dt>{{ $t('connection.field.expiresAt') }}</dt>
                <dd>
                  <span v-if="selectedItem.connection.expires_at">{{
                    $dayjs.format(selectedItem.connection.expires_at)
                  }}</span>
                  <span v-else class="muted">—</span>
                </dd>
              </div>
              <div>
                <dt>{{ $t('connection.field.lastRefreshedAt') }}</dt>
                <dd>
                  <span v-if="selectedItem.connection.last_refreshed_at">{{
                    $dayjs.format(selectedItem.connection.last_refreshed_at)
                  }}</span>
                  <span v-else class="muted">{{ $t('connection.label.never') }}</span>
                </dd>
              </div>
              <div>
                <dt>{{ $t('connection.field.createdAt') }}</dt>
                <dd>{{ $dayjs.format(selectedItem.connection.created_at) }}</dd>
              </div>
            </dl>
          </div>
        </template>
      </section>
    </div>

    <!-- Browse connectors dialog -->
    <browse-connectors
      v-model="browseDialogVisible"
      @installed="onCatalogInstalled"
      @add-account="onBrowseAddAccount"
      @manage="onBrowseManage"
    />

    <!-- BYOC credential form (Tencent Cloud and any future
         SecretId/SecretKey connector). The same component the
         Browse Connectors dialog uses; reused here so users who
         click the inline "添加" button on a `byoc` row don't have
         to detour through the Browse dialog. -->
    <byoc-credentials-dialog
      v-model="byocDialogVisible"
      :item="byocDialogCatalog"
      :method="byocDialogMethod"
      :create-new="pendingCreateNew"
      @installed="onCatalogInstalled"
      @update:model-value="(v: boolean) => !v && clearCreateNewIntent()"
    />

    <!-- Multi-method picker: only opened when a connector exposes more
         than one connection method; single-method connectors skip it. -->
    <connector-method-picker
      v-model="pickerVisible"
      :item="pickerCatalog"
      @select="onMethodSelected"
      @update:model-value="(v: boolean) => !v && clearCreateNewIntent()"
    />
    <browser-pairing-dialog v-model="pairingDialogVisible" @paired="onBrowserPaired" @closed="onBrowserPairingClosed" />
    <browser-device-picker
      ref="browserDevicePicker"
      v-model="browserDevicePickerVisible"
      :method="browserDialogMethod"
      :installing="browserInstalling"
      @pair="openBrowserPairing"
      @select="onBrowserDeviceSelected"
      @update:model-value="onBrowserPickerVisibility"
    />

    <!-- Custom connector dialog -->
    <el-dialog
      v-model="customDialogVisible"
      :title="$t('connection.title.addCustomConnector')"
      width="560px"
      :close-on-click-modal="false"
    >
      <p class="custom-dialog-intro">{{ $t('connection.message.customConnectorHint') }}</p>
      <div class="custom-dialog-form">
        <el-input v-model.trim="customName" :placeholder="$t('connection.placeholder.name')" clearable />
        <el-input
          v-model.trim="customServerUrl"
          :placeholder="$t('connection.placeholder.serverUrl')"
          clearable
          @keyup.enter="onConnectCustom"
        />
        <button type="button" class="advanced-toggle" @click="customAdvancedVisible = !customAdvancedVisible">
          <collapse-up-icon v-if="customAdvancedVisible" class="mr-1" :size="16" aria-hidden="true" focusable="false" />
          <expand-down-icon v-else class="mr-1" :size="16" aria-hidden="true" focusable="false" />
          <span>{{ $t('connection.label.advancedSettings') }}</span>
        </button>
        <div v-if="customAdvancedVisible" class="advanced-fields">
          <el-input v-model.trim="customClientId" :placeholder="$t('connection.placeholder.clientId')" clearable />
          <el-input
            v-model="customClientSecret"
            :placeholder="$t('connection.placeholder.clientSecret')"
            clearable
            show-password
          />
        </div>
        <p class="custom-trust-copy">{{ $t('connection.message.customConnectorTrust') }}</p>
      </div>
      <template #footer>
        <el-button @click="customDialogVisible = false">{{ $t('common.button.cancel') }}</el-button>
        <el-button type="primary" :loading="customAuthorizing" :disabled="!customServerUrl" @click="onConnectCustom">
          {{ $t('connection.button.addCustom') }}
        </el-button>
      </template>
    </el-dialog>

    <!-- Scope selection dialog -->
    <el-dialog
      v-model="scopeDialogVisible"
      :title="scopeDialogCatalog ? $t('connection.message.selectScopes', { provider: scopeDialogCatalog.name }) : ''"
      width="480px"
      :close-on-click-modal="false"
      @closed="!scopeDialogCatalog && clearCreateNewIntent()"
    >
      <p class="text-sm text-gray-500 mb-4">{{ $t('connection.message.selectScopesHint') }}</p>
      <el-checkbox-group v-model="selectedScopes">
        <div v-for="perm in scopeDialogPermissions" :key="perm.id" class="scope-dialog-row">
          <el-checkbox :value="perm.id" :label="perm.id">
            <span class="scope-dialog-label">{{ perm.label || perm.id }}</span>
          </el-checkbox>
          <p v-if="perm.desc" class="scope-dialog-desc">{{ perm.desc }}</p>
        </div>
      </el-checkbox-group>
      <template #footer>
        <el-button @click="scopeDialogVisible = false">{{ $t('common.button.cancel') }}</el-button>
        <el-button type="primary" @click="onConfirmScopes">{{ $t('common.button.confirm') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import {
  ElButton,
  ElTag,
  ElAvatar,
  ElDialog,
  ElInput,
  ElCheckbox,
  ElCheckboxGroup,
  ElDropdown,
  ElDropdownMenu,
  ElDropdownItem,
  ElMessage,
  ElMessageBox,
  ElSkeleton,
  ElSkeletonItem,
  ElTooltip
} from 'element-plus';
import {
  AddIcon,
  CollapseUpIcon,
  ConnectionIcon,
  DesktopIcon,
  ExpandDownIcon,
  ExpandRightIcon,
  ExternalLinkIcon,
  LockIcon,
  MoreIcon,
  SearchIcon,
  SuggestionIcon
} from '@acedatacloud/core/icons/components';
import {
  IConnection,
  IConnectorConnectionMethod,
  IConnectorCatalogItem,
  IConnectorPermission,
  IConnectorSuggestion,
  IConnectionTool,
  ConnectionStatus,
  connectionOperator,
  getConnectorMethods,
  resolveConnectorMethod
} from '@/operators/connection';
import BrowseConnectors from '@/components/connections/BrowseConnectors.vue';
import ByocCredentialsDialog from '@/components/connections/ByocCredentialsDialog.vue';
import ConsolePageHeader from '@/components/console/PageHeader.vue';
import ConnectorMethodPicker from '@/components/connections/ConnectorMethodPicker.vue';
import BrowserPairingDialog from '@/components/browser/BrowserPairingDialog.vue';
import BrowserDevicePicker from '@/components/browser/BrowserDevicePicker.vue';
import { popupReturnUrl } from '@/utils/connections/authorizePopup';
import { openAuthorizeFlow } from '@/utils/connections/authorizeFlow';
import type { IBrowserDevice } from '@/models/browserDevice';

/** One row of the connection detail overflow menu. */
interface IDetailAction {
  command: string;
  label: string;
  disabled?: boolean;
  danger?: boolean;
  divided?: boolean;
}

interface IListItem {
  key: string;
  name: string;
  faviconUrl?: string;
  /** ``true`` for any remote MCP connection, regardless
   *  of whether it was installed from a marketplace catalog entry or hand-
   *  configured by the user. Drives MCP-flavoured detail rendering (server_url
   *  metadata, live ``tools/list`` fetch, hide preset OAuth-scope catalog).
   *  NOT used to gate the user-facing "Custom" badge — see ``byo`` below. */
  custom: boolean;
  /** ``true`` for user-secret or cookie-jar rows — Tencent Cloud and
   *  any future SecretId/SecretKey connector. There is no upstream
   *  "account" to show, so the detail pane skips the OAuth-style
   *  avatar+name row and renders a meta grid (status + credentials list)
   *  instead. */
  byoc: boolean;
  /** Local browser execution session backed by a paired BrowserDevice. */
  browserSession: boolean;
  /** ``true`` only for genuine bring-your-own remote MCP connections that
   *  are not joined to a catalog row. A marketplace-installed remote MCP
   *  connector (Stripe, Linear, acedata/* …) is just as official as a skill
   *  one to the user, so it should NOT be tagged "Custom". */
  byo: boolean;
  description?: string;
  serverUrl?: string;
  connection?: IConnection;
  /** The connector catalog row this list item is bound to.
   *  - Populated for "available to connect" rows (no `connection` yet).
   *  - Populated for connections via the strict
   *    ``connection.connector_identifier`` ↔ ``catalog.identifier`` join,
   *    so the right-pane reads display fields (name / icon / description /
   *    permissions) from a single source of truth.
   *  - Connections without ``connector_identifier`` (legacy preset installs
   *    or BYO custom MCPs) leave this ``undefined`` and fall through to
   *    the generic plug + bare ``server_url`` / ``provider`` label. */
  catalog?: IConnectorCatalogItem;
  /** Which account this row is, as a single resolved string:
   *  ``label`` -> profile name -> login -> email. Always rendered the same
   *  way — the source it came from is an implementation detail, not something
   *  worth signalling with different weights. */
  accountLabel?: string;
  isDefault?: boolean;
  /** Cluster key for the connected list: all accounts of the same
   *  connector share one, so they sort adjacently. */
  clusterKey?: string;
  /** ``created_at`` epoch ms — the row's own age. Sorting on this
   *  rather than ``updated_at`` keeps the list still: a background
   *  token refresh must not reshuffle what the user is looking at. */
  createdAt?: number;
  /** Per-connector slot number, used as the tie-break when two accounts
   *  were created in the same second. */
  accountSeq?: number;
  groupKey: 'connected' | 'available';
}

interface IListGroup {
  key: 'connected' | 'available';
  label: string;
  collapsed: boolean;
  items: IListItem[];
}

interface IData {
  connections: IConnection[];
  connectionsRequestId: number;
  /** Guards overlapping "Manage" clicks from the browse dialog, which stays
   *  interactive through its leave transition. */
  manageRequestId: number;
  /** Backend-localized connector catalog used for both the
   *  "available to connect" list AND the right-pane display fields
   *  (name / icon / description / permissions) of preset connections.
   *  See AuthBackend ``GET /api/v1/connectors/`` (legacy alias
   *  ``GET /api/v1/connections/catalog/``). */
  catalog: IConnectorCatalogItem[];
  loading: boolean;
  loadingCatalog: boolean;
  /** Flips ``true`` once both the connections list AND the localized
   *  catalog have resolved at least once. Used to gate the initial
   *  skeleton: without this, the list briefly flashes raw provider
   *  names ("google", "microsoft") with the fallback plug icon while
   *  the catalog request is still in flight. */
  firstLoadComplete: boolean;
  refreshingId: string | null;
  searchQuery: string;
  selectedKey: string | null;
  collapsedGroups: Record<string, boolean>;
  faviconBlocked: Record<string, boolean>;
  customServerUrl: string;
  customName: string;
  customClientId: string;
  customClientSecret: string;
  /** Per-connection MCP tools cache. Populated lazily when a oauth_dcr
   *  connection is selected. */
  mcpToolsByConnection: Record<string, IConnectionTool[]>;
  /** Per-connection load state — `true` while the GET /tools/ request
   *  is in flight, error message string when the call failed. `null`
   *  before any attempt. */
  mcpToolsState: Record<string, true | string | null>;
  customDialogVisible: boolean;
  customAdvancedVisible: boolean;
  customAuthorizing: boolean;
  scopeDialogVisible: boolean;
  /** Catalog row whose permissions are currently in the scope-selection
   *  dialog (only triggered for ``oauth_static`` rows that expose more
   *  than one permission). */
  scopeDialogCatalog: IConnectorCatalogItem | null;
  /** The method chosen for the scope dialog's catalog row. */
  scopeDialogMethod: IConnectorConnectionMethod | null;
  /** ``permissions[].id`` values currently checked in the dialog. */
  selectedScopes: string[];
  browseDialogVisible: boolean;
  /** Active BYOC catalog row whose credential form is open (null when
   *  the dialog is closed). The dialog is shared between this page's
   *  inline install path and any fallback flow. */
  byocDialogVisible: boolean;
  /** Set only while an explicit "add another account" flow is in flight, so
   *  the install call opts into a new account slot. Cleared on every entry
   *  point that isn't that flow, otherwise a later reconnect would silently
   *  create a duplicate account. */
  pendingCreateNew: boolean;
  byocDialogCatalog: IConnectorCatalogItem | null;
  /** The method the credential dialog is collecting credentials for. */
  byocDialogMethod: IConnectorConnectionMethod | null;
  /** Multi-method picker state. */
  pickerVisible: boolean;
  pickerCatalog: IConnectorCatalogItem | null;
  pairingDialogVisible: boolean;
  browserDevicePickerVisible: boolean;
  browserDialogCatalog: IConnectorCatalogItem | null;
  browserDialogMethod: IConnectorConnectionMethod | null;
  browserInstalling: boolean;
  browserRebindConnectionId: string | null;
  pairedBrowserDevice: IBrowserDevice | null;
}

export default defineComponent({
  name: 'UserConnections',
  components: {
    ConsolePageHeader,
    ElButton,
    ElTag,
    ElAvatar,
    ElDialog,
    ElInput,
    ElCheckbox,
    ElCheckboxGroup,
    ElDropdown,
    ElDropdownMenu,
    ElDropdownItem,
    AddIcon,
    CollapseUpIcon,
    ConnectionIcon,
    DesktopIcon,
    ExpandDownIcon,
    ExpandRightIcon,
    ExternalLinkIcon,
    LockIcon,
    MoreIcon,
    SearchIcon,
    SuggestionIcon,
    BrowseConnectors,
    ByocCredentialsDialog,
    ConnectorMethodPicker,
    BrowserPairingDialog,
    BrowserDevicePicker,
    ElSkeleton,
    ElSkeletonItem,
    ElTooltip
  },
  data(): IData {
    return {
      connections: [],
      connectionsRequestId: 0,
      manageRequestId: 0,
      catalog: [],
      loading: false,
      loadingCatalog: false,
      firstLoadComplete: false,
      refreshingId: null,
      searchQuery: '',
      selectedKey: null,
      collapsedGroups: {},
      faviconBlocked: {},
      customServerUrl: '',
      customName: '',
      customClientId: '',
      customClientSecret: '',
      customDialogVisible: false,
      customAdvancedVisible: false,
      customAuthorizing: false,
      scopeDialogVisible: false,
      scopeDialogCatalog: null,
      scopeDialogMethod: null,
      selectedScopes: [],
      mcpToolsByConnection: {},
      mcpToolsState: {},
      browseDialogVisible: false,
      pendingCreateNew: false,
      byocDialogVisible: false,
      byocDialogCatalog: null,
      byocDialogMethod: null,
      pickerVisible: false,
      pickerCatalog: null,
      pairingDialogVisible: false,
      browserDevicePickerVisible: false,
      browserDialogCatalog: null,
      browserDialogMethod: null,
      browserInstalling: false,
      browserRebindConnectionId: null,
      pairedBrowserDevice: null
    };
  },
  computed: {
    /** Index catalog rows by ``identifier``. This is the *only* join
     *  key — every connection (``oauth_static`` or ``oauth_dcr``) is
     *  expected to carry a non-empty ``connector_identifier`` stamped
     *  by the backend at install time. Connections without one fall
     *  through to the generic plug + provider/server_url label, with
     *  no profile-based fanout. */
    catalogByIdentifier(): Record<string, IConnectorCatalogItem> {
      const out: Record<string, IConnectorCatalogItem> = {};
      for (const it of this.catalog) {
        if (it.identifier) out[it.identifier] = it;
      }
      return out;
    },
    /** Resolve the catalog row a given ``Connection`` was installed
     *  from, strictly via ``connector_identifier``. No provider /
     *  preset_provider_id / profile fallbacks — the install path must
     *  stamp the identifier. */
    catalogForConnection(): (c: IConnection) => IConnectorCatalogItem | undefined {
      const idx = this.catalogByIdentifier;
      return (c) => {
        const id = c.connector_identifier;
        return id ? idx[id] : undefined;
      };
    },
    /** The overflow menu's contents for the selected connection.
     *
     *  Built as data rather than a wall of `v-if` buttons: up to eight actions
     *  can apply at once, which crowded the header and pushed Disconnect off
     *  the edge. Order is most-used first, with the destructive one separated. */
    detailActions(): IDetailAction[] {
      const item = this.selectedItem;
      const conn = item?.connection;
      if (!item || !conn) return [];
      const actions: IDetailAction[] = [];
      const active = this.normalizedStatus(conn.status) === 'active';
      const installable = !!item.catalog?.installable;
      // The menu closes on select, so the old inline button spinners have
      // nowhere to live. Disable the in-flight entries instead, otherwise
      // reopening the menu lets the same request be fired twice.
      const busy = this.refreshingId === conn.id;

      if (conn.supports_refresh) {
        actions.push({
          command: 'refresh',
          label: String(this.$t('connection.button.refresh')),
          disabled: busy
        });
      }
      if (item.browserSession && active) {
        actions.push({
          command: 'rebind',
          label: String(this.$t('connection.button.rebindBrowserDevice')),
          disabled: this.browserInstalling
        });
        if ((conn.browser_device?.active_session_count || 0) > 0) {
          actions.push({
            command: 'stopSessions',
            label: String(this.$t('connection.button.stopBrowserSessions')),
            disabled: busy
          });
        }
      }
      if (item.catalog && !item.browserSession) {
        actions.push({
          command: 'reconnect',
          label: String(this.$t('connection.button.reconnect')),
          disabled: !installable
        });
        actions.push({
          command: 'addAccount',
          label: String(this.$t('connection.button.addAccount')),
          disabled: !installable
        });
      }
      // Shown for every connector-backed account, not just multi-account ones:
      // hiding it on the account that already IS the default made the feature
      // undiscoverable — you could never see what "default" meant from the one
      // account you had selected. Disabled conveys the same state, visibly.
      if (item.catalog) {
        actions.push({
          command: 'setDefault',
          label: String(
            conn.is_default ? this.$t('connection.button.isDefault') : this.$t('connection.button.setDefault')
          ),
          disabled: !!conn.is_default
        });
      }
      actions.push({ command: 'rename', label: String(this.$t('connection.button.rename')) });
      actions.push({
        command: 'disconnect',
        label: String(this.$t('connection.button.disconnect')),
        danger: true,
        divided: true
      });
      return actions;
    },
    /** Connectors that already have an active connection.
     *
     *  Used to keep the "recommended" rail from re-offering something the
     *  user is already connected to. Adding a SECOND account is offered from
     *  the connected card's own "Add account" button instead, so this stays
     *  a simple installed-or-not check. */
    activeConnectedCatalogIds(): Set<string> {
      const ids = new Set<string>();
      const idx = this.catalogByIdentifier;
      for (const c of this.connections) {
        if (this.normalizedStatus(c.status) !== 'active') continue;
        const id = c.connector_identifier;
        const row = id ? idx[id] : undefined;
        if (row) ids.add(row.identifier);
      }
      return ids;
    },
    items(): IListItem[] {
      const result: IListItem[] = [];
      const perConnector: Record<string, number> = {};
      for (const c of this.connections) {
        const id = c.connector_identifier || '';
        if (id) perConnector[id] = (perConnector[id] || 0) + 1;
      }
      const multiAccountConnectors = new Set(Object.keys(perConnector).filter((id) => perConnector[id] > 1));
      // Connected: every connection's display fields (name / icon /
      // description) come strictly from the joined catalog row. A
      // connection without ``connector_identifier`` (legacy preset
      // installs created before the catalog landed, or BYO custom
      // MCPs) renders with the generic plug icon and the row's bare
      // ``server_url`` / ``provider`` as the label. The backend is
      // responsible for stamping ``connector_identifier`` at install
      // time — there is no client-side compatibility shim.
      for (const c of this.connections) {
        const key = `connection:${c.id}`;
        const cat = this.catalogForConnection(c);
        const isCustom = c.execution_type === 'remote_mcp';
        const isByoc = c.credential_type === 'user_secret' || c.credential_type === 'cookie_jar';
        const isBrowserSession = c.execution_type === 'browser_device';
        // Genuine BYO = custom OAuth flow AND not backed by a catalog row.
        // Catalog-installed ``oauth_dcr`` connectors (Stripe, Linear, etc.)
        // share the custom-OAuth machinery but appear in the marketplace
        // just like preset providers, so they don't get the "Custom" badge.
        const isByo = isCustom && !cat;
        const favicon = !this.faviconBlocked[key] ? cat?.icon_url || undefined : undefined;
        result.push({
          key,
          name:
            cat?.name ||
            (isBrowserSession
              ? (c.profile?.name as string) || c.connector_identifier || String(this.$t('user.browserDevice.title'))
              : isCustom
                ? c.server_url || c.provider
                : c.provider),
          faviconUrl: favicon,
          custom: isCustom,
          byoc: isByoc,
          browserSession: isBrowserSession,
          byo: isByo,
          description: cat?.short_description || cat?.description || undefined,
          serverUrl: isCustom ? c.server_url || undefined : undefined,
          connection: c,
          catalog: cat,
          // One field, rendered one way: the user's nickname if they set one,
          // otherwise the upstream identity. Styling the two sources
          // differently only read as random emphasis.
          accountLabel: this.connectionAccountLabel(c),
          isDefault: multiAccountConnectors.has(c.connector_identifier || '') && !!c.is_default,
          // Cluster on the catalog identifier so every account of one
          // connector stays together. Rows without one (legacy installs,
          // BYO MCPs) fall back to their own key and cluster alone.
          clusterKey: c.connector_identifier || key,
          // Date.parse yields NaN on a non-ISO payload; ``|| 0`` sinks such
          // rows rather than poisoning every comparison with NaN.
          createdAt: Date.parse(c.created_at) || 0,
          accountSeq: c.account_seq ?? 0,
          groupKey: 'connected'
        });
      }
      // Recommended: the small curated shortlist of connectors flagged
      // ``is_featured`` in the backend catalog. We reuse the existing
      // ``is_featured`` flag rather than a rail-only field so ops has one
      // knob (YAML seed) for both the Browse dialog badge and the left
      // rail. The group label stays "推荐 / Recommended" because that's
      // the user-facing intent here — the internal filter mechanism is
      // an implementation detail. Every canonical method is welcome; the
      // full long tail lives one click away via the "浏览全部连接器"
      // footer button.
      const installed = this.activeConnectedCatalogIds;
      for (const cat of this.catalog) {
        if (!cat.is_featured) continue;
        if (installed.has(cat.identifier)) continue;
        const key = `catalog:${cat.identifier}`;
        const favicon = !this.faviconBlocked[key] ? cat.icon_url || undefined : undefined;
        result.push({
          key,
          name: cat.name || cat.identifier,
          faviconUrl: favicon,
          custom: false,
          byoc: false,
          browserSession: false,
          byo: false,
          description: cat.short_description || cat.description || undefined,
          catalog: cat,
          groupKey: 'available'
        });
      }
      return result;
    },
    /** Newest connector first, with all accounts of one connector kept
     *  adjacent. A cluster ranks by its newest member, so connecting a
     *  second B站 account pulls the whole B站 cluster to the top —
     *  otherwise the new row would sit at the top and its sibling would
     *  stay stranded far below. Inside a cluster the default account
     *  leads (it's the one that actually gets used), then newest first. */
    orderedItems(): IListItem[] {
      const connected = this.items.filter((it) => it.groupKey === 'connected');
      const available = this.items.filter((it) => it.groupKey === 'available');
      const clusterRank = new Map<string, number>();
      for (const it of connected) {
        const key = it.clusterKey || it.key;
        clusterRank.set(key, Math.max(clusterRank.get(key) ?? 0, it.createdAt || 0));
      }
      connected.sort((a, b) => {
        const ka = a.clusterKey || a.key;
        const kb = b.clusterKey || b.key;
        if (ka !== kb) {
          const diff = (clusterRank.get(kb) ?? 0) - (clusterRank.get(ka) ?? 0);
          // Plain codepoint compare, not localeCompare: the tie-break only
          // needs to be the same everywhere, and collation varies by host
          // locale.
          return diff !== 0 ? diff : ka < kb ? -1 : 1;
        }
        if (!!a.isDefault !== !!b.isDefault) return a.isDefault ? -1 : 1;
        const diff = (b.createdAt || 0) - (a.createdAt || 0);
        if (diff !== 0) return diff;
        // Same-second installs: fall back to the per-connector slot the
        // backend assigned, then the row key so the order never drifts.
        const seq = (a.accountSeq ?? 0) - (b.accountSeq ?? 0);
        return seq !== 0 ? seq : a.key < b.key ? -1 : a.key > b.key ? 1 : 0;
      });
      return [...connected, ...available];
    },
    filteredItems(): IListItem[] {
      const q = this.searchQuery.trim().toLowerCase();
      if (!q) return this.orderedItems;
      return this.orderedItems.filter((it) => {
        return (
          it.name.toLowerCase().includes(q) ||
          (it.serverUrl || '').toLowerCase().includes(q) ||
          (it.description || '').toLowerCase().includes(q)
        );
      });
    },
    filteredGroups(): IListGroup[] {
      const groups: IListGroup[] = [];
      const connected = this.filteredItems.filter((it) => it.groupKey === 'connected');
      const available = this.filteredItems.filter((it) => it.groupKey === 'available');
      if (connected.length) {
        groups.push({
          key: 'connected',
          label: String(this.$t('connection.title.groupConnected')),
          collapsed: !!this.collapsedGroups.connected,
          items: connected
        });
      }
      if (available.length) {
        groups.push({
          key: 'available',
          label: String(this.$t('connection.title.groupRecommended')),
          collapsed: !!this.collapsedGroups.available,
          items: available
        });
      }
      return groups;
    },
    selectedItem(): IListItem | null {
      if (!this.selectedKey) return null;
      return this.items.find((it) => it.key === this.selectedKey) || null;
    },
    detailScopes(): { id: string; label: string; desc: string }[] {
      // Read the localized permission catalog from the joined
      // ``IConnectorCatalogItem.permissions`` (pre-localized
      // server-side via Accept-Language). For an active connection
      // we render the actually-granted ``connection.scopes`` and
      // look up each in the catalog for label/desc. For an
      // "available to connect" row we render the full catalog so
      // the user knows what they can grant.
      const item = this.selectedItem;
      if (!item || !item.catalog) return [];
      const all = item.catalog.permissions || [];
      const byId = new Map(all.map((p) => [p.id, p]));
      const conn = item.connection;
      if (conn && (conn.scopes || []).length > 0) {
        return (conn.scopes || []).map((sid) => {
          const p = byId.get(sid);
          return { id: sid, label: p?.label || sid, desc: p?.desc || '' };
        });
      }
      // Unconnected provider, or a connected provider whose OAuth
      // doesn't echo scopes back (Notion). Show the full permission
      // catalog so the user understands what was / will be granted.
      return all.map((p) => ({ id: p.id, label: p.label || p.id, desc: p.desc || '' }));
    },
    /** MCP tools list for the currently selected remote MCP connection.
     *  Populated lazily by `loadMcpTools()` on selection. */
    selectedMcpTools(): IConnectionTool[] | null {
      const conn = this.selectedItem?.connection;
      if (!conn || conn.execution_type !== 'remote_mcp') return null;
      return this.mcpToolsByConnection[conn.id] || null;
    },
    selectedMcpToolsLoading(): boolean {
      const conn = this.selectedItem?.connection;
      if (!conn || conn.execution_type !== 'remote_mcp') return false;
      return this.mcpToolsState[conn.id] === true;
    },
    selectedMcpToolsError(): string | null {
      const conn = this.selectedItem?.connection;
      if (!conn || conn.execution_type !== 'remote_mcp') return null;
      const state = this.mcpToolsState[conn.id];
      return typeof state === 'string' ? state : null;
    },
    /** Count shown next to the "Tool permissions" header. For oauth_dcr
     *  connections we count live MCP tools; otherwise OAuth scopes. */
    permissionRowCount(): number {
      if (this.selectedItem?.custom && this.selectedItem.connection) {
        return this.selectedMcpTools?.length ?? 0;
      }
      return this.detailScopes.length;
    },
    /** Whether the detail pane shows the "which account is this" card.
     *
     *  OAuth rows always have an upstream profile, so they always show it.
     *  Cookie (BYOC) rows only resolve one for platforms with a profile
     *  fetcher — without it the card would be a dash and a "?" avatar, so
     *  it stays hidden. Browser-session rows have their own panel. */
    showsAccountIdentity(): boolean {
      const connection = this.selectedItem?.connection;
      if (!connection || this.selectedItem?.browserSession) return false;
      if (!this.selectedItem?.byoc) return true;
      return Boolean(connection.profile?.name || connection.profile?.login || connection.profile?.email);
    },
    scopeDialogPermissions(): IConnectorPermission[] {
      // Permission catalog of the row currently in the
      // scope-selection dialog. Each entry's ``id`` is a raw upstream
      // OAuth scope (the same shape the install endpoint expects in
      // ``scopes: []``). Prefer the chosen method's permissions; fall
      // back to the row's top-level (recommended) permissions.
      return this.scopeDialogMethod?.permissions || this.scopeDialogCatalog?.permissions || [];
    },
    /** Server-curated "Try It" prompts for the selected connector,
     *  read straight off the joined catalog row. Empty array hides
     *  the section entirely.
     *
     *  - Returned regardless of connection state: an unconnected row
     *    still shows them (rendered locked via ``suggestionsLocked``)
     *    so the user can preview what the connector is good for before
     *    committing to the OAuth round-trip.
     *  - Marketplace-installed ``oauth_dcr`` connections inherit
     *    suggestions through ``connector_identifier`` →
     *    ``IConnectorCatalogItem.suggestions`` (same join as the
     *    icon / name fix in PR #81).
     *  - Bring-your-own custom MCP installs have no catalog row,
     *    therefore no suggestions, therefore the section stays
     *    hidden — exactly what we want. */
    suggestions(): IConnectorSuggestion[] {
      const item = this.selectedItem;
      if (!item) return [];
      return item.catalog?.suggestions || [];
    },
    /** Long-form connector description (``catalog.description``), shown in
     *  the Overview section. Suppressed when it would just duplicate the
     *  header one-liner — i.e. the row only has a long description and no
     *  distinct ``short_description``, so the header already renders it. */
    overviewText(): string {
      const full = (this.selectedItem?.catalog?.description || '').trim();
      if (!full) return '';
      // ``selectedItem.description`` is ``short_description || description``;
      // when they match, the header already shows this exact text.
      return full === (this.selectedItem?.description || '').trim() ? '' : full;
    },
    /** ``true`` when the selected row is a remote MCP connector.
     *  Drives the "connect to view tools" hint that replaces the OAuth
     *  "no scopes" line for MCP rows that haven't been connected yet. The
     *  effective method is the recommended one (or the first), matching
     *  how the connector installs by default. */
    isMcpConnector(): boolean {
      return resolveConnectorMethod(this.selectedItem?.catalog)?.execution.type === 'remote_mcp';
    },
    /** ``true`` unless the selected connector has an ACTIVE connection.
     *  Gates the "Try It" prompts: without a live connection they render
     *  non-interactive with a hover tooltip explaining why. */
    suggestionsLocked(): boolean {
      const conn = this.selectedItem?.connection;
      return !conn || this.normalizedStatus(conn.status) !== 'active';
    }
  },
  watch: {
    orderedItems: {
      handler(items: IListItem[]) {
        if (items.length === 0) {
          this.selectedKey = null;
          return;
        }
        if (!this.selectedKey || !items.some((it) => it.key === this.selectedKey)) {
          this.selectedKey = items[0].key;
        }
      },
      immediate: false
    }
  },
  async mounted() {
    await Promise.all([this.fetchConnections(), this.fetchCatalog()]);
    this.firstLoadComplete = true;
    if (!this.selectedKey && this.orderedItems.length) {
      this.selectedKey = this.orderedItems[0].key;
    }
    // If the auto-selected item is a remote MCP connection, kick off
    // the tools fetch alongside.
    const item = this.selectedKey ? this.items.find((it) => it.key === this.selectedKey) : null;
    if (
      item?.connection?.execution_type === 'remote_mcp' &&
      this.normalizedStatus(item.connection.status) === 'active'
    ) {
      this.loadMcpTools(item.connection.id);
    }
    // Deep-link: ?connect=<connector_identifier> selects that connector and
    // auto-opens its connect dialog, so callers (e.g. the publish console) can
    // send the user straight to the right connector instead of the homepage.
    const connectId = this.$route.query.connect?.toString();
    if (connectId) {
      // Search the rendered order, not the raw list: a connector with
      // several accounts has several matching rows, and the deep link
      // should land on the one the list puts first (the default).
      const match = this.orderedItems.find((it) => it.catalog?.identifier === connectId);
      if (match) {
        this.selectedKey = match.key;
        const active = match.connection && this.normalizedStatus(match.connection.status) === 'active';
        if (match.catalog && !active) {
          this.onConnect(match.catalog);
        }
      }
    }
  },
  methods: {
    onSelect(item: IListItem) {
      this.selectedKey = item.key;
      const conn = item.connection;
      if (conn && conn.execution_type === 'remote_mcp' && this.normalizedStatus(conn.status) === 'active') {
        // Lazy-load tools/list on first selection; cache hit is a no-op.
        if (this.mcpToolsState[conn.id] == null) {
          this.loadMcpTools(conn.id);
        }
      }
    },
    async loadMcpTools(connectionId: string) {
      this.mcpToolsState = { ...this.mcpToolsState, [connectionId]: true };
      try {
        const { data } = await connectionOperator.tools(connectionId);
        this.mcpToolsByConnection = { ...this.mcpToolsByConnection, [connectionId]: data.items || [] };
        this.mcpToolsState = { ...this.mcpToolsState, [connectionId]: null };
      } catch (e: unknown) {
        const err = e as { response?: { data?: { detail?: string } }; message?: string };
        const msg = err.response?.data?.detail || err.message || 'Failed to load tools';
        this.mcpToolsState = { ...this.mcpToolsState, [connectionId]: msg };
      }
    },
    toggleGroup(key: 'connected' | 'available') {
      this.collapsedGroups = { ...this.collapsedGroups, [key]: !this.collapsedGroups[key] };
    },
    onFaviconError(item: IListItem) {
      this.faviconBlocked = { ...this.faviconBlocked, [item.key]: true };
    },
    oauthMetadata(connection: IConnection): Record<string, any> {
      return ((connection.metadata || {}).oauth || {}) as Record<string, any>;
    },
    connectionProviderName(connection: IConnection): string {
      // Used in disconnect confirmation copy. Pulled strictly from
      // the joined catalog row; falls through to ``server_url`` /
      // ``provider`` only when the connection has no
      // ``connector_identifier``.
      const cat = this.catalogForConnection(connection);
      if (cat?.name) return cat.name;
      if (connection.execution_type === 'remote_mcp') return connection.server_url || connection.provider;
      return connection.provider;
    },
    /** What the left rail shows next to a connector — "which of my accounts
     *  is this". The user's own nickname wins, because that is exactly what
     *  they renamed it for; otherwise fall back to the upstream identity.
     *  Empty when nothing identifies the account (the rail has no room for a
     *  placeholder dash). */
    connectionAccountLabel(connection: IConnection): string {
      return (
        connection.label ||
        (connection.profile?.name as string) ||
        (connection.profile?.login as string) ||
        (connection.profile?.email as string) ||
        ''
      );
    },
    /** The upstream account as the provider reports it, for the detail pane's
     *  identity card. Deliberately ignores `label`: that card answers "whose
     *  account did I authorize", and renaming a connection must not appear to
     *  rename the Google/Microsoft account behind it. */
    connectionAccountName(connection: IConnection): string {
      return (
        (connection.profile?.name as string) ||
        (connection.profile?.login as string) ||
        (connection.profile?.email as string) ||
        '—'
      );
    },
    connectionAvatar(connection: IConnection): string {
      return (
        ((connection.profile?.avatar || connection.profile?.avatar_url || connection.profile?.picture) as string) || ''
      );
    },
    connectionAccountInitial(connection: IConnection): string {
      // Fallback glyph when the upstream provider returns no profile
      // photo (e.g. Microsoft Graph 404s ``/me/photo/$value`` for
      // personal @outlook.com accounts that never set a picture).
      const seed = this.connectionAccountName(connection);
      const ch = seed && seed !== '—' ? seed.trim().charAt(0) : '';
      return ch ? ch.toUpperCase() : '?';
    },
    connectionAccountSubtext(connection: IConnection): string {
      const email = connection.profile?.email as string;
      if (email && email !== connection.profile?.name) {
        return email;
      }
      return (connection.profile?.login as string) || '';
    },
    customAuthSummary(connection: IConnection): string {
      const metadata = this.oauthMetadata(connection);
      const authMethod = metadata.token_endpoint_auth_method || 'none';
      const registrationType = metadata.client_registration_type || 'dynamic';
      const issuer = (metadata.authorization_server_metadata || {}).issuer || metadata.authorization_server_url;
      return [registrationType, authMethod, issuer].filter(Boolean).join(' / ');
    },
    byocCredentialSummary(item: IListItem): string {
      // Concatenate the credential schema field labels (SecretId,
      // SecretKey, 默认地域 …) with a middot. Values are encrypted on
      // the backend and never echoed back, so this only confirms what
      // the user configured — same intent as ``customAuthSummary`` for
      // OAuth MCPs.
      const method =
        item.connection?.method_snapshot || resolveConnectorMethod(item.catalog, item.connection?.method_id);
      const schema = method?.credential.credential_schema || [];
      return schema
        .map((f) => f.label)
        .filter(Boolean)
        .join(' · ');
    },
    normalizedStatus(status: ConnectionStatus): string {
      return status.toString().toLowerCase();
    },
    statusLabel(status: ConnectionStatus): string {
      return String(this.$t(`connection.status.${this.normalizedStatus(status)}`));
    },
    statusTagType(status: ConnectionStatus): 'success' | 'warning' | 'danger' | 'info' {
      switch (this.normalizedStatus(status)) {
        case 'active':
          return 'success';
        case 'expired':
          return 'warning';
        case 'revoked':
          return 'danger';
        default:
          return 'info';
      }
    },
    browserDeviceStatusLabel(connection: IConnection): string {
      const status = connection.browser_device?.status;
      return status ? String(this.$t(`user.browserDevice.status.${status}`)) : this.statusLabel(connection.status);
    },
    browserDeviceStatusTagType(connection: IConnection): 'success' | 'warning' | 'danger' | 'info' {
      const device = connection.browser_device;
      if (device && !device.compatible) {
        return device.incompatibility_reason === 'device_offline' ? 'warning' : 'danger';
      }
      const status = device?.status;
      if (!status) return this.statusTagType(connection.status);
      switch (status.toLowerCase()) {
        case 'active':
          return 'success';
        case 'pending':
          return 'warning';
        case 'suspended':
        case 'quarantined':
        case 'revoked':
          return 'danger';
        default:
          return 'info';
      }
    },
    browserDeviceCompatibilityLabel(connection: IConnection): string {
      const device = connection.browser_device;
      if (!device) return this.statusLabel(connection.status);
      if (device.compatible) return String(this.$t('connection.message.browserCompatible'));
      return String(this.$t(`connection.message.browserIncompatibility.${device.incompatibility_reason}`));
    },
    /** Returns whether ``connections`` was actually refreshed — false when the
     *  request failed or a newer one superseded it. Callers that need to tell
     *  "refreshed and genuinely absent" from "never refreshed" check this;
     *  everyone else can ignore it. */
    async fetchConnections(): Promise<boolean> {
      const requestId = ++this.connectionsRequestId;
      this.loading = true;
      try {
        const { data } = await connectionOperator.list();
        if (requestId !== this.connectionsRequestId) return false;
        this.connections = (data || []).filter(
          (connection) =>
            connection.execution_type !== 'browser_device' || this.normalizedStatus(connection.status) === 'active'
        );
        return true;
      } catch (error) {
        console.error('Failed to load connections', error);
        return false;
      } finally {
        if (requestId === this.connectionsRequestId) this.loading = false;
      }
    },
    async fetchCatalog() {
      // Pull the FULL localized connector catalog from the same
      // endpoint Browse Connectors uses. We need every connection method
      // here, not just ``oauth_static``:
      //  - ``oauth_static`` powers the "available to connect" list
      //    (filtered below in ``items``).
      //  - ``oauth_dcr`` / ``byoc`` / ``public`` rows are
      //    needed so marketplace-installed connections (e.g.
      //    ``acedata/suno``, ``acedata/seedream``, ``acedata/serp``)
      //    can join via ``Connection.connector_identifier`` and pick
      //    up the localized ``name`` / ``icon_url`` / ``description``
      //    / ``permissions`` from the catalog. Without this, the
      //    connected-list left rail and right pane render the
      //    fallback plug icon and a bare ``server_url``.
      this.loadingCatalog = true;
      try {
        const { data } = await connectionOperator.listCatalog({
          sort: 'popular',
          limit: 200
        });
        this.catalog = data?.items || [];
      } catch (error) {
        console.error('Failed to load connector catalog', error);
      } finally {
        this.loadingCatalog = false;
      }
    },
    /**
     * Open Studio's chat with this suggestion's prompt pre-filled in the
     * composer. We're already inside Studio, so this is an in-app route
     * push (the AuthFrontend original cross-navigated to
     * ``BASE_URL_STUDIO`` and had to carry ``user_id`` for the identity
     * guard — neither is needed here).
     *
     * ``query`` is what Conversation.vue's mounted hook reads and then
     * strips via ``router.replace`` so a reload doesn't refire it. The
     * prompt is already localized server-side.
     */
    onSuggestionClick(s: IConnectorSuggestion) {
      const promptText = s.prompt;
      if (!promptText) return;
      const group = s.model_group || 'claude';
      this.$router.push({
        path: `/${group}/conversations`,
        query: {
          query: promptText,
          source: 'connector_suggestion',
          suggestion_id: s.id,
          ...(this.selectedItem?.catalog?.identifier ? { connector: this.selectedItem.catalog.identifier } : {})
        }
      });
    },
    async onConnect(catalog: IConnectorCatalogItem, createNew = false) {
      if (!catalog.installable) return;
      this.pendingCreateNew = createNew;
      // Multi-method connectors: let the user pick how to connect
      // first. Single-method connectors skip the picker.
      if (getConnectorMethods(catalog).length > 1) {
        this.pickerCatalog = catalog;
        this.pickerVisible = true;
        return;
      }
      const method = resolveConnectorMethod(catalog);
      if (!method) return;
      await this.connectWithMethod(catalog, method);
    },
    /** Drop a pending add-account intent. Called from every path that ends a
     *  connect flow without installing, so a later ordinary connect can't
     *  inherit `create_new` and silently duplicate an account. */
    clearCreateNewIntent() {
      this.pendingCreateNew = false;
    },
    onMethodSelected(payload: { item: IConnectorCatalogItem; method: IConnectorConnectionMethod }) {
      this.pickerVisible = false;
      this.connectWithMethod(payload.item, payload.method);
    },
    async connectWithMethod(catalog: IConnectorCatalogItem, method: IConnectorConnectionMethod) {
      if (method.execution.type === 'browser_device') {
        this.browserRebindConnectionId = null;
        this.browserDialogCatalog = catalog;
        this.browserDialogMethod = method;
        this.browserDevicePickerVisible = true;
        return;
      }
      // BYOC methods open the credential form directly — no upstream
      // redirect, so the OAuth-flavour "we'll bounce you to <provider>"
      // confirmation copy doesn't apply. The dialog reads the schema /
      // cookie domains / login url from the chosen method.
      if (method.credential.type === 'user_secret' || method.credential.type === 'cookie_jar') {
        this.byocDialogCatalog = catalog;
        this.byocDialogMethod = method;
        this.byocDialogVisible = true;
        return;
      }
      const perms = method.permissions || [];
      // If the method exposes more than one permission, pop the
      // scope-selection dialog so the user can opt out of any they
      // don't want to grant. With 0 or 1 permissions there's nothing
      // to choose, fall straight through to the consent confirmation.
      if (perms.length > 1) {
        this.scopeDialogCatalog = catalog;
        this.scopeDialogMethod = method;
        this.selectedScopes = perms.map((p) => p.id);
        this.scopeDialogVisible = true;
        return;
      }
      try {
        await ElMessageBox.confirm(
          this.$t('connection.message.connectConfirm', { provider: catalog.name || catalog.identifier }),
          '',
          {
            confirmButtonText: this.$t('common.button.confirm'),
            cancelButtonText: this.$t('common.button.cancel'),
            roundButton: true
          }
        );
      } catch {
        return;
      }
      await this.startAuthorize(catalog, method, undefined);
    },
    async onConfirmScopes() {
      const catalog = this.scopeDialogCatalog;
      const method = this.scopeDialogMethod;
      if (!catalog || !method) {
        return;
      }
      const scopes = [...this.selectedScopes];
      this.scopeDialogVisible = false;
      this.scopeDialogCatalog = null;
      this.scopeDialogMethod = null;
      this.selectedScopes = [];
      await this.startAuthorize(catalog, method, scopes);
    },
    async startAuthorize(
      catalog: IConnectorCatalogItem,
      method: IConnectorConnectionMethod,
      scopes: string[] | undefined
    ) {
      // Funnel through the catalog install endpoint — same code path
      // BrowseConnectors uses — so the resulting connection is
      // stamped with ``connector_identifier`` and the right-pane join
      // picks up display fields from the catalog row.
      try {
        const { data } = await connectionOperator.installFromCatalog(catalog.id, {
          scopes: scopes && scopes.length ? scopes : undefined,
          return_url: popupReturnUrl(),
          method_id: method.id,
          // Only set when the user explicitly chose "add another account";
          // omitting it keeps the backend on slot 0, i.e. re-authorizing
          // overwrites the existing account instead of duplicating it.
          ...(this.pendingCreateNew ? { create_new: true } : {})
        });
        if (data && (data as any).type === 'form') {
          // Defensive: an OAuth/public method shouldn't return a form,
          // but if it does, open the credential dialog with the chosen
          // method (its schema drives the form). The dialog handles the
          // POST /credentials/ submit + the inline "已添加" state flip
          // via the `installed` event.
          this.byocDialogCatalog = catalog;
          this.byocDialogMethod = method;
          this.byocDialogVisible = true;
          return;
        }
        if (data && (data as any).authorization_url) {
          await this.runAuthorizePopup((data as any).authorization_url);
        } else if (data && (data as any).type === 'active') {
          // Zero-step flow (public) — refresh the list.
          await this.fetchConnections();
        }
      } catch (error: any) {
        this.pendingCreateNew = false;
        ElMessage.error(error?.response?.data?.detail || error?.message || 'Failed to start authorization');
      }
    },
    /**
     * Run the consent flow on this surface, then refresh. Web gets a popup,
     * native the in-app browser, desktop the system browser — all three
     * resolve on "the flow ended", and the server is the authority on what
     * actually connected, so we always refetch.
     */
    async runAuthorizePopup(authorizationUrl: string) {
      try {
        await openAuthorizeFlow(authorizationUrl);
      } catch (error: any) {
        this.pendingCreateNew = false;
        ElMessage.error(
          error?.message === 'desktop-authorize-unsupported'
            ? (this.$t('connection.message.desktopUpdateRequired') as string)
            : error?.message || (this.$t('connection.message.installFailed') as string)
        );
        return;
      }
      this.pendingCreateNew = false;
      await this.fetchConnections();
    },
    openCustomDialog() {
      this.customDialogVisible = true;
    },
    onAddCommand(command: 'browse' | 'custom') {
      if (command === 'browse') {
        this.browseDialogVisible = true;
      } else if (command === 'custom') {
        this.openCustomDialog();
      }
    },
    /** Called by BrowseConnectors when a zero-step install (public) lands.
     *  Refresh the My Connectors list AND the catalog so
     *  the new row's ``installed`` flag flips to true and the row
     *  disappears from "available to connect". */
    async onCatalogInstalled() {
      // The add-account intent is single-use: clear it once the install
      // resolves, so a later reconnect can't inherit a stale `true` and
      // silently create a duplicate account.
      this.pendingCreateNew = false;
      await Promise.all([this.fetchConnections(), this.fetchCatalog()]);
    },
    openBrowserPairing() {
      this.browserDevicePickerVisible = false;
      this.pairingDialogVisible = true;
    },
    clearBrowserDialog() {
      this.browserDevicePickerVisible = false;
      this.browserRebindConnectionId = null;
      this.browserDialogCatalog = null;
      this.browserDialogMethod = null;
      this.pendingCreateNew = false;
    },
    onBrowserPickerVisibility(visible: boolean) {
      if (visible) return;
      this.$nextTick(() => {
        if (!this.pairingDialogVisible && !this.browserInstalling) this.clearBrowserDialog();
      });
    },
    openBrowserRebind(connection: IConnection) {
      const catalog = this.catalogForConnection(connection);
      const method = connection.method_snapshot;
      if (!catalog || !method) return;
      this.browserRebindConnectionId = connection.id;
      this.browserDialogCatalog = catalog;
      this.browserDialogMethod = method;
      this.browserDevicePickerVisible = true;
    },
    onBrowserPaired(device: IBrowserDevice) {
      this.pairedBrowserDevice = device;
      this.pairingDialogVisible = false;
    },
    async onBrowserPairingClosed() {
      if (this.browserDialogCatalog && this.browserDialogMethod) {
        const pairedDevice = this.pairedBrowserDevice;
        this.pairedBrowserDevice = null;
        if (pairedDevice) {
          const picker = this.$refs.browserDevicePicker as InstanceType<typeof BrowserDevicePicker> | undefined;
          await picker?.refreshAfterPair(pairedDevice);
        } else {
          this.browserDevicePickerVisible = true;
        }
        return;
      }
      this.pairedBrowserDevice = null;
      this.clearBrowserDialog();
    },
    async stopBrowserSessions(connection: IConnection) {
      this.refreshingId = connection.id;
      try {
        const { data } = await connectionOperator.stopBrowserSessions(connection.id);
        ElMessage.success(
          this.$t('connection.message.browserSessionsStopped', { count: data.stopped_session_count }) as string
        );
        await this.fetchConnections();
      } catch (error: any) {
        ElMessage.error(error?.response?.data?.detail || this.$t('connection.message.browserSessionStopFailed'));
      } finally {
        this.refreshingId = null;
      }
    },
    async onBrowserDeviceSelected(browserDeviceId: string) {
      const catalog = this.browserDialogCatalog;
      const method = this.browserDialogMethod;
      if (!catalog || !method) return;
      this.browserInstalling = true;
      try {
        if (this.browserRebindConnectionId) {
          const { data } = await connectionOperator.rebindBrowserDevice(
            this.browserRebindConnectionId,
            browserDeviceId
          );
          this.connections = this.connections.map((connection) => (connection.id === data.id ? data : connection));
          this.browserDevicePickerVisible = false;
          this.browserRebindConnectionId = null;
          this.browserDialogCatalog = null;
          this.browserDialogMethod = null;
          ElMessage.success(this.$t('connection.message.browserRebindSuccess') as string);
          return;
        }
        const { data } = await connectionOperator.installFromCatalog(catalog.id, {
          return_url: popupReturnUrl(),
          method_id: method.id,
          browser_device_id: browserDeviceId
        });
        if (data.type !== 'active') {
          throw new Error(this.$t('connection.message.installFailed') as string);
        }
        this.browserDevicePickerVisible = false;
        this.browserDialogCatalog = null;
        this.browserDialogMethod = null;
        ElMessage.success(this.$t('connection.message.installed', { name: catalog.name }) as string);
        await this.onCatalogInstalled();
      } catch (error: any) {
        const message = error?.response?.data?.detail || error?.message || this.$t('connection.message.installFailed');
        const picker = this.$refs.browserDevicePicker as InstanceType<typeof BrowserDevicePicker> | undefined;
        picker?.showInstallError(String(message));
      } finally {
        this.browserInstalling = false;
      }
    },
    async onConnectCustom() {
      if (!this.customServerUrl) {
        return;
      }
      this.customAuthorizing = true;
      try {
        const { data } = await connectionOperator.authorizeCustom({
          name: this.customName || undefined,
          server_url: this.customServerUrl,
          client_id: this.customClientId || undefined,
          client_secret: this.customClientSecret || undefined,
          provider: 'mcp',
          return_url: popupReturnUrl()
        });
        if (data?.authorization_url) {
          this.customDialogVisible = false;
          await this.runAuthorizePopup(data.authorization_url);
        }
      } catch (error: any) {
        ElMessage.error(error?.response?.data?.detail || error?.message || 'Failed to start authorization');
      } finally {
        this.customAuthorizing = false;
      }
    },
    /** Re-run the connector's authorization flow for an already-connected
     *  row so a broken / expired / revoked connection can be re-authorized
     *  (or the account switched) in place — the backend install is
     *  idempotent and reuses the existing connection row.
     *
     *  Pin the connection's CURRENT method rather than routing through the
     *  generic ``onConnect``: on a multi-method connector ``onConnect`` would
     *  re-open the method picker and let the user pick a *different* method,
     *  which is a method switch (potential duplicate / orphaned row), not a
     *  reconnect. Resolve the live method via ``connection.method_id`` and
     *  drive ``connectWithMethod`` directly (scope dialog / BYOC form / OAuth
     *  confirm+redirect, no picker). Fall back to ``onConnect`` only when the
     *  method can't be resolved (legacy connection with no ``method_id``). */
    async onReconnect(catalog: IConnectorCatalogItem) {
      if (!catalog.installable) return;
      this.pendingCreateNew = false;
      const methodId = this.selectedItem?.connection?.method_id;
      const method = resolveConnectorMethod(catalog, methodId);
      if (method && methodId && method.id === methodId) {
        await this.connectWithMethod(catalog, method);
        return;
      }
      await this.onConnect(catalog);
    },
    /** Start a second (third, …) account of an already-connected connector. */
    onDetailAction(command: string) {
      const item = this.selectedItem;
      const conn = item?.connection;
      if (!item || !conn) return;
      switch (command) {
        case 'refresh':
          void this.onRefresh(conn);
          break;
        case 'rebind':
          this.openBrowserRebind(conn);
          break;
        case 'stopSessions':
          void this.stopBrowserSessions(conn);
          break;
        case 'reconnect':
          if (item.catalog) void this.onReconnect(item.catalog);
          break;
        case 'addAccount':
          if (item.catalog) void this.onAddAccount(item.catalog);
          break;
        case 'setDefault':
          void this.onSetDefault(conn);
          break;
        case 'rename':
          void this.onRename(conn);
          break;
        case 'disconnect':
          void this.onDisconnect(conn);
          break;
      }
    },
    /** "Add account" from a connected card in the Browse dialog. Closing the
     *  dialog first matters: the connect flow may redirect to an upstream
     *  consent screen, and leaving a modal open behind that navigation strands
     *  it on return. Routes into the exact same handler as the row menu so the
     *  two entry points can never drift. */
    async onBrowseAddAccount(payload: { item: IConnectorCatalogItem }) {
      this.browseDialogVisible = false;
      await this.onAddAccount(payload.item);
    },
    /** "Manage" from a connected card — close the dialog and select this
     *  connector's default account in the left rail, so the detail pane (and
     *  its "⋯" menu) takes over from here. */
    async onBrowseManage(payload: { item: IConnectorCatalogItem }) {
      this.browseDialogVisible = false;
      const identifier = payload.item.identifier;
      // A blank identifier would match every custom BYO connection (they
      // carry an empty ``connector_identifier``), so bail rather than
      // selecting an unrelated row.
      if (!identifier) return;
      // The dialog stays interactive through its leave transition, so two
      // Manage clicks can overlap. Without this token the first one's await
      // would resume against the second one's data and steal the selection.
      const token = ++this.manageRequestId;
      let target = this.findConnectionRow(identifier);
      let refreshed = true;
      if (!target) {
        // The install that produced this card may still be in flight (the
        // dialog's own optimistic flip runs ahead of fetchConnections), so
        // refetch once before giving up.
        refreshed = await this.fetchConnections();
        if (token !== this.manageRequestId) return;
        target = this.findConnectionRow(identifier);
      }
      if (!target) {
        // Only claim the connector is unavailable when we actually saw fresh
        // data; a failed or superseded refetch says nothing about it.
        if (refreshed) ElMessage.warning(this.$t('connection.message.manageUnavailable'));
        return;
      }
      // Selecting a row the rail is currently hiding would leave the user
      // staring at an unchanged list, so clear whatever is filtering it out.
      this.searchQuery = '';
      this.collapsedGroups = { ...this.collapsedGroups, [target.groupKey]: false };
      this.onSelect(target);
    },
    /** The row to open when managing ``identifier`` — its default account,
     *  falling back to the first one. Searches the rendered order for the same
     *  reason the ``?connect=`` deep link does: with several accounts the row
     *  the rail puts first is the one to land on. Prefers an active row: the
     *  badge counts only active accounts, so landing on an expired one would
     *  show the user something the badge never promised. */
    findConnectionRow(identifier: string): IListItem | null {
      const rows = this.orderedItems.filter((it) => it.connection?.connector_identifier === identifier);
      if (!rows.length) return null;
      // Every row here has a ``connection`` — the filter above matched on it.
      const active = rows.filter((it) => this.normalizedStatus(it.connection!.status) === 'active');
      const pool = active.length ? active : rows;
      return pool.find((it) => it.connection?.is_default) || pool[0];
    },
    async onAddAccount(catalog: IConnectorCatalogItem) {
      // Straight into the connect flow — no "name it first" prompt. Asking
      // before the account exists put up a dialog nearly identical to Rename
      // (users read it as "why is it renaming again?"), and at that point
      // there is nothing to name: which account you end up connecting is only
      // known after the upstream consent screen. The row falls back to the
      // upstream profile name, and Rename is there if you want your own.
      await this.onConnect(catalog, true);
    },
    async onSetDefault(row: IConnection) {
      try {
        await connectionOperator.setDefault(row.id);
        ElMessage.success(this.$t('connection.message.defaultUpdated'));
        await this.fetchConnections();
      } catch (error: any) {
        ElMessage.error(error?.response?.data?.detail || this.$t('connection.message.defaultUpdateFailed'));
      }
    },
    async onRename(row: IConnection) {
      let label: string;
      try {
        const { value } = await ElMessageBox.prompt(this.$t('connection.message.renamePrompt'), '', {
          confirmButtonText: this.$t('common.button.confirm'),
          cancelButtonText: this.$t('common.button.cancel'),
          // Prefill what the row shows today, so the dialog starts from the
          // name being replaced rather than an empty box the user has to
          // retype (which is how two accounts end up sharing one name).
          inputValue: this.connectionAccountLabel(row),
          inputValidator: (input: string) => (input || '').length <= 64,
          inputErrorMessage: this.$t('connection.message.renameTooLong'),
          roundButton: true
        });
        label = value || '';
      } catch {
        return;
      }
      try {
        await connectionOperator.rename(row.id, label);
        await this.fetchConnections();
      } catch (error: any) {
        ElMessage.error(error?.response?.data?.detail || this.$t('connection.message.renameFailed'));
      }
    },
    async onRefresh(row: IConnection) {
      this.refreshingId = row.id;
      try {
        await connectionOperator.refresh(row.id);
        ElMessage.success(this.$t('connection.message.refreshed'));
        await this.fetchConnections();
      } catch (error: any) {
        ElMessage.error(error?.response?.data?.detail || this.$t('connection.message.refreshFailed'));
      } finally {
        this.refreshingId = null;
      }
    },
    async onDisconnect(row: IConnection) {
      try {
        await ElMessageBox.confirm(
          this.$t('connection.message.disconnectConfirm', { provider: this.connectionProviderName(row) }),
          '',
          {
            confirmButtonText: this.$t('common.button.confirm'),
            cancelButtonText: this.$t('common.button.cancel'),
            type: 'warning',
            roundButton: true
          }
        );
      } catch {
        return;
      }
      try {
        await connectionOperator.disconnect(row.id);
        const deletedKey = `connection:${row.id}`;
        this.connections = this.connections.filter((connection) => connection.id !== row.id);
        if (this.selectedKey === deletedKey) {
          this.selectedKey = this.orderedItems[0]?.key || null;
        }
        ElMessage.success(this.$t('connection.message.disconnected', { provider: this.connectionProviderName(row) }));
        await this.fetchConnections();
      } catch (error: any) {
        ElMessage.error(error?.response?.data?.detail || error?.message || 'Failed to disconnect');
      }
    }
  }
});
</script>

<style lang="scss" scoped>
// The full-height flex column comes from the layout (`.panel--workspace`,
// selected by this route's `meta.layout`), so the page only lays out its
// own content.
.connectors-page {
  display: contents;
}

.connectors-shell {
  flex: 1 1 auto;
  min-height: 0;
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 0;
  // `--adc-radius-card` / `--app-border-subtle` are global tokens (see
  // @acedatacloud/core styles.css and _common.scss). The previous
  // `--el-card-border-radius` was scoped *inside* Element Plus's `.el-card`
  // rule, so this non-card element never inherited it and silently rendered
  // square — same failure as the `--page-card-radius` it replaced.
  border: 1px solid var(--app-border-subtle);
  border-radius: var(--adc-radius-card);
  background: var(--el-card-bg-color);
  overflow: hidden;
  box-shadow: var(--app-shadow-xs);
}

// el-card gets a glass treatment in dark mode (see _common.scss). This pane
// isn't an el-card, so mirror it or the page reads flat next to Applications.
html.dark .connectors-shell {
  background: var(--app-glass-bg);
  backdrop-filter: blur(var(--app-glass-blur));
  border-color: var(--app-glass-border);
}

.connectors-list {
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  min-height: 0;
}

.list-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 14px 12px;
}

// Styling comes from the global `.el-input__wrapper` rules in
// _common.scss, so the field matches every other input in the console.
.search-input {
  flex: 1 1 auto;
}

.add-button {
  flex: 0 0 auto;
  width: 34px;
  height: 34px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-bg-color);
  color: var(--el-text-color-regular);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;

  &:hover {
    border-color: var(--el-color-primary);
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }
}

.actions-button {
  flex: 0 0 auto;
  width: 32px;
  height: 32px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-bg-color);
  color: var(--el-text-color-regular);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;

  &:hover {
    border-color: var(--el-color-primary);
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }
}

.list-scroll {
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 4px 8px 16px;
  min-height: 0;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--el-border-color-lighter);
    border-radius: 3px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: var(--el-border-color-light);
  }
}

.list-group {
  margin-bottom: 6px;
}

.group-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 8px 6px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  user-select: none;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.group-chevron {
  font-size: 9px;
  width: 10px;
  color: var(--el-text-color-placeholder);
}

.group-chevron-button {
  display: inline-flex;
  padding: 0;
  color: inherit;
  background: transparent;
  border: 0;
  cursor: pointer;
}

.group-title {
  font-weight: 600;
}

.group-items {
  list-style: none;
  margin: 0;
  padding: 0;
}

.list-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  margin: 1px 0;
  // Match the console sidebar's nav rows (SidePanel.vue): same radius, same
  // hover fill, so the two lists sitting side by side agree.
  border-radius: 10px;
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s;
  position: relative;

  &:hover {
    background: var(--el-fill-color-extra-light);
  }

  &.active {
    background: var(--el-color-primary-light-9);

    .list-item-name {
      color: var(--el-color-primary);
      font-weight: 500;
    }

    .list-item-icon {
      color: var(--el-color-primary);
    }
  }
}

.list-item-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: var(--el-text-color-regular);
  flex-shrink: 0;
  transition: color 0.15s;

  img {
    width: 20px;
    height: 20px;
    border-radius: 4px;
    object-fit: contain;
  }
}

.list-item-name {
  flex: 1 1 auto;
  font-size: 13px;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition:
    color 0.15s,
    font-weight 0.15s;
}

.list-item-badge {
  flex-shrink: 0;
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.04em;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color);
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
}

.list-item-badge-hint {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.list-item-badge-default {
  color: var(--el-color-success);
  background: var(--el-color-success-light-9);
}

.list-item-account {
  flex: 0 1 auto;
  min-width: 0;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.list-footer {
  flex: 0 0 auto;
  padding: 8px 14px 14px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.browse-all-button {
  width: 100%;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 12px;
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-light);
  border: 1px dashed var(--el-border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    color: var(--el-color-primary);
    border-color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }
}

.list-empty {
  text-align: center;
  padding: 40px 16px;
  font-size: 13px;
  color: var(--el-text-color-placeholder);
}

// --- Initial-load skeleton ----------------------------------------
// Reuse the .list-item / .group-header geometry so the skeleton
// matches the real list row-for-row (no layout shift when content
// arrives). We only need to suppress the hover/cursor affordances.
.skeleton-header,
.skeleton-item {
  cursor: default;
  pointer-events: none;
}

.skeleton-item {
  &:hover {
    background: transparent;
  }
}

.detail-skeleton {
  padding: 4px;
}

.detail-skeleton-header {
  display: flex;
  align-items: center;
}

.detail-skeleton-section {
  margin-top: 32px;
}

.connectors-detail {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 28px 32px;
  background: var(--el-bg-color);
  min-height: 0;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--el-border-color-lighter);
    border-radius: 3px;
  }
}

.detail-empty {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--el-text-color-secondary);
}

.detail-empty-icon {
  width: 36px;
  height: 36px;
  color: var(--el-text-color-placeholder);
  margin-bottom: 14px;
}

.detail-empty-title {
  font-size: 15px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  margin: 0 0 4px;
}

.detail-empty-hint {
  font-size: 13px;
  margin: 0;
  max-width: 360px;
}

.browser-session {
  padding: 20px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-extra-light);
}

.browser-session-heading {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
}

.browser-session-icon {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 8px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  font-size: 18px;
}

.browser-session-copy {
  display: grid;
  gap: 3px;
  min-width: 0;

  strong {
    color: var(--el-text-color-primary);
    font-size: 14px;
  }

  span {
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 1.5;
  }
}

.browser-session-meta {
  margin-top: 20px;
}

.browser-capabilities {
  display: grid;
  gap: 8px;
  margin-top: 18px;
}

.browser-capabilities-label {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.browser-capability-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.detail-header {
  margin-bottom: 24px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  padding-bottom: 18px;
}

.detail-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.detail-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: var(--el-fill-color-light);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: var(--el-text-color-regular);
  flex-shrink: 0;

  img {
    width: 24px;
    height: 24px;
    border-radius: 4px;
    object-fit: contain;
  }
}

.detail-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0;
}

.detail-custom-tag {
  margin-left: -4px;
}

.detail-actions {
  margin-left: auto;
  display: flex;
  gap: 4px;
}

.detail-server-url,
.detail-description {
  margin: 10px 0 0 48px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  word-break: break-all;
}

.overview-text {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-regular);
  /* Catalog descriptions carry hard line breaks + dash bullets from the
     backend seed; preserve them instead of collapsing to one blob. */
  white-space: pre-line;
  word-break: break-word;
}

.detail-section {
  margin-bottom: 24px;
}

.section-heading {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.section-count {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color);
  padding: 1px 8px;
  border-radius: 10px;
}

.section-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin: 0 0 12px;
}

.account-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
}

.account-avatar-fallback {
  background: var(--el-color-primary-light-8);
  color: var(--el-color-primary);
  font-size: 16px;
  font-weight: 600;
}

.account-info {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.account-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-sub {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.permission-list {
  list-style: none;
  margin: 0;
  padding: 0;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  overflow: hidden;
}

.permission-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  font-size: 13px;
  color: var(--el-text-color-primary);
  border-bottom: 1px solid var(--el-border-color-lighter);

  &:last-child {
    border-bottom: 0;
  }
}

.permission-name {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.permission-tool-name {
  font-family: var(--el-font-family-monospace, ui-monospace, SFMono-Regular, monospace);
  font-size: 13px;
  color: var(--el-text-color-primary);
  word-break: break-word;
}

.permission-scope-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  line-height: 1.4;
}

.permission-tool-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
  /* Truncate long descriptions to keep rows tidy. */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.permission-empty {
  font-size: 13px;
  color: var(--el-text-color-placeholder);
  padding: 12px 0;
  margin: 0;

  &.error {
    color: var(--el-color-danger);
  }
}

/* "Try It" suggested-prompt section. Visually lighter than the
   permission rows so it doesn't compete for attention with the
   security-relevant tool list. */
.suggestion-list {
  list-style: none;
  margin: 0;
  padding: 0;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  overflow: hidden;
}

.suggestion-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  font-size: 13px;
  color: var(--el-text-color-primary);
  border-bottom: 1px solid var(--el-border-color-lighter);
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:last-child {
    border-bottom: 0;
  }

  &:hover,
  &:focus-visible {
    background: var(--el-fill-color-lighter);
    outline: none;
  }
}

/* Locked "Try It" rows — shown on connectors the user hasn't actively
   connected yet. A hover tooltip explains they must connect first, so we
   strip the click affordance (cursor + hover highlight) and dim the row. */
.suggestion-row.locked {
  cursor: not-allowed;
  opacity: 0.65;

  &:hover,
  &:focus-visible {
    background: transparent;
  }

  /* Keep the CTA muted even on hover. The base ``.suggestion-row:hover
     .suggestion-cta`` rule (turns it primary) has equal specificity, so we
     must match its :hover/:focus-visible selectors here to win on order. */
  .suggestion-cta,
  &:hover .suggestion-cta,
  &:focus-visible .suggestion-cta {
    color: var(--el-text-color-placeholder);
  }
}

.suggestion-icon {
  flex: 0 0 auto;
  font-size: 13px;
  color: var(--el-color-warning);
}

.suggestion-text {
  flex: 1 1 auto;
  min-width: 0;
  line-height: 1.45;
  /* Long prompts wrap to a second line; we don't truncate because
     the user wants to read what they're about to send. */
  overflow-wrap: anywhere;
}

.suggestion-cta {
  flex: 0 0 auto;
  font-size: 11px;
  color: var(--el-text-color-placeholder);

  .suggestion-row:hover &,
  .suggestion-row:focus-visible & {
    color: var(--el-color-primary);
  }
}

/* Per-bundle row inside the scope-selection dialog. The label sits
 * inline with the checkbox, and the optional description hangs
 * underneath, indented to align with the label so the row reads as
 * a single thought. */
.scope-dialog-row {
  margin-bottom: 14px;

  &:last-child {
    margin-bottom: 0;
  }
}

.scope-dialog-label {
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.scope-dialog-desc {
  margin: 4px 0 0;
  /* Indent past the checkbox glyph (~22px) so the description aligns
   * with the label text. */
  padding-left: 22px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
}

.meta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin: 0;

  dt {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-bottom: 4px;
  }

  dd {
    margin: 0;
    font-size: 13px;
    color: var(--el-text-color-primary);
  }

  .muted {
    color: var(--el-text-color-placeholder);
  }
}

.custom-dialog-intro {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin: 0 0 16px;
  line-height: 1.5;
}

.custom-dialog-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.advanced-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  align-self: flex-start;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--el-text-color-primary);
  cursor: pointer;
  font-size: 13px;
}

.advanced-fields {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.custom-trust-copy {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.5;
  margin: 4px 0 0;
}

@media screen and (max-width: 767px) {
  .connectors-shell {
    grid-template-columns: 1fr;
  }

  .connectors-list {
    border-right: 0;
    border-bottom: 1px solid var(--el-border-color-light);
    max-height: 280px;
  }

  .connectors-detail {
    padding: 18px;
  }
}
</style>

<!-- Dropdown menus are teleported to body, and `el-dropdown-item` renders a
     multi-root fragment, so Vue never stamps this component's `data-v-` hash
     onto its `<li>`. A scoped rule therefore cannot reach it — this block is
     intentionally unscoped and namespaced by the menu class instead. -->
<style lang="scss">
// Element Plus ships a 4px popper radius, which reads noticeably squarer than
// the 8px this page uses everywhere else (cards, list rows, the toolbar
// buttons). Match the surrounding language instead.
// `.is-pure` is on the same node and also zeroes the padding at equal
// specificity, so match it explicitly rather than relying on emit order.
.connection-actions-popper.el-popper.is-pure {
  border-radius: 8px;
  padding: 4px;

  .el-dropdown-menu {
    padding: 0;
  }

  .el-dropdown-menu__item {
    border-radius: 6px;
    padding: 7px 12px;
    line-height: 1.4;
  }

  // Element draws the divider as its own separator <li> carrying a border-top
  // (not a pseudo-element on the item), and gives it `margin: 6px 0`. Override
  // both sides — setting only margin-top left the rule sitting 4px below the
  // item above but 6px above the one below, visibly off-centre.
  .el-dropdown-menu__item--divided {
    margin: 4px 0;
  }
}

// Nested under the popper so the whole global block is namespaced — nothing
// else that happens to use these class names can inherit red-on-hover.
.connection-actions-popper.el-popper .connection-actions-menu {
  .actions-item-danger {
    color: var(--el-color-danger);

    &:not(.is-disabled):focus,
    &:not(.is-disabled):hover {
      color: var(--el-color-danger);
      background-color: var(--el-color-danger-light-9);
    }
  }
}
</style>
