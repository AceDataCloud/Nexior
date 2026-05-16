<template>
  <div class="custom-domain-settings">
    <section-notice tone="admin" :text="$t('common.settings.adminOnlyHint')" />
    <div class="header">
      <p class="settings-title">{{ $t('common.settings.customDomain') }}</p>
      <p class="settings-tip">{{ $t('subsite.message.domainsIntro') }}</p>
    </div>

    <div v-loading="loading" class="domains-body">
      <el-empty
        v-if="!loading && domains.length === 0"
        :description="$t('subsite.message.domainsEmpty')"
        :image-size="80"
      />

      <div v-for="d in domains" :key="d.id" class="domain-row">
        <div class="domain-row-head">
          <strong class="hostname">{{ d.hostname }}</strong>
          <el-tag :type="statusTagType(d.status)" size="small" class="status-tag" round>
            {{ statusLabel(d.status) }}
          </el-tag>
          <span class="row-actions">
            <el-button
              v-if="d.status !== 'Active'"
              size="small"
              type="primary"
              round
              :loading="isBusy(d, 'verify')"
              :disabled="isBusy(d) && !isBusy(d, 'verify')"
              @click="onVerify(d)"
            >
              {{ $t('subsite.button.verify') }}
            </el-button>
            <el-button
              v-if="d.status === 'Active'"
              size="small"
              round
              :loading="isBusy(d, 'refresh')"
              :disabled="isBusy(d) && !isBusy(d, 'refresh')"
              @click="onRefresh(d)"
            >
              {{ $t('subsite.button.refresh') }}
            </el-button>
            <el-button
              size="small"
              type="danger"
              round
              plain
              :loading="isBusy(d, 'delete')"
              :disabled="isBusy(d) && !isBusy(d, 'delete')"
              @click="onDelete(d)"
            >
              {{ $t('common.button.delete') }}
            </el-button>
          </span>
        </div>
        <div v-if="d.status_reason" class="status-reason error">{{ d.status_reason }}</div>
        <div v-if="d.dns_instructions" class="dns-instructions">
          <p class="instructions">{{ d.dns_instructions.instructions }}</p>
          <table class="dns-record">
            <tr>
              <th>{{ $t('subsite.field.recordType') }}</th>
              <td>
                <code>{{ d.dns_instructions.record_type }}</code>
              </td>
            </tr>
            <tr>
              <th>{{ $t('subsite.field.recordName') }}</th>
              <td>
                <code>{{ d.dns_instructions.record_name }}</code>
              </td>
            </tr>
            <tr>
              <th>{{ $t('subsite.field.recordValue') }}</th>
              <td>
                <code class="break">{{ d.dns_instructions.record_value }}</code>
              </td>
            </tr>
          </table>
          <p class="record-name-hint">
            {{ $t('subsite.message.recordNameHint') }}
          </p>
        </div>
      </div>

      <el-divider />

      <h4 class="bind-title">{{ $t('subsite.title.bindDomain') }}</h4>
      <el-form :model="bind" label-width="auto" class="form" @submit.prevent>
        <el-form-item :label="$t('subsite.field.hostname')" required>
          <el-input v-model="bind.hostname" :placeholder="$t('subsite.placeholder.hostname')" maxlength="253" />
          <span class="form-tip">{{ $t('subsite.message.hostnameTip') }}</span>
        </el-form-item>
        <el-form-item>
          <el-button round type="primary" :loading="binding" :disabled="!bind.hostname.trim()" @click="onBind">
            {{ $t('subsite.button.bindDomain') }}
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import {
  ElButton,
  ElEmpty,
  ElForm,
  ElFormItem,
  ElInput,
  ElTag,
  ElDivider,
  ElMessage,
  ElMessageBox,
  vLoading
} from 'element-plus';
import { siteDomainOperator } from '@/operators';
import SectionNotice from '@/components/setting/SectionNotice.vue';
import type { ISite, ISiteDomain } from '@/models';

// Mirror of the backend hostname validator. Keep in sync with
// PlatformBackend's app/utils/custom_domain.py validate_custom_domain.
const HOSTNAME_LABEL_RE = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;
const RESERVED_SUFFIXES = ['acedata.cloud', 'surl.id', 'localhost'];

function clientValidateHostname(raw: string): { ok: true; value: string } | { ok: false; reason: string } {
  let s = (raw || '').trim().toLowerCase();
  if (!s) return { ok: false, reason: 'empty' };
  // Strip scheme + path + port for friendlier UX (the user may paste a URL).
  if (s.includes('://')) {
    try {
      const url = new URL(s);
      s = url.hostname || '';
    } catch {
      return { ok: false, reason: 'invalid_url' };
    }
  }
  s = s.replace(/\/.*$/, '').split(':')[0];
  if (!s) return { ok: false, reason: 'empty' };
  if (!s.includes('.')) return { ok: false, reason: 'no_dot' };
  for (const suffix of RESERVED_SUFFIXES) {
    if (s === suffix || s.endsWith('.' + suffix)) {
      return { ok: false, reason: 'reserved' };
    }
  }
  const labels = s.split('.');
  if (labels.length < 2) return { ok: false, reason: 'too_few_labels' };
  for (const label of labels) {
    if (!label || !HOSTNAME_LABEL_RE.test(label)) {
      return { ok: false, reason: 'bad_label' };
    }
  }
  return { ok: true, value: s };
}

