<template>
  <el-form :model="site" class="form" label-width="auto" style="max-width: 600px">
    <el-form-item :label="$t('site.field.origin')">
      <span class="block w-full">{{ site.origin }}</span>
      <span class="block tip">
        {{ $t('site.message.originTip') }}
      </span>
    </el-form-item>
    <el-form-item :label="$t('site.field.title')">
      <span class="block w-full">
        {{ site.title }}
        <edit-text
          :model-value="site.title"
          :title="$t('site.title.editTitle')"
          :placeholder="$t('site.placeholder.title')"
          @confirm="onSave({ title: $event })"
        />
      </span>
      <span class="block tip">
        {{ $t('site.message.titleTip') }}
      </span>
    </el-form-item>
    <el-form-item :label="$t('site.field.logo')">
      <span class="block w-full">
        <el-image :src="site.logo" class="logo" />
        <edit-image
          :model-value="site.logo"
          :title="$t('site.title.editLogo')"
          :tip="$t('site.message.editLogoTip')"
          @confirm="onSave({ logo: $event })"
        />
      </span>
      <span class="block tip">
        {{ $t('site.message.logoTip') }}
      </span>
    </el-form-item>
    <el-form-item :label="$t('site.field.favicon')">
      <span class="block w-full">
        <el-image :src="site.favicon" class="favicon" />
        <edit-image
          :model-value="site.favicon"
          :title="$t('site.title.editFavicon')"
          :tip="$t('site.message.editFaviconTip')"
          @confirm="onSave({ favicon: $event })"
        />
      </span>
      <span class="block tip">
        {{ $t('site.message.faviconTip') }}
      </span>
    </el-form-item>
    <el-divider border-style="dashed" />
    <el-form-item :label="$t('site.field.admins')">
      <span class="block w-full">
        {{ site.admins?.join(', ') }}
        <edit-array
          :model-value="site?.admins || []"
          :title="$t('site.title.editAdmins')"
          :placeholder="$t('site.placeholder.admins')"
          :tip="$t('site.message.adminsTip2')"
          :min="1"
          :min-error-message="$t('site.message.atLeastOneAdmin')"
          @confirm="onSave({ admins: $event })"
        />
      </span>
      <span class="block tip">
        {{ $t('site.message.adminsTip') }}
      </span>
    </el-form-item>
  </el-form>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElForm, ElFormItem, ElImage, ElDivider } from 'element-plus';
import EditText from '@/components/site/EditText.vue';
import EditImage from '@/components/site/EditImage.vue';
import EditArray from '@/components/site/EditArray.vue';
import { siteOperator } from '@/operators';
import site from '@/router/site';

export default defineComponent({
  name: 'SiteIndex',
  components: {
    EditText,
    EditImage,
    EditArray,
    ElDivider,
    ElImage,
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
      max-width: 150px;
    }
    .tip {
      color: var(--el-text-color-secondary);
      font-size: 12px;
    }
  }
}
</style>
