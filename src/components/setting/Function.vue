<template>
  <div class="settings-list">
    <section-notice tone="admin" :text="$t('common.settings.adminOnlyHint')" />
    <section v-for="feature in featureKeys" :key="feature" class="settings-item">
      <div class="settings-label">
        <div class="capability-heading">
          <img :src="featureIcon(feature)" class="capability-favicon" alt="" @error="failedIcons[feature] = true" />
          <p class="settings-title">{{ featureLabel(feature) }}</p>
        </div>
        <p class="settings-tip">
          {{ featureTip(feature) }}
        </p>
      </div>
      <div class="settings-content">
        <el-tooltip :content="$t('site.capabilityOverride.edit')" placement="top">
          <el-button
            circle
            size="small"
            :aria-label="$t('site.capabilityOverride.edit')"
            @click="onEdit(feature as CapabilityKey)"
          >
            <EditIcon :size="'1em' as any" aria-hidden="true" focusable="false" />
          </el-button>
        </el-tooltip>
        <el-switch
          :model-value="site.features?.[feature]?.enabled || false"
          inline-prompt
          :active-text="$t('site.button.enabled')"
          :inactive-text="$t('site.button.disabled')"
          @update:model-value="onToggleFeature(feature, $event as boolean)"
        />
      </div>
    </section>
    <capability-override-dialog
      v-if="editingCapability && managementSite?.id"
      v-model="dialogVisible"
      :site-id="managementSite.id"
      :capability="editingCapability"
      :default-name="defaultFeatureLabel(editingCapability)"
      :default-icon="CAPABILITY_ICONS[editingCapability]"
      :override="overrides[editingCapability] || null"
      :model-group="editingModelGroup"
      :site="managementSite"
      @saved="onOverrideSaved"
      @refresh-needed="onRefreshNeeded"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton, ElMessage, ElSwitch, ElTooltip } from 'element-plus';
import { EditIcon } from '@acedatacloud/core/icons/components';
import SectionNotice from '@/components/setting/SectionNotice.vue';
import CapabilityOverrideDialog from '@/components/setting/CapabilityOverrideDialog.vue';
import { siteCapabilityOverrideOperator, siteOperator } from '@/operators';
import { CAPABILITY_ICONS, CAPABILITY_KEYS, type CapabilityKey } from '@/constants/capabilities';
import { CHAT_MODEL_GROUPS } from '@/constants/chat';
import type { IChatModelGroup, ISite, ISiteCapabilityOverride } from '@/models';
import { resolveCapabilityPresentation } from '@/utils/capabilityPresentation';

export default defineComponent({
  name: 'FunctionSetting',
  components: {
    CapabilityOverrideDialog,
    ElButton,
    EditIcon,
    ElSwitch,
    ElTooltip,
    SectionNotice
  },
  data() {
    return {
      overrides: {} as Partial<Record<CapabilityKey, ISiteCapabilityOverride>>,
      managementSite: null as import('@/models').ISite | null,
      editingCapability: null as CapabilityKey | null,
      dialogVisible: false,
      failedIcons: {} as Partial<Record<CapabilityKey, boolean>>,
      CAPABILITY_ICONS
    };
  },
  computed: {
    site() {
      return this.$store.getters.site || { features: {} };
    },
    featureKeys(): CapabilityKey[] {
      return [...CAPABILITY_KEYS];
    },
    editingModelGroup(): IChatModelGroup | null {
      return CHAT_MODEL_GROUPS.find((group) => group.name === this.editingCapability) ?? null;
    }
  },
  watch: {
    'site.id': {
      immediate: true,
      handler(siteId?: string) {
        if (siteId) void this.fetchOverrides();
      }
    }
  },
  methods: {
    defaultFeatureLabel(feature: CapabilityKey): string {
      return this.$t('site.field.features' + feature.charAt(0).toUpperCase() + feature.slice(1));
    },
    featureLabel(feature: CapabilityKey): string {
      return resolveCapabilityPresentation(
        this.site,
        feature,
        this.defaultFeatureLabel(feature),
        CAPABILITY_ICONS[feature]
      ).displayName;
    },
    featureTip(feature: CapabilityKey) {
      return this.$t('site.message.features' + feature.charAt(0).toUpperCase() + feature.slice(1));
    },
    featureIcon(feature: CapabilityKey): string {
      if (this.failedIcons[feature]) return CAPABILITY_ICONS[feature];
      return resolveCapabilityPresentation(
        this.site,
        feature,
        this.defaultFeatureLabel(feature),
        CAPABILITY_ICONS[feature]
      ).iconUrl;
    },
    async fetchOverrides(): Promise<void> {
      if (!this.site.id) return;
      try {
        const { data } = await siteCapabilityOverrideOperator.getAll({ site: this.site.id, limit: 100 });
        this.overrides = Object.fromEntries((data.items || []).map((item) => [item.capability as CapabilityKey, item]));
      } catch {
        ElMessage.error(this.$t('site.capabilityOverride.fetchFailed') as string);
      }
    },
    async onEdit(feature: CapabilityKey): Promise<void> {
      if (!this.site.id) return;
      try {
        this.managementSite = (await siteOperator.get(this.site.id)).data;
        this.editingCapability = feature;
        this.dialogVisible = true;
      } catch {
        ElMessage.error(this.$t('site.capabilityOverride.fetchFailed') as string);
      }
    },
    async onOverrideSaved(updatedSite?: ISite): Promise<void> {
      this.failedIcons = {};
      if (updatedSite?.id) this.managementSite = updatedSite;
      await Promise.all([this.fetchOverrides(), this.$store.dispatch('getSite')]);
      if (!updatedSite?.id && this.site.id) this.managementSite = (await siteOperator.get(this.site.id)).data;
    },
    async onRefreshNeeded(): Promise<void> {
      if (this.site.id) this.managementSite = (await siteOperator.get(this.site.id)).data;
      await this.$store.dispatch('getSite');
    },
    async updateFeature(feature: string, updates: Record<string, unknown>): Promise<void> {
      if (!this.site.id) return;
      try {
        const current = (await siteOperator.get(this.site.id)).data;
        const { data } = await siteOperator.update(
          this.site.id,
          {
            features: {
              ...(current.features || {}),
              [feature]: {
                ...(current.features?.[feature] || {}),
                ...updates
              }
            }
          },
          current.configuration_revision
        );
        this.managementSite = data;
        await this.$store.dispatch('getSite');
      } catch {
        ElMessage.error(this.$t('site.capabilityOverride.saveFailed') as string);
      }
    },
    onToggleFeature(feature: string, enabled: boolean) {
      void this.updateFeature(feature, { enabled });
    }
  }
});
</script>

<style lang="scss" scoped>
.capability-heading {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.capability-favicon {
  flex: 0 0 auto;
  width: 22px;
  height: 22px;
  border-radius: 5px;
  object-fit: cover;
}
</style>