/**
 * Settings tab — manage custom domains (CNAME bindings + HTTPS issuance)
 * for the **current** Site. Visibility is gated upstream by `Setting.vue`
 * to non-main-official hosts only: the parent commercial host
 * (studio.acedata.cloud) never owns custom domains itself, so this tab
 * is hidden there. Each subsite (or white-label tenant) admin lands here
 * via the new "Manage" entry from the parent's subsite list.
 *
 * The DOM and per-row interactions mirror the prior `SubsiteDomainsDialog`
 * (which used to be opened per-row from the parent's subsite list); they
 * have just been re-framed as a standalone tab targeting `state.site`.
 */
export default defineComponent({
  name: 'CustomDomainSetting',
  components: {
    ElButton,
    ElEmpty,
    ElForm,
    ElFormItem,
    ElInput,
    ElTag,
    ElDivider,
    SectionNotice
  },
  directives: {
    loading: vLoading
  },
  data() {
    return {
      loading: false,
      domains: [] as ISiteDomain[],
      bind: { hostname: '' },
      binding: false,
      // Tracks which row + which action is currently in flight, so that
      // e.g. clicking Verify only spins the Verify button (not the
      // sibling Delete button on the same row). Cleared in finally{}.
      busy: { id: null as string | null, action: null as 'verify' | 'refresh' | 'delete' | null }
    };
  },
  computed: {
    site(): ISite | undefined {
      return this.$store.state.site;
    }
  },
  mounted() {
    this.fetchDomains();
  },
  methods: {
    async fetchDomains() {
      if (!this.site?.id) return;
      this.loading = true;
      try {
        const { data } = await siteDomainOperator.getAll({ site: this.site.id });
        this.domains = (data?.items || []) as ISiteDomain[];
      } catch (e) {
        console.error('failed to load domains', e);
        ElMessage.error(this.$t('subsite.message.domainsLoadFailed'));
      } finally {
        this.loading = false;
      }
    },
    async onBind() {
      if (!this.site?.id) return;
      const check = clientValidateHostname(this.bind.hostname);
      if (!check.ok) {
        ElMessage.warning(this.$t('subsite.message.hostnameInvalid'));
        return;
      }
      this.binding = true;
      try {
        const { data } = await siteDomainOperator.create({
          site: this.site.id,
          hostname: check.value
        });
        ElMessage.success(this.$t('subsite.message.domainCreated'));
        this.domains = [data, ...this.domains];
        this.bind.hostname = '';
      } catch (e: any) {
        const resp = e?.response?.data;
        // Backend returns `{ detail: { hostname: '...' }, code: 'duplication' }`
        // when the hostname is already bound to a (possibly other) site —
        // surface a friendly "already added" message instead of dumping the
        // raw backend string. Mirrors the slug-collision handling in
        // `Subsite.vue`.
        if (resp?.code === 'duplication') {
          ElMessage.error(this.$t('subsite.message.domainTaken', { hostname: check.value }));
          return;
        }
        const detail = resp?.hostname || resp?.detail || resp?.site || e?.message;
        ElMessage.error(typeof detail === 'string' ? detail : this.$t('subsite.message.domainCreateFailed'));
      } finally {
        this.binding = false;
      }
    },
    async onVerify(d: ISiteDomain) {
      if (!d.id) return;
      this.busy = { id: d.id, action: 'verify' };
      try {
        // The backend verify endpoint always returns 200 with the
        // updated row (status flipped to Active OR Failed); it never
        // throws on a failed probe so the body's status_reason can
        // surface the cause. We mirror that contract here.
        const { data } = await siteDomainOperator.verify(d.id);
        this.replaceRow(data);
        if (data.status === 'Active') {
          ElMessage.success(this.$t('subsite.message.domainActive'));
        } else if (data.status === 'Failed') {
          ElMessage.error(data.status_reason || this.$t('subsite.message.domainFailed'));
        }
      } catch (e: any) {
        // Reachable on auth / network errors only.
        const detail = e?.response?.data?.detail || e?.message;
        ElMessage.error(typeof detail === 'string' ? detail : this.$t('subsite.message.domainVerifyFailed'));
      } finally {
        this.busy = { id: null, action: null };
      }
    },
    async onRefresh(d: ISiteDomain) {
      if (!d.id) return;
      this.busy = { id: d.id, action: 'refresh' };
      try {
        const { data } = await siteDomainOperator.get(d.id);
        this.replaceRow(data);
      } catch (e) {
        console.error('refresh failed', e);
      } finally {
        this.busy = { id: null, action: null };
      }
    },
    async onDelete(d: ISiteDomain) {
      if (!d.id || !d.hostname) return;
      try {
        await ElMessageBox.confirm(
          this.$t('subsite.message.domainDeleteConfirm', { hostname: d.hostname }) as string,
          this.$t('common.button.delete') as string,
          {
            type: 'warning',
            confirmButtonText: this.$t('common.button.delete') as string,
            cancelButtonText: this.$t('common.button.cancel') as string
          }
        );
      } catch {
        return;
      }
      this.busy = { id: d.id, action: 'delete' };
      try {
        await siteDomainOperator.delete(d.id);
        this.domains = this.domains.filter((x) => x.id !== d.id);
      } catch (e: any) {
        const detail = e?.response?.data?.detail || e?.message;
        ElMessage.error(typeof detail === 'string' ? detail : this.$t('subsite.message.domainDeleteFailed'));
      } finally {
        this.busy = { id: null, action: null };
      }
    },
    replaceRow(updated: ISiteDomain) {
      const idx = this.domains.findIndex((x) => x.id === updated.id);
      if (idx >= 0) this.domains.splice(idx, 1, updated);
      else this.domains = [updated, ...this.domains];
    },
    /** True when this row has any in-flight action (no `action` arg),
     *  or specifically when the named action is in flight. */
    isBusy(d: ISiteDomain, action?: 'verify' | 'refresh' | 'delete'): boolean {
      if (this.busy.id !== d.id) return false;
      return action ? this.busy.action === action : this.busy.action !== null;
    },
    statusLabel(status?: string): string {
      if (!status) return '-';
      // Lower-case the first char so 'Pending' -> 'subsite.status.pending'.
      const key = `subsite.status.${status.charAt(0).toLowerCase() + status.slice(1)}`;
      return this.$t(key) as string;
    },
    statusTagType(status?: string): 'success' | 'warning' | 'info' | 'danger' {
      if (status === 'Active') return 'success';
      if (status === 'Failed') return 'danger';
      // 'Pending' (and any unknown future state) renders as a neutral warning tag.
      return 'warning';
    }
  }
});
</script>

