<template>
  <el-row :gutter="20">
    <el-col :span="24">
      <div class="px-4 pt-4">
        <el-card shadow="hover">
          <div class="mb-5">
            <breadcrumb />
          </div>
          <el-table :data="items" v-loading="loading">
            <el-table-column prop="title" :label="$t('common.entity.title')"> </el-table-column>
            <el-table-column prop="updated_at" :label="$t('common.entity.updatedAt')"> </el-table-column>
            <el-table-column :label="$t('common.entity.operation')">
              <template #default="scope">
                <el-button @click="onEdit(scope.row)" round type="primary" size="small">
                  {{ $t('common.button.edit') }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </div>
    </el-col>
  </el-row>
</template>

<script lang="ts">
import { Breadcrumb } from '@/components/common/index';
import ArticleService from '@/services/content/article/service';
import { IArticle, IArticleListResponse } from '@/services/content/article/types';
import { defineComponent } from 'vue';

interface IData {
  items: IArticle[];
  loading: boolean;
}

export default defineComponent({
  components: {
    Breadcrumb
  },
  data(): IData {
    return {
      items: [],
      loading: false
    };
  },
  async mounted() {
    this.loading = true;
    ArticleService.getAll().then(({ data: data }: { data: IArticleListResponse }): void => {
      console.log('data', data);
      this.items = data.results;
      this.loading = false;
    });
  },
  methods: {
    onEdit(row: IArticle) {
      this.$router.push({
        name: 'article-detail',
        params: {
          id: row.id
        }
      });
    }
  }
});
</script>

<style lang="scss" scoped>
.el-card {
  height: calc(100vh - 100px);
}
</style>
