<template>
  <el-dialog
    :model-value="modelValue"
    :title="$t('subsite.title.domains', { origin: site?.origin || '' })"
    width="640px"
    class="domains-dialog"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div v-loading="loading" class="domains-body">
      <p class="tip">{{ $t('subsite.message.domainsIntro') }}</p>

      <el-empty v-if="!loading && domains.length === 0" :description="$t('subsite.message.domainsEmpty')" />

      <div v-for="d in domains" :key="d.id" class="domain-row">
        <div class="domain-row-head">
          <strong class="hostname">{{ d.hostname }}</strong>
          <el-tag :type="statusTagType(d.status)" size="small" class="status-tag">
            {{ statusLabel(d.status) }}
          </el-tag>
          <span class="row-actions">
            <el-button
              v-if="d.status !== 'Active'"
              size="small"
              type="primary"
              :loading="busyId === d.id"
              link
              @click="onVerify(d)"
            >
              {{ $t('subsite.button.verify') }}
            </el-button>
            <el-button v-if="d.status === 'Active'" size="small" link :loading="busyId === d.id" @click="onRefresh(d)">
              {{ $t('subsite.button.refresh') }}
            </el-button>
            <el-button size="small" link type="danger" :loading="busyId === d.id" @click="onDelete(d)">
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
        </div>
      </div>

      <el-divider />

      <h4 class="bind-title">{{ $t('subsite.title.bindDomain') }}</h4>
      <el-form :model="bind" label-width="auto" class="form" @submit.prevent>
        <el-form-item :label="$t('subsite.field.hostname')" required>
          <el-input
            v-model="bind.hostname"
            :placeholder="$t('subsite.placeholder.hostname')"
            maxlength="253"
            autofocus
          />
          <span class="tip">{{ $t('subsite.message.hostnameTip') }}</span>
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <span>
        <el-button round @click="$emit('update:modelValue', false)">{{ $t('common.button.close') }}</el-button>
        <el-button round type="primary" :loading="binding" :disabled="!bind.hostname.trim()" @click="onBind">
          {{ $t('subsite.button.bindDomain') }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import {
  ElDialog,
  ElButton,
  ElEmpty,
  ElForm,
  ElFormItem,
  ElInput,
  ElTag,
  ElDivider,
  ElMessage,
  ElMessageBox
} from 'element-plus';
import { siteDomainOperator } from '@/operators';
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

export default defineComponent({
  name: 'DomainsDialog',
  components: {
    ElDialog,
    ElButton,
    ElEmpty,
    ElForm,
    ElFormItem,
    ElInput,
    ElTag,
    ElDivider
  },
  props: {
    modelValue: {
      type: Boolean,
      required: true
    },
    site: {
      type: Object as PropType<ISite | null>,
      default: null
    }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      loading: false,
      domains: [] as ISiteDomain[],
      bind: { hostname: '' },
      binding: false,
      busyId: null as string | null
    };
  },
  watch: {
    modelValue(open: boolean) {
      if (open && this.site?.id) {
        this.fetchDomains();
      } else if (!open) {
        this.domains = [];
        this.bind.hostname = '';
        this.busyId = null;
      }
    }
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
        const detail =
          e?.response?.data?.hostname || e?.response?.data?.detail || e?.response?.data?.site || e?.message;
        ElMessage.error(typeof detail === 'string' ? detail : this.$t('subsite.message.domainCreateFailed'));
      } finally {
        this.binding = false;
      }
    },
    async onVerify(d: ISiteDomain) {
      if (!d.id) return;
      this.busyId = d.id;
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
        this.busyId = null;
      }
    },
    async onRefresh(d: ISiteDomain) {
      if (!d.id) return;
      this.busyId = d.id;
      try {
        const { data } = await siteDomainOperator.get(d.id);
        this.replaceRow(data);
      } catch (e) {
        console.error('refresh failed', e);
      } finally {
        this.busyId = null;
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
      this.busyId = d.id;
      try {
        await siteDomainOperator.delete(d.id);
        this.domains = this.domains.filter((x) => x.id !== d.id);
      } catch (e: any) {
        const detail = e?.response?.data?.detail || e?.message;
        ElMessage.error(typeof detail === 'string' ? detail : this.$t('subsite.message.domainDeleteFailed'));
      } finally {
        this.busyId = null;
      }
    },
    replaceRow(updated: ISiteDomain) {
      const idx = this.domains.findIndex((x) => x.id === updated.id);
      if (idx >= 0) this.domains.splice(idx, 1, updated);
      else this.domains = [updated, ...this.domains];
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
.domains-dialog {
  .tip {
    color: var(--el-text-color-secondary);
    font-size: 13px;
    margin: 0 0 16px 0;
  }
  .domain-row {
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 6px;
    padding: 12px 14px;
    margin-bottom: 12px;
    .domain-row-head {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      .hostname {
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        flex: 1 1 auto;
        word-break: break-all;
      }
      .status-tag {
        flex: 0 0 auto;
      }
      .row-actions {
        margin-left: auto;
        display: flex;
        gap: 4px;
      }
    }
    .status-reason {
      margin-top: 8px;
      font-size: 12px;
      color: var(--el-color-danger);
      &.error {
        color: var(--el-color-danger);
      }
    }
    .dns-instructions {
      margin-top: 12px;
      .instructions {
        margin: 0 0 8px 0;
        color: var(--el-text-color-regular);
        font-size: 13px;
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
          padding: 4px 8px 4px 0;
          vertical-align: top;
        }
        td {
          padding: 4px 0;
          code {
            background: var(--el-fill-color-lighter);
            padding: 2px 6px;
            border-radius: 4px;
            font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
            font-size: 12px;
          }
          code.break {
            word-break: break-all;
          }
        }
      }
    }
  }
  .bind-title {
    font-size: 14px;
    margin: 0 0 12px 0;
    color: var(--el-text-color-primary);
  }
  .form .tip {
    display: block;
    margin-top: 4px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}
</style>
