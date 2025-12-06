<template>
  <div class="settings-list">
    <section class="settings-item">
      <div class="settings-label">
        <p class="settings-title">{{ $t('site.field.distributionDefaultInviterId') }}</p>
        <p class="settings-tip">
          {{ $t('site.message.distributionDefaultInviterIdTip') }}
        </p>
      </div>
      <div class="settings-content">
        <span class="settings-value">{{ site.distribution?.default_inviter_id }}</span>
        <edit-text
          :model-value="site.distribution?.default_inviter_id"
          :title="$t('site.title.editDistributionDefaultInviterId')"
          :placeholder="$t('site.placeholder.editDistributionDefaultInviterId')"
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
        <span class="settings-value">{{ site.distribution?.force_inviter_id }}</span>
        <edit-text
          :model-value="site.distribution?.force_inviter_id"
          :title="$t('site.title.editDistributionForceInviterId')"
          :placeholder="$t('site.placeholder.editDistributionForceInviterId')"
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
import EditText from '@/components/site/EditText.vue';
import { siteOperator } from '@/operators';

export default defineComponent({
  name: 'DistributionSetting',
  components: {
    EditText
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
