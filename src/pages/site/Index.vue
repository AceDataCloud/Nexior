<template>
  <el-row class="panel">
    <el-col :span="24">
      <el-row>
        <el-col :span="24">
          <h2 class="title">{{ $t('common.title.site') }}</h2>
        </el-col>
      </el-row>
      <el-row :gutter="15">
        <el-col :md="24" :xs="24">
          <el-card>
            <el-form :model="site" class="form" label-width="auto" style="max-width: 600px">
              <el-form-item :label="$t('site.field.title')">
                {{ site.title }}
                <edit-text
                  :model-value="site.title"
                  :title="$t('site.title.editTitle')"
                  :placeholder="$t('site.placeholder.title')"
                  @confirm="onSave({ title: $event })"
                />
              </el-form-item>
              <el-form-item :label="$t('site.field.description')">
                {{ site.description }}
                <edit-text
                  :model-value="site.description"
                  :title="$t('site.title.editDescription')"
                  :placeholder="$t('site.placeholder.description')"
                  @confirm="onSave({ description: $event })"
                />
              </el-form-item>
              <el-form-item :label="$t('site.field.logo')">
                <el-image :src="site.logo" class="logo" />
                <edit-image
                  :model-value="site.logo"
                  :title="$t('site.title.editLogo')"
                  :tip="$t('site.message.editLogoTip')"
                  @confirm="onSave({ logo: $event })"
                />
              </el-form-item>
              <el-form-item :label="$t('site.field.favicon')">
                <el-image :src="site.favicon" class="favicon" />
                <edit-image
                  :model-value="site.favicon"
                  :title="$t('site.title.editFavicon')"
                  :tip="$t('site.message.editFaviconTip')"
                  @confirm="onSave({ favicon: $event })"
                />
              </el-form-item>
            </el-form>
          </el-card>
        </el-col>
      </el-row>
    </el-col>
  </el-row>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElRow, ElCol, ElCard, ElForm, ElFormItem, ElImage } from 'element-plus';
import EditText from '@/components/site/EditText.vue';
import EditImage from '@/components/site/EditImage.vue';
import { siteOperator } from '@/operators';

export default defineComponent({
  name: 'SiteIndex',
  components: {
    EditText,
    EditImage,
    ElRow,
    ElImage,
    ElCol,
    ElCard,
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
        this.$store.dispatch('getSite', this.site?.id);
      });
    }
  }
});
</script>

<style lang="scss" scoped>
.panel {
  padding: 30px;
  background-color: var(--el-bg-color-page);
  .title {
    font-size: 26px;
    font-weight: bold;
    margin-bottom: 20px;
    color: var(--el-text-color-primary);
  }
  .form {
    .logo {
      max-width: 200px;
    }
  }
}
</style>