<style lang="scss" scoped>
.custom-domain-settings {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .header {
    .settings-title {
      font-weight: 600;
      font-size: 14px;
      margin: 0 0 4px 0;
    }
    .settings-tip {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      line-height: 1.6;
      margin: 0;
    }
  }

  .domains-body {
    padding: 4px 0 0;
  }

  :deep(.el-empty) {
    padding: 8px 0 16px;
    .el-empty__description {
      margin-top: 8px;
      font-size: 13px;
      color: var(--el-text-color-secondary);
    }
  }

  .domain-row {
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 12px;
    padding: 16px 18px;
    margin-bottom: 14px;
    background: var(--el-fill-color-blank);
    transition: border-color 0.15s ease;
    &:hover {
      border-color: var(--el-border-color);
    }
    .domain-row-head {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
      .hostname {
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        flex: 1 1 auto;
        word-break: break-all;
        font-size: 14px;
      }
      .status-tag {
        flex: 0 0 auto;
      }
      .row-actions {
        margin-left: auto;
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
    }
    .status-reason {
      margin-top: 10px;
      font-size: 12px;
      color: var(--el-color-danger);
    }
    .dns-instructions {
      margin-top: 14px;
      padding-top: 14px;
      border-top: 1px dashed var(--el-border-color-lighter);
      .instructions {
        margin: 0 0 10px 0;
        color: var(--el-text-color-regular);
        font-size: 13px;
        line-height: 1.6;
      }
      .dns-record {
        width: 100%;
        border-collapse: collapse;
        font-size: 12px;
        th {
          text-align: left;
          width: 110px;
          color: var(--el-text-color-secondary);
          font-weight: normal;
          padding: 6px 10px 6px 0;
          vertical-align: top;
        }
        td {
          padding: 6px 0;
          code {
            background: var(--el-fill-color-lighter);
            padding: 3px 8px;
            border-radius: 6px;
            font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
            font-size: 12px;
          }
          code.break {
            word-break: break-all;
          }
        }
      }
      .record-name-hint {
        margin: 10px 0 0;
        font-size: 12px;
        line-height: 1.55;
        color: var(--el-text-color-secondary);
      }
    }
  }

  .bind-title {
    font-size: 14px;
    margin: 4px 0 14px 0;
    color: var(--el-text-color-primary);
    font-weight: 600;
  }

  .form .form-tip {
    display: block;
    margin-top: 6px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    line-height: 1.5;
  }

  :deep(.el-divider) {
    margin: 20px 0;
  }
}
</style>
