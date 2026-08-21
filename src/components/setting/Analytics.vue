<template>
  <div class="analytics-settings">
    <section-notice tone="admin" :text="$t('common.settings.adminOnlyHint')" />
    <el-alert type="info" :closable="false" show-icon :title="$t('site.analytics.securityNotice')" />
    <el-form ref="formRef" :model="form" label-position="top">
      <section v-for="provider in providers" :key="provider.key" class="provider-card">
        <div class="provider-heading">
          <div>
            <h3>{{ provider.title }}</h3>
            <p>{{ provider.description }}</p>
          </div>
          <el-switch v-model="form[provider.key].enabled" />
        </div>
        <el-form-item :label="provider.idLabel" :prop="`${provider.key}.${provider.idField}`" :rules="provider.rules">
          <el-input
            :model-value="providerId(provider.key)"
            :placeholder="provider.placeholder"
            @update:model-value="setProviderId(provider.key, $event)"
          />
        </el-form-item>
        <el-form-item v-if="provider.key === 'umami'" :label="$t('site.analytics.umami.serverUrl')">
          <el-input v-model.trim="form.umami.server_url" placeholder="https://cloud.umami.is" />
          <p class="field-help">{{ $t('site.analytics.umami.serverUrlHelp') }}</p>
        </el-form-item>
      </section>
    </el-form>
    <div class="actions">
      <el-button type="primary" :loading="saving" @click="save">{{ $t('common.button.save') }}</el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import SectionNotice from '@/components/setting/SectionNotice.vue';
import { ElAlert, ElButton, ElForm, ElFormItem, ElInput, ElMessage, ElSwitch, type FormInstance } from 'element-plus';
import { siteOperator } from '@/operators';
import type { ISite, ISiteAnalytics } from '@/models';
import { toWritableSitePayload } from '@/utils/site';

type ProviderKey = 'ga4' | 'baidu' | 'clarity' | 'umami';

type ProviderForm = {
  ga4: { enabled: boolean; measurement_id: string };
  baidu: { enabled: boolean; site_id: string };
  clarity: { enabled: boolean; project_id: string };
  umami: { enabled: boolean; website_id: string; server_url: string };
};

function createForm(site?: ISite): ProviderForm {
  return {
    ga4: {
      enabled: site?.analytics?.ga4?.enabled ?? false,
      measurement_id: site?.analytics?.ga4?.measurement_id ?? ''
    },
    baidu: { enabled: site?.analytics?.baidu?.enabled ?? false, site_id: site?.analytics?.baidu?.site_id ?? '' },
    clarity: {
      enabled: site?.analytics?.clarity?.enabled ?? false,
      project_id: site?.analytics?.clarity?.project_id ?? ''
    },
    umami: {
      enabled: site?.analytics?.umami?.enabled ?? false,
      website_id: site?.analytics?.umami?.website_id ?? '',
      server_url: site?.analytics?.umami?.server_url ?? 'https://cloud.umami.is'
    }
  };
}

export default defineComponent({
  name: 'SiteAnalyticsSetting',
  components: { ElAlert, ElButton, ElForm, ElFormItem, ElInput, ElSwitch, SectionNotice },
  data() {
    return { form: createForm(this.$store.state.site), saving: false };
  },
  computed: {
    providers() {
      return [
        {
          key: 'ga4' as const,
          title: 'Google Analytics 4',
          description: this.$t('site.analytics.ga4.description'),
          idLabel: this.$t('site.analytics.ga4.measurementId'),
          idField: 'measurement_id' as const,
          placeholder: 'G-XXXXXXXXXX',
          rules: [{ pattern: /^G-[A-Z0-9]{6,20}$/, message: this.$t('site.analytics.invalidId'), trigger: 'blur' }]
        },
        {
          key: 'baidu' as const,
          title: this.$t('site.analytics.baidu.title'),
          description: this.$t('site.analytics.baidu.description'),
          idLabel: this.$t('site.analytics.baidu.siteId'),
          idField: 'site_id' as const,
          placeholder: '32-character site ID',
          rules: [{ pattern: /^[a-fA-F0-9]{32}$/, message: this.$t('site.analytics.invalidId'), trigger: 'blur' }]
        },
        {
          key: 'clarity' as const,
          title: 'Microsoft Clarity',
          description: this.$t('site.analytics.clarity.description'),
          idLabel: this.$t('site.analytics.clarity.projectId'),
          idField: 'project_id' as const,
          placeholder: 'abcdefghij',
          rules: [{ pattern: /^[a-z0-9]{8,32}$/, message: this.$t('site.analytics.invalidId'), trigger: 'blur' }]
        },
        {
          key: 'umami' as const,
          title: 'Umami',
          description: this.$t('site.analytics.umami.description'),
          idLabel: this.$t('site.analytics.umami.websiteId'),
          idField: 'website_id' as const,
          placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
          rules: [{ pattern: /^[0-9a-fA-F-]{36}$/, message: this.$t('site.analytics.invalidId'), trigger: 'blur' }]
        }
      ];
    }
  },
  methods: {
    providerId(key: ProviderKey): string {
      if (key === 'ga4') return this.form.ga4.measurement_id;
      if (key === 'baidu') return this.form.baidu.site_id;
      if (key === 'clarity') return this.form.clarity.project_id;
      return this.form.umami.website_id;
    },
    setProviderId(key: ProviderKey, value: string): void {
      const cleaned = value.trim();
      if (key === 'ga4') this.form.ga4.measurement_id = cleaned;
      else if (key === 'baidu') this.form.baidu.site_id = cleaned;
      else if (key === 'clarity') this.form.clarity.project_id = cleaned;
      else this.form.umami.website_id = cleaned;
    },
    async save(): Promise<void> {
      const site = this.$store.state.site as ISite | undefined;
      if (!site?.id || this.saving) return;
      const configured = [
        [this.form.ga4.enabled, this.form.ga4.measurement_id],
        [this.form.baidu.enabled, this.form.baidu.site_id],
        [this.form.clarity.enabled, this.form.clarity.project_id],
        [this.form.umami.enabled, this.form.umami.website_id]
      ];
      if (configured.some(([enabled, id]) => enabled && !id)) {
        ElMessage.warning(this.$t('site.analytics.required'));
        return;
      }
      const valid = await (this.$refs.formRef as FormInstance | undefined)?.validate().catch(() => false);
      if (!valid) return;
      const analytics: ISiteAnalytics = {};
      if (this.form.ga4.measurement_id) analytics.ga4 = { ...this.form.ga4 };
      if (this.form.baidu.site_id) analytics.baidu = { ...this.form.baidu };
      if (this.form.clarity.project_id) analytics.clarity = { ...this.form.clarity };
      if (this.form.umami.website_id) analytics.umami = { ...this.form.umami };
      this.saving = true;
      try {
        await siteOperator.update(site.id, { ...toWritableSitePayload(site), analytics });
        await this.$store.dispatch('getSite');
        ElMessage.success(this.$t('common.message.saved'));
      } catch {
        ElMessage.error(this.$t('site.analytics.saveFailed'));
      } finally {
        this.saving = false;
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.analytics-settings {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.provider-card {
  margin-top: 16px;
  padding: 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
}
.provider-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}
.provider-heading h3,
.provider-heading p {
  margin: 0;
}
.provider-heading p,
.field-help {
  margin-top: 4px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
.actions {
  display: flex;
  justify-content: flex-end;
}
</style>
