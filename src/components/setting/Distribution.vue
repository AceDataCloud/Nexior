<template>
  <el-form :model="site" class="form" label-width="auto" style="max-width: 600px">
    <el-form-item :label="$t('site.field.distributionDefaultInviterId')">
      {{ site.distribution?.default_inviter_id }}
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
      <span class="block tip">
        {{ $t('site.message.distributionDefaultInviterIdTip') }}
      </span>
    </el-form-item>
    <el-form-item :label="$t('site.field.distributionForceInviterId')">
      {{ site.distribution?.force_inviter_id }}
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
      <span class="block tip">
        {{ $t('site.message.distributionForceInviterIdTip') }}
      </span>
    </el-form-item>
  </el-form>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElForm, ElFormItem } from 'element-plus';
import EditText from '@/components/site/EditText.vue';
import { siteOperator } from '@/operators';

export default defineComponent({
  name: 'SiteIndex',
  components: {
    EditText,
    ElForm,
    ElFormItem
  },
  data() {
    return {
      editing: {
        title: false
      }
    };
  },
  computed: {
    site() {
      return this.$store.getters.site;
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

<style lang="scss" scoped>
.panel {
  padding: 30px;
  background-color: var(--el-bg-color-page);
  overflow-y: auto;
  h2.title {
    font-size: 26px;
    font-weight: bold;
    margin-bottom: 20px;
    color: var(--el-text-color-primary);
  }
  h4.title {
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 20px;
    color: var(--el-text-color-primary);
  }
  .form {
    .logo {
      max-width: 200px;
    }
    .tip {
      color: var(--el-text-color-secondary);
      font-size: 12px;
    }
  }
}
</style>
