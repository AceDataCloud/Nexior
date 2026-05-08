<template>
  <div class="byok">
    <div class="byok-intro">
      <p class="byok-intro-tip">{{ $t('byok.description.list') }}</p>
    </div>

    <div class="byok-actions">
      <el-button type="primary" round size="default" :disabled="!token" @click="onAdd">
        <font-awesome-icon icon="fa-solid fa-plus" class="mr-1 text-[12px]" />
        {{ $t('byok.button.add') }}
      </el-button>
    </div>

    <el-table
      v-loading="loading"
      :data="credentials"
      stripe
      class="byok-table"
      table-layout="fixed"
      :empty-text="$t('byok.message.empty')"
    >
      <el-table-column :label="$t('byok.field.provider')" width="130px">
        <template #default="scope">
          <el-tag :type="scope.row.is_active ? 'success' : 'info'" effect="dark" round>
            {{ scope.row.provider_label }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="$t('byok.field.label')" min-width="120px">
        <template #default="scope">
          <span v-if="scope.row.label" class="break-all">{{ scope.row.label }}</span>
          <span v-else class="text-[var(--el-text-color-placeholder)]">—</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('byok.field.apiKey')" width="140px">
        <template #default="scope">
          <code class="text-xs text-[var(--el-text-color-regular)]">{{ scope.row.api_key_masked }}</code>
        </template>
      </el-table-column>
      <el-table-column :label="$t('byok.field.baseUrl')" min-width="160px">
        <template #default="scope">
          <span v-if="scope.row.base_url" class="break-all text-xs">{{ scope.row.base_url }}</span>
          <span v-else class="text-[var(--el-text-color-placeholder)]">{{ $t('byok.value.default') }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('byok.field.isActive')" width="80px" class-name="text-center">
        <template #default="scope">
          <el-switch
            :model-value="scope.row.is_active"
            :loading="togglingId === scope.row.id"
            @change="(val: string | number | boolean) => onToggleActive(scope.row, !!val)"
          />
        </template>
      </el-table-column>
      <el-table-column :label="$t('common.field.operations')" width="160px" fixed="right">
        <template #default="scope">
          <el-button size="small" @click="onEdit(scope.row)">
            {{ $t('byok.button.edit') }}
          </el-button>
          <el-button size="small" type="danger" plain @click="onDelete(scope.row)">
            {{ $t('byok.button.delete') }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <byok-dialog
      v-if="dialog.visible"
      v-model:visible="dialog.visible"
      :credential="dialog.credential"
      :providers="providers"
      :token="token"
      @saved="onSaved"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton, ElMessage, ElMessageBox, ElSwitch, ElTable, ElTableColumn, ElTag, vLoading } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { byokCredentialOperator } from '@/operators';
import type { IBYOKCredential, IBYOKProviderInfo, ICredential } from '@/models';
import BYOKDialog from '@/components/setting/byok/Dialog.vue';

export default defineComponent({
  name: 'ByokSetting',
  components: {
    ElButton,
    ElSwitch,
    ElTable,
    ElTableColumn,
    ElTag,
    FontAwesomeIcon,
    'byok-dialog': BYOKDialog
  },
  directives: {
    loading: vLoading
  },
  data() {
    return {
      loading: false,
      credentials: [] as IBYOKCredential[],
      providers: [] as IBYOKProviderInfo[],
      togglingId: null as string | null,
      dialog: {
        visible: false,
        credential: null as IBYOKCredential | null
      }
    };
  },
  computed: {
    /**
     * Chat-Application credential token. The chat module is lazy-loaded
     * elsewhere; until the user's chat application resolves the token
     * can be undefined and we keep the table empty.
     */
    token(): string | undefined {
      const credential = this.$store?.state?.chat?.credential as ICredential | undefined;
      return credential?.token;
    }
  },
  watch: {
    token: {
      immediate: true,
      handler(value?: string) {
        if (value) {
          this.bootstrap();
        }
      }
    }
  },
  async mounted() {
    // Lazy-loaded chat module needs an Application + credential before
    // we can authenticate.
    if (!this.token) {
      try {
        await this.$store.dispatch('chat/getApplications');
        const apps = this.$store?.state?.chat?.applications;
        if (Array.isArray(apps) && apps.length > 0) {
          await this.$store.dispatch('chat/setApplication', apps[0]);
        }
      } catch (err) {
        console.error('Failed to bootstrap chat application for BYOK', err);
      }
    }
  },
  methods: {
    async bootstrap() {
      await Promise.all([this.loadProviders(), this.loadCredentials()]);
    },
    async loadProviders() {
      if (!this.token) return;
      try {
        const { data } = await byokCredentialOperator.providers({ token: this.token });
        const all = data?.providers ?? [];
        // Hide the DeepSeek provider option pending DeepSeek API restoration
        // (see Google OAuth review #2026-05). The backend still returns it
        // for older sites; we filter it out client-side so re-enabling is a
        // one-line revert.
        this.providers = all.filter((p) => p.id !== 'deepseek');
      } catch (err) {
        console.error('Failed to load BYOK providers', err);
      }
    },
    async loadCredentials() {
      if (!this.token) return;
      this.loading = true;
      try {
        const { data } = await byokCredentialOperator.list({ token: this.token });
        this.credentials = data?.items ?? [];
      } catch (err) {
        console.error('Failed to load BYOK credentials', err);
        ElMessage.error(this.$t('byok.message.loadFailed'));
      } finally {
        this.loading = false;
      }
    },
    onAdd() {
      this.dialog.credential = null;
      this.dialog.visible = true;
    },
    onEdit(row: IBYOKCredential) {
      this.dialog.credential = row;
      this.dialog.visible = true;
    },
    async onSaved() {
      this.dialog.visible = false;
      this.dialog.credential = null;
      await this.loadCredentials();
    },
    async onToggleActive(row: IBYOKCredential, value: boolean) {
      if (!this.token) return;
      this.togglingId = row.id;
      try {
        await byokCredentialOperator.update(row.id, { is_active: value }, { token: this.token });
        await this.loadCredentials();
      } catch (err) {
        console.error('Failed to toggle BYOK credential', err);
        ElMessage.error(this.$t('byok.message.saveFailed'));
      } finally {
        this.togglingId = null;
      }
    },
    async onDelete(row: IBYOKCredential) {
      if (!this.token) return;
      try {
        await ElMessageBox.confirm(
          this.$t('byok.message.deleteConfirm', { provider: row.provider_label }),
          this.$t('byok.title.deleteCredential'),
          { type: 'warning' }
        );
      } catch {
        return;
      }
      try {
        await byokCredentialOperator.delete(row.id, { token: this.token });
        ElMessage.success(this.$t('byok.message.deleteSuccess'));
        await this.loadCredentials();
      } catch (err) {
        console.error('Failed to delete BYOK credential', err);
        ElMessage.error(this.$t('byok.message.saveFailed'));
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.byok {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.byok-intro-tip {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
  margin: 0;
}

.byok-actions {
  display: flex;
  justify-content: flex-end;
}

.byok-table {
  width: 100%;
}

.byok-table :deep(.cell) {
  word-break: break-word;
}
</style>
