<template>
  <div class="settings-list">
    <section-notice tone="admin" :text="$t('common.settings.adminOnlyHint')" />
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
import EditUser from '@/components/site/EditUser.vue';
import UserChip from '@/components/site/UserChip.vue';
import SectionNotice from '@/components/setting/SectionNotice.vue';
import { siteOperator } from '@/operators';

export default defineComponent({
  name: 'DistributionSetting',
  components: {
    EditUser,
    UserChip,
    SectionNotice
  },
  computed: {
    site() {
      return this.$store.getters.site || { distribution: {} };
    }
  },
  methods: {
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
