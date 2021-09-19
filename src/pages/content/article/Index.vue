<template>
  <el-row :gutter="20">
    <el-col :span="24">
      <div class="px-4 pt-4">
        <el-card shadow="hover">
          <div class="mb-5">
            <breadcrumb />
          </div>
          <el-button size="mini" round type="primary" @click="onCreate" class="btn-create">
            {{ $t('common.button.new') }}</el-button
          >
          <el-table :data="items" v-loading="loading">
            <el-table-column prop="title" :label="$t('common.entity.title')"> </el-table-column>
            <el-table-column prop="updated_at" :label="$t('common.entity.updatedAt')"> </el-table-column>
            <el-table-column :label="$t('common.entity.operation')">
              <template #default="scope">
                <el-button @click="onEdit(scope.row)" round type="primary" size="mini">
                  {{ $t('common.button.edit') }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <pagination
            class="float-right"
            @change="onPageChange"
            :total="total"
            :current-page="currentPage"
          ></pagination>
        </el-card>
      </div>
    </el-col>
  </el-row>
</template>

<script lang="ts">
import { Breadcrumb, Pagination } from '@/components/common/index';
import ArticleService from '@/services/content/article/service';
import { IArticle, IArticleListResponse, IArticleDetailResponse } from '@/services/content/article/types';
import { defineComponent } from 'vue';
import { RouteQueryAndHash } from 'vue-router';
import { DEFAULT_LIMIT } from '@/settings/article';
interface IData {
  items: IArticle[];
  loading: boolean;
  total: number;
  limit: number;
  offset: number;
}

export default defineComponent({
  components: {
    Breadcrumb,
    Pagination
  },
  data(): IData {
    return {
      total: 0,
      limit: this.$route.query.limit ? parseInt(this.$route.query.limit.toString()) : DEFAULT_LIMIT,
      offset: this.$route.query.offset ? parseInt(this.$route.query.offset.toString()) : 0,
      items: [],
      loading: false
    };
  },
  computed: {
    currentPage(): number {
      return this.offset / this.limit + 1;
    }
  },
  async mounted() {
    this.onLoadData();
  },
  methods: {
    onLoadData() {
      this.loading = true;
      ArticleService.getAll(this.offset, this.limit).then(({ data: data }: { data: IArticleListResponse }): void => {
        this.total = data.count;
        this.items = data.results;
        this.loading = false;
      });
    },
    onEdit(row: IArticle) {
      this.$router.push({
        name: 'article-detail',
        params: {
          id: row.id
        }
      });
    },
    onCreate() {
      ArticleService.create({}).then(({ data: data }: { data: IArticleDetailResponse }): void => {
        console.log('data', data);
        this.$router.push({
          name: 'article-detail',
          params: {
            id: data.id
          }
        });
      });
    },
    onPageChange(val: number) {
      this.limit = DEFAULT_LIMIT;
      this.offset = (val - 1) * this.limit;
      const route = {
        name: this.$route.name,
        query: {
          ...this.$route.query,
          offset: this.offset,
          limit: this.limit
        }
      };
      this.$router.push(route as RouteQueryAndHash);
      this.onLoadData();
    }
  }
});
</script>

<style lang="scss" scoped>
.el-card {
  // height: calc(100vh - 100px);
  position: relative;
  .btn-create {
    position: absolute;
    right: 20px;
    top: 20px;
  }
}
</style>
