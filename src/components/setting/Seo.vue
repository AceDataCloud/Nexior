<template>
  <el-form :model="site" class="form" label-width="auto" style="max-width: 600px">
    <el-form-item :label="$t('site.field.description')">
      <span class="block w-full">
        {{ site.description }}
        <edit-text
          :model-value="site.description"
          :title="$t('site.title.editDescription')"
          :placeholder="$t('site.placeholder.description')"
          @confirm="onSave({ description: $event })"
        />
      </span>
      <span class="block tip">
        {{ $t('site.message.descriptionTip') }}
      </span>
    </el-form-item>
    <el-form-item :label="$t('site.field.keywords')">
      <span class="block w-full">
        {{ site.keywords?.join(', ') }}
        <edit-array
          :model-value="site?.keywords || []"
          :title="$t('site.title.editKeywords')"
          :placeholder="$t('site.placeholder.keywords')"
          :tip="$t('site.message.keywordsTip2')"
          @confirm="onSave({ keywords: $event })"
        />
      </span>
      <span class="block tip">
        {{ $t('site.message.keywordsTip') }}
      </span>
    </el-form-item>
  </el-form>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElForm, ElFormItem } from 'element-plus';
import EditText from '@/components/site/EditText.vue';
import EditArray from '@/components/site/EditArray.vue';
import { siteOperator } from '@/operators';

export default defineComponent({
  name: 'SettingSeo',
  components: {
    EditText,
    EditArray,
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
