<template>
  <div class="settings-list">
    <section-notice tone="admin" :text="$t('common.settings.adminOnlyHint')" />
    <section class="settings-item">
      <div class="settings-label">
        <p class="settings-title">{{ $t('site.field.referralEntryEnabled') }}</p>
        <p class="settings-tip">{{ $t('site.message.referralEntryEnabledTip') }}</p>
      </div>
      <div class="settings-content">
        <el-switch
          :model-value="referralEntryEnabled"
          inline-prompt
          :loading="referralEntrySaving"
          :disabled="referralEntrySaving || !site.id"
          :active-text="$t('site.button.enabled')"
          :inactive-text="$t('site.button.disabled')"
          @update:model-value="onToggleReferralEntry($event as boolean)"
        />
      </div>
    </section>
    <section class="settings-item">
      <div class="settings-label">
        <p class="settings-title">{{ $t('site.field.distributionDefaultInviterId') }}</p>
        <p class="settings-tip">
          {{ $t('site.message.distributionDefaultInviterIdTip') }}
        </p>
      </div>
      <div class="settings-content">
        <user-chip :user-id="site.distribution?.default_inviter_id" />
        <edit-user
          :model-value="site.distribution?.default_inviter_id || ''"
          :title="$t('site.title.editDistributionDefaultInviterId')"
          @confirm="
            onSave({
              distribution: {
                ...site.distribution,
                default_inviter_id: $event
              }
            })
          "
        />
      </div>
    </section>

    <section class="settings-item">
      <div class="settings-label">
        <p class="settings-title">{{ $t('site.field.distributionForceInviterId') }}</p>
        <p class="settings-tip">
          {{ $t('site.message.distributionForceInviterIdTip') }}
        </p>
      </div>
      <div class="settings-content">
        <user-chip :user-id="site.distribution?.force_inviter_id" />
        <edit-user
          :model-value="site.distribution?.force_inviter_id || ''"
          :title="$t('site.title.editDistributionForceInviterId')"
          @confirm="
            onSave({
              distribution: {
                ...site.distribution,
                force_inviter_id: $event
              }
            })
          "
        />
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElMessage, ElSwitch } from 'element-plus';
import EditUser from '@/components/site/EditUser.vue';
import UserChip from '@/components/site/UserChip.vue';
import SectionNotice from '@/components/setting/SectionNotice.vue';
import { siteOperator } from '@/operators';
import type { ISite } from '@/models';

export default defineComponent({
  name: 'DistributionSetting',
  components: {
    EditUser,
    UserChip,
    SectionNotice,
    ElSwitch
  },
  data() {
    return {
      referralEntrySaving: false
    };
  },
  computed: {
    site(): ISite {
      return this.$store.getters.site || { distribution: {} };
    },
    referralEntryEnabled(): boolean {
      return this.site.features?.referral?.enabled !== false;
    }
  },
  methods: {
    async onToggleReferralEntry(enabled: boolean): Promise<void> {
      if (!this.site.id || this.referralEntrySaving) return;
      this.referralEntrySaving = true;
      try {
        await siteOperator.update(this.site.id, {
          features: {
            ...this.site.features,
            referral: {
              ...this.site.features?.referral,
              enabled
            }
          }
        });
        await this.$store.dispatch('getSite');
      } catch {
        ElMessage.error(this.$t('site.services.message.saveFailed'));
      } finally {
        this.referralEntrySaving = false;
      }
    },
    onSave(data: any) {
      if (!this.site.id) return;
      const payload = {
        ...data
      };
      siteOperator.update(this.site.id, payload).then(() => {
        console.debug('getSite for id', this.site?.id);
        this.$store.dispatch('getSite');
      });
    }
  }
});
</script>
