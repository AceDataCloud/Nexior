<template>
  <div class="settings-list">
    <section-notice tone="admin" :text="$t('common.settings.adminOnlyHint')" />
    <section v-for="feature in featureKeys" :key="feature" class="settings-item">
      <div class="settings-label">
        <div class="capability-heading">
          <img :src="featureIcon(feature)" class="capability-favicon" alt="" />
          <p class="settings-title">{{ featureLabel(feature) }}</p>
        </div>
        <p class="settings-tip">
          {{ featureTip(feature) }}
        </p>
      </div>
      <div class="settings-content">
        <el-switch
          :model-value="site.features?.[feature]?.enabled || false"
          inline-prompt
          :active-text="$t('site.button.enabled')"
          :inactive-text="$t('site.button.disabled')"
          @update:model-value="onToggleFeature(feature, $event as boolean)"
        />
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSwitch } from 'element-plus';
import SectionNotice from '@/components/setting/SectionNotice.vue';
import { siteOperator } from '@/operators';
import { CAPABILITY_ICONS, CAPABILITY_KEYS, type CapabilityKey } from '@/constants/capabilities';

export default defineComponent({
  name: 'FunctionSetting',
  components: {
    ElSwitch,
    SectionNotice
  },
  computed: {
    site() {
      return this.$store.getters.site || { features: {} };
    },
    featureKeys(): string[] {
      return [...CAPABILITY_KEYS];
    }
  },
  methods: {
    featureLabel(feature: string) {
      return this.$t('site.field.features' + feature.charAt(0).toUpperCase() + feature.slice(1));
    },
    featureTip(feature: string) {
      return this.$t('site.message.features' + feature.charAt(0).toUpperCase() + feature.slice(1));
    },
    featureIcon(feature: string): string {
      return CAPABILITY_ICONS[feature as CapabilityKey];
    },
    updateFeature(feature: string, updates: Record<string, unknown>) {
      this.onSave({
        features: {
          ...(this.site.features || {}),
          [feature]: {
            ...(this.site.features?.[feature] || {}),
            ...updates
          }
        }
      });
    },
    onToggleFeature(feature: string, enabled: boolean) {
      this.updateFeature(feature, { enabled });
    },
    onSave(data: any) {
      const payload = {
        ...this.site,
        ...data
      };
      siteOperator.update(this.site?.id, payload).then(() => {
        console.debug('getSite for id', this.site?.id);
        this.$store.dispatch('getSite');
      });
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
