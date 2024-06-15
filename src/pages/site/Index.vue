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
            <el-form :model="site" label-width="auto" style="max-width: 600px">
              <el-form-item :label="$t('site.field.title')">
                {{ site.title }}
                <edit-text
                  :model-value="site.title"
                  :title="$t('site.title.editTitle')"
                  :placeholder="$t('site.placeholder.title')"
                  @cancel="editing.title = false"
                  @confirm="onSave({ title: $event })"
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
import { ElRow, ElCol, ElCard, ElForm, ElFormItem } from 'element-plus';
import EditText from '@/components/site/EditText.vue';

export default defineComponent({
  name: 'SiteIndex',
  components: {
    EditText,
    ElRow,
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
      return {
        title: 'Site Title'
      };
    }
  },
  methods: {
    onSave(data: any) {
      console.log(data);
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
}
</style>
