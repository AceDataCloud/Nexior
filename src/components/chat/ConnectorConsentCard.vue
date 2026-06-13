<template>
  <div class="connector-consent-card" :class="{ 'is-resolved': resolved }">
    <div class="ccc-header">
      <font-awesome-icon icon="fa-solid fa-shield-halved" class="header-icon" />
      <span class="header-title">{{ $t('chat.consent.title') }}</span>
    </div>
    <p v-if="payload.rationale" class="ccc-rationale">{{ payload.rationale }}</p>

    <div
      v-for="req in requirements"
      :key="req.requirement_index"
      class="ccc-requirement"
      :class="{ 'is-satisfied': effectiveSatisfiedFor(req) }"
    >
      <div v-if="showMatchLabel(req)" class="ccc-req-match">
        {{ req.match === 'any' ? $t('chat.consent.matchAny') : $t('chat.consent.matchAll') }}
      </div>
      <ConnectorEntryRow
        v-for="entry in effectiveEntriesFor(req)"
        :key="entry.connector"
        :entry="entry"
        :catalog="catalogFor(entry)"
        :disabled="resolved || authorizingConnector !== ''"
        @authorize="onAuthorize"
      />
    </div>

    <div v-if="!resolved && (hasUnsatisfied || showContinueButton)" class="ccc-actions">
      <el-button v-if="hasUnsatisfied" text :disabled="authorizingConnector !== ''" @click="onSkip">
        {{ $t('chat.consent.skip') }}
      </el-button>
      <el-button
        v-if="showContinueButton"
        type="primary"
        :loading="refreshingStatus"
        :disabled="authorizingConnector !== ''"
        @click="onContinue"
      >
        {{ $t('chat.consent.continue') }}
      </el-button>
    </div>

    <div v-if="resolved" class="ccc-resolved-banner">
      {{ resolvedSummary }}
    </div>

    <!-- Scope picker — mirrors AuthFrontend's `pages/user/Connections.vue`
         so a multi-permission OAuth provider gives the user the same
         opt-out checklist regardless of entry surface. -->
    <el-dialog
      v-model="scopeDialogVisible"
      :title="
        scopeDialogCatalog ? ($t('chat.consent.selectScopes', { provider: scopeDialogCatalog.name }) as string) : ''
      "
      width="480px"
      :close-on-click-modal="false"
      append-to-body
    >
      <p class="ccc-scope-hint">{{ $t('chat.consent.selectScopesHint') }}</p>
      <el-checkbox-group v-model="selectedScopes">
        <div v-for="perm in scopeDialogCatalog?.permissions || []" :key="perm.id" class="ccc-scope-row">
          <el-checkbox :value="perm.id" :label="perm.id">
            <span class="ccc-scope-label">{{ perm.label || perm.id }}</span>
          </el-checkbox>
          <p v-if="perm.desc" class="ccc-scope-desc">{{ perm.desc }}</p>
        </div>
      </el-checkbox-group>
      <template #footer>
        <el-button :disabled="authorizingConnector !== ''" @click="scopeDialogVisible = false">
          {{ $t('common.button.cancel') }}
        </el-button>
        <el-button type="primary" :loading="authorizingConnector !== ''" @click="onConfirmScopes">
          {{ $t('common.button.confirm') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { ElButton, ElCheckbox, ElCheckboxGroup, ElDialog, ElMessage } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import type { IConsentRequestEntry, IConsentRequestPayload, IConsentRequestRequirement } from '@/models';
import ConnectorEntryRow from './ConnectorEntryRow.vue';
import { buildConsentOutput, unsatisfiedConnectors } from './connectorConsent';
import {
  getCatalogItem,
  installFromCatalog,
  listMyConnections,
  type IConnectorCatalogSummary
} from './connectorCatalogCache';

interface IData {
  resolvedAuthorized: string[];
  resolvedSkipped: string[];
  /** Catalog rows resolved from AuthBackend, keyed by `catalog_id`.
   *  Empty entries stay absent so the row renders the slug fallback
   *  until the fetch lands. */
  catalogs: Record<string, IConnectorCatalogSummary>;
  /** Scope-picker dialog state. The dialog opens when the user clicks
   *  Authorize on an entry whose catalog declares multiple permissions
   *  and `auth_mode !== 'byoc'`. Mirrors AuthFrontend's
   *  `pages/user/Connections.vue` flow so users see the same picker
   *  regardless of which surface they triggered it from. */
  scopeDialogVisible: boolean;
  scopeDialogEntry: IConsentRequestEntry | null;
  scopeDialogCatalog: IConnectorCatalogSummary | null;
  selectedScopes: string[];
  /** Tracks the entry currently being installed so its row button (and
   *  the dialog Confirm button) can show a loading spinner. */
  authorizingConnector: string;
  /** Live entry statuses fetched from AuthBackend after the OAuth
   *  round-trip — keyed by `IConsentRequestEntry.connector` (the
   *  catalog identifier). The worker-supplied `entry.status` is frozen
   *  at the moment the pending tool_use was emitted, so a successful
   *  install needs this overlay to flip the row from "Authorize" to
   *  "Connected". Empty until `refreshConnectionStatuses` runs. */
  liveStatuses: Record<string, 'connected' | 'unconnected'>;
  /** Becomes `true` after the first successful `listMyConnections`
   *  call. Gates the "Continue" CTA so we don't surface it before
   *  we've actually verified the install — a worker payload that
   *  arrives already-satisfied (no live re-check) still renders the
   *  no-action layout. */
  hasCheckedStatuses: boolean;
  /** Loading flag for the in-flight `listMyConnections` call; drives
   *  the spinner on the "Continue" button. */
  refreshingStatus: boolean;
}

export default defineComponent({
  name: 'ConnectorConsentCard',
  components: { ConnectorEntryRow, ElButton, ElCheckbox, ElCheckboxGroup, ElDialog, FontAwesomeIcon },
  props: {
    /** Tool-use block id; sent back as `tool_use_id` on resume. */
    toolUseId: {
      type: String,
      required: true
    },
    payload: {
      type: Object as PropType<IConsentRequestPayload>,
      required: true
    },
    /**
     * When `true`, render the read-only resolved view. `previousOutput`
     * (the JSON string the user submitted previously) MUST be provided so
     * the card can show what was authorized vs skipped.
     */
    resolved: {
      type: Boolean,
      default: false
    },
    previousOutput: {
      type: String,
      default: ''
    }
  },
  emits: ['submit', 'authorize'],
  data(): IData {
    return {
      resolvedAuthorized: [],
      resolvedSkipped: [],
      catalogs: {},
      scopeDialogVisible: false,
      scopeDialogEntry: null,
      scopeDialogCatalog: null,
      selectedScopes: [],
      authorizingConnector: '',
      liveStatuses: {},
      hasCheckedStatuses: false,
      refreshingStatus: false
    };
  },
  computed: {
    requirements(): IConsentRequestRequirement[] {
      return this.payload?.requirements ?? [];
    },
    /** Per-entry overlay: if a live status came back from AuthBackend
     *  after the OAuth round-trip, use it; otherwise fall back to the
     *  worker-supplied `entry.status`. Centralized here so template +
     *  `onContinue` agree on the same effective status without each
     *  spreading the override inline. */
    effectiveStatus() {
      return (entry: IConsentRequestEntry): 'connected' | 'unconnected' => {
        return this.liveStatuses[entry.connector] ?? entry.status;
      };
    },
    /** Entries with `status` rebound to the live-overlaid value, so
     *  `<ConnectorEntryRow>` (which keys its display off `entry.status`)
     *  flips from Authorize → Connected without us mutating the prop. */
    effectiveEntriesFor() {
      return (req: IConsentRequestRequirement): IConsentRequestEntry[] => {
        return req.entries.map((entry) => {
          const live = this.liveStatuses[entry.connector];
          if (!live || live === entry.status) return entry;
          return { ...entry, status: live };
        });
      };
    },
    /** A requirement is effectively satisfied when:
     *  - `match === 'any'` and ≥1 effective entry is connected, OR
     *  - `match === 'all'` and every effective entry is connected.
     *  This mirrors the worker-side ``satisfied`` rule so the live
     *  overlay can flip a not-yet-resolved requirement to satisfied
     *  after a successful install. */
    effectiveSatisfiedFor() {
      return (req: IConsentRequestRequirement): boolean => {
        const statuses = req.entries.map((e) => this.effectiveStatus(e));
        if (statuses.length === 0) return req.satisfied;
        if (req.match === 'all') return statuses.every((s) => s === 'connected');
        return statuses.some((s) => s === 'connected');
      };
    },
    hasUnsatisfied(): boolean {
      return this.requirements.some((r) => !this.effectiveSatisfiedFor(r));
    },
    /** Continue CTA visibility. We only show Continue after the live
     *  refresh has lifted at least one entry from unconnected → connected
     *  (`hasCheckedStatuses === true`) AND every requirement is now
     *  effectively satisfied. Without `hasCheckedStatuses` an already-
     *  satisfied worker payload (e.g. the model proactively asked
     *  consent for an already-connected provider) would surface a
     *  Continue button the user never asked for. */
    showContinueButton(): boolean {
      if (this.resolved) return false;
      if (!this.hasCheckedStatuses) return false;
      return !this.hasUnsatisfied;
    },
    resolvedSummary(): string {
      if (this.resolvedAuthorized.length > 0) {
        return this.$t('chat.consent.resolvedAuthorized', {
          list: this.resolvedAuthorized.join(', ')
        }) as string;
      }
      return this.$t('chat.consent.resolvedSkipped') as string;
    }
  },
  watch: {
    resolved: {
      immediate: true,
      handler(val: boolean) {
        if (val) this.parsePreviousOutput();
      }
    },
    previousOutput: {
      immediate: false,
      handler() {
        if (this.resolved) this.parsePreviousOutput();
      }
    },
    payload: {
      immediate: true,
      deep: false,
      handler() {
        this.refreshCatalogs();
      }
    }
  },
  mounted() {
    // After the OAuth full-page redirect, the user lands back on the
    // chat URL we stamped in `performInstall` — `?consent=<rid>` where
    // `<rid>` is THIS card's `consent_request_id`. The frozen
    // worker-supplied `entry.status` won't reflect the just-created
    // connection, so we re-read the calling user's connections from
    // AuthBackend and overlay statuses. No URL match → no refresh.
    if (this.shouldRefreshFromReturn()) {
      this.refreshConnectionStatuses();
    }
  },
  methods: {
    showMatchLabel(req: IConsentRequestRequirement): boolean {
      // Only meaningful when there are 2+ candidates AND the requirement
      // hasn't been satisfied yet — once the live overlay flips an
      // entry to connected the "either of these" prompt is stale.
      return req.entries.length > 1 && !this.effectiveSatisfiedFor(req);
    },
    /** Look up the catalog row a `ConnectorEntryRow` should render with.
     *  Returns `null` until `refreshCatalogs` has populated the entry. */
    catalogFor(entry: IConsentRequestEntry): IConnectorCatalogSummary | null {
      return this.catalogs[entry.catalog_id] || null;
    },
    /** Fetch catalog rows for every unique `catalog_id` in the payload.
     *  De-duped at the cache layer; safe to call repeatedly. */
    async refreshCatalogs(): Promise<void> {
      const ids = new Set<string>();
      for (const req of this.requirements) {
        for (const entry of req.entries) {
          if (entry.catalog_id) ids.add(entry.catalog_id);
        }
      }
      await Promise.all(
        Array.from(ids).map(async (id) => {
          if (this.catalogs[id]) return;
          const item = await getCatalogItem(id);
          if (item) {
            // Re-assign so Vue 3 reactivity picks up the new key.
            this.catalogs = { ...this.catalogs, [id]: item };
          }
        })
      );
    },
    onAuthorize(entry: IConsentRequestEntry) {
      // Decision tree (mirrors AuthFrontend's `pages/user/Connections.vue`
      // so the picker UX is identical regardless of surface):
      //
      //   1. Catalog not yet loaded (or unknown id) → fall through to the
      //      legacy `authorize` emit so the parent can use the
      //      worker-provided `entry.install_url` as a hard fallback.
      //   2. `auth_mode === 'byoc'` → emit; BYOC needs the AuthFrontend
      //      credential form which Nexior does not host.
      //   3. `installable === false` → emit; the catalog row is in a
      //      state where AuthBackend would refuse the inline install
      //      anyway, so let AuthFrontend render whatever copy it wants.
      //   4. `permissions.length > 1` → open the scope picker.
      //   5. Otherwise → install immediately with no `scopes` (server
      //      picks the catalog default).
      const catalog = this.catalogFor(entry);
      if (!catalog || catalog.auth_mode === 'byoc' || !catalog.installable) {
        this.$emit('authorize', { tool_use_id: this.toolUseId, entry });
        return;
      }
      const perms = catalog.permissions || [];
      if (perms.length > 1) {
        this.scopeDialogEntry = entry;
        this.scopeDialogCatalog = catalog;
        // Default-check every scope so the user has to opt OUT of perms
        // rather than opt IN — matches AuthFrontend behavior.
        this.selectedScopes = perms.map((p) => p.id);
        this.scopeDialogVisible = true;
        return;
      }
      this.performInstall(entry, undefined);
    },
    onConfirmScopes() {
      const entry = this.scopeDialogEntry;
      if (!entry) {
        this.scopeDialogVisible = false;
        return;
      }
      const scopes = [...this.selectedScopes];
      this.scopeDialogVisible = false;
      this.performInstall(entry, scopes);
    },
    /** POST to AuthBackend's catalog install endpoint and act on the
     *  response.
     *  - `type === 'redirect'`: navigate to the OAuth authorize URL.
     *  - `type === 'form'`: BYOC schema came back inline; we don't host
     *    the form so fall back to the legacy emit (AuthFrontend handles
     *    it via `entry.install_url`).
     *  - `type === 'active'`: zero-step provider — emit so the parent
     *    can mark the entry connected on the next refresh.
     *  - Any error: toast + emit as a last-ditch fallback. */
    async performInstall(entry: IConsentRequestEntry, scopes: string[] | undefined): Promise<void> {
      this.authorizingConnector = entry.connector;
      try {
        // Compose a return URL that brings the user back to the current
        // chat with the consent-resolution beacon (`?consent=<id>`)
        // matching the format `consentReturn` watches for. We strip any
        // stale `?connector=…` from a previous flow so AuthFrontend's
        // post-install redirect doesn't bounce us into another picker.
        const returnUrl = new URL(window.location.href);
        returnUrl.searchParams.set('consent', this.payload.consent_request_id);
        returnUrl.searchParams.delete('connector');
        const result = await installFromCatalog(entry.catalog_id, {
          scopes,
          return_url: returnUrl.toString()
        });
        if (result.type === 'redirect' && result.authorization_url) {
          window.location.href = result.authorization_url;
          return;
        }
        // `form` (BYOC schema returned inline) or `active` (zero-step) —
        // both are handled by the existing parent flow, which navigates
        // to `entry.install_url` (AuthFrontend's install page) where the
        // BYOC form is hosted and zero-step installs are confirmed.
        this.$emit('authorize', { tool_use_id: this.toolUseId, entry });
      } catch (error) {
        console.error('installFromCatalog failed', error);
        ElMessage.error(this.$t('chat.consent.installFailed') as string);
        // Last-ditch fallback: hand off to the worker's deep-link.
        this.$emit('authorize', { tool_use_id: this.toolUseId, entry });
      } finally {
        this.authorizingConnector = '';
      }
    },
    onSkip() {
      const skipped = unsatisfiedConnectors(this.payload);
      const output = buildConsentOutput(this.payload, [], skipped);
      this.$emit('submit', { tool_use_id: this.toolUseId, output });
    },
    /** True when the current URL carries `?consent=<my_consent_id>` —
     *  the beacon `performInstall` stamps on its `return_url` before
     *  the OAuth redirect. Read directly from `window.location` rather
     *  than the Vue Router query bag so the card doesn't have to be
     *  rendered inside a router context to work (the unit tests don't
     *  install vue-router, and the prod tree never renders the card
     *  outside one). */
    shouldRefreshFromReturn(): boolean {
      if (typeof window === 'undefined') return false;
      try {
        const params = new URL(window.location.href).searchParams;
        return params.get('consent') === this.payload?.consent_request_id;
      } catch {
        return false;
      }
    },
    /** Fetch the user's connections from AuthBackend and overlay any
     *  `status === 'active'` entries onto `liveStatuses`. Failures are
     *  logged but never surfaced — the user can still click Authorize
     *  again to retry. */
    async refreshConnectionStatuses(): Promise<void> {
      this.refreshingStatus = true;
      try {
        const connections = await listMyConnections();
        const connectedIds = new Set<string>();
        for (const c of connections) {
          const id = c.connector_identifier;
          if (!id) continue;
          if (String(c.status).toLowerCase() === 'active') {
            connectedIds.add(id);
          }
        }
        const next: Record<string, 'connected' | 'unconnected'> = {};
        for (const req of this.requirements) {
          for (const entry of req.entries) {
            next[entry.connector] = connectedIds.has(entry.connector) ? 'connected' : 'unconnected';
          }
        }
        this.liveStatuses = next;
        this.hasCheckedStatuses = true;
      } catch (error) {
        console.warn('listMyConnections failed', error);
      } finally {
        this.refreshingStatus = false;
      }
    },
    /** Continue submits the resolved consent with every effectively
     *  connected entry marked `authorized`. Only reachable when the
     *  live overlay has lifted every requirement into the satisfied
     *  state — see `showContinueButton`. Mirrors `onSkip`'s output
     *  shape so the worker resume contract stays uniform. */
    onContinue() {
      const authorized: string[] = [];
      for (const req of this.requirements) {
        for (const entry of req.entries) {
          if (this.effectiveStatus(entry) === 'connected') {
            authorized.push(entry.connector);
          }
        }
      }
      const output = buildConsentOutput(this.payload, authorized, []);
      this.$emit('submit', { tool_use_id: this.toolUseId, output });
    },
    parsePreviousOutput() {
      this.resolvedAuthorized = [];
      this.resolvedSkipped = [];
      if (!this.previousOutput) return;
      try {
        const parsed = JSON.parse(this.previousOutput) as {
          authorized?: unknown;
          skipped?: unknown;
        };
        if (Array.isArray(parsed.authorized)) {
          this.resolvedAuthorized = parsed.authorized.filter((x): x is string => typeof x === 'string');
        }
        if (Array.isArray(parsed.skipped)) {
          this.resolvedSkipped = parsed.skipped.filter((x): x is string => typeof x === 'string');
        }
      } catch {
        // Output isn't valid JSON; fall back to the generic "skipped" copy.
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.connector-consent-card {
  margin: 8px 0;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 16px;
  background: var(--el-bg-color);
  padding: 16px 18px 14px;
  font-size: 14px;
  max-width: 100%;
  box-shadow:
    0 4px 16px -8px rgba(0, 0, 0, 0.08),
    0 1px 2px rgba(0, 0, 0, 0.04);
  animation: consentEnter 280ms cubic-bezier(0.16, 1, 0.3, 1);
}

.connector-consent-card.is-resolved {
  background: var(--el-fill-color-light);
  box-shadow: none;
  animation: none;
}

@keyframes consentEnter {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.985);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.ccc-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 8px;
}

.header-icon {
  color: var(--el-color-primary);
  font-size: 16px;
}

.header-title {
  font-size: 15px;
  letter-spacing: 0.01em;
}

.ccc-rationale {
  margin: 0 0 12px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--el-text-color-regular);
}

.ccc-requirement {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 0;
  border-top: 1px solid var(--el-border-color-lighter);

  &:first-of-type {
    border-top: none;
    padding-top: 4px;
  }
}

.ccc-req-match {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}

.ccc-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.ccc-resolved-banner {
  margin-top: 10px;
  padding: 8px 12px;
  border-radius: 8px;
  background: var(--el-color-info-light-9);
  color: var(--el-text-color-regular);
  font-size: 13px;
  line-height: 1.5;
}

.ccc-scope-hint {
  margin: 0 0 12px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.ccc-scope-row {
  padding: 6px 0;

  &:not(:last-child) {
    border-bottom: 1px solid var(--el-border-color-lighter);
  }
}

.ccc-scope-label {
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.ccc-scope-desc {
  margin: 4px 0 0 24px;
  font-size: 12px;
  line-height: 1.4;
  color: var(--el-text-color-secondary);
}
</style>
