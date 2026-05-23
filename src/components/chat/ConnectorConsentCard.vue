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
      :class="{ 'is-satisfied': req.satisfied }"
    >
      <div v-if="showMatchLabel(req)" class="ccc-req-match">
        {{ req.match === 'any' ? $t('chat.consent.matchAny') : $t('chat.consent.matchAll') }}
      </div>
      <ConnectorEntryRow
        v-for="entry in req.entries"
        :key="entry.connector"
        :entry="entry"
        :catalog="catalogFor(entry)"
        :disabled="resolved || authorizingConnector !== ''"
        @authorize="onAuthorize"
      />
    </div>

    <div v-if="!resolved && hasUnsatisfied" class="ccc-actions">
      <el-button text :disabled="authorizingConnector !== ''" @click="onSkip">
        {{ $t('chat.consent.skip') }}
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
      :title="scopeDialogCatalog ? ($t('chat.consent.selectScopes', { provider: scopeDialogCatalog.name }) as string) : ''"
      width="480px"
      :close-on-click-modal="false"
      append-to-body
    >
      <p class="ccc-scope-hint">{{ $t('chat.consent.selectScopesHint') }}</p>
      <el-checkbox-group v-model="selectedScopes">
        <div
          v-for="perm in (scopeDialogCatalog?.permissions || [])"
          :key="perm.id"
          class="ccc-scope-row"
        >
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
import { getCatalogItem, installFromCatalog, type IConnectorCatalogSummary } from './connectorCatalogCache';

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
      authorizingConnector: ''
    };
  },
  computed: {
    requirements(): IConsentRequestRequirement[] {
      return this.payload?.requirements ?? [];
    },
    hasUnsatisfied(): boolean {
      return this.requirements.some((r) => !r.satisfied);
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
  methods: {
    showMatchLabel(req: IConsentRequestRequirement): boolean {
      // Only meaningful when there are 2+ candidates AND the requirement
      // hasn't been auto-satisfied (one connected entry hides the
      // "either of these" prompt).
      return req.entries.length > 1 && !req.satisfied;
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