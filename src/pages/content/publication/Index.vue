<template>
  <el-row :gutter="20">
    <el-col :span="24">
      <div class="px-4 pt-4">
        <el-card shadow="hover">
          <div class="mb-5">
            <breadcrumb />
          </div>
          <el-table :data="items" v-loading="loading">
            <el-table-column prop="icon" :label="$t('common.entity.icon')" width="150px">
              <template #default="scope">
                <img :src="scope.row.platform.icon" class="w-10" />
              </template>
            </el-table-column>
            <el-table-column :label="$t('common.entity.platform')" width="300px">
              <template #default="scope">
                {{ scope.row.platform.name }}
              </template>
            </el-table-column>
            <el-table-column prop="article" :label="$t('common.entity.article')">
              <template #default="scope">
                <router-link :to="{ name: 'article-detail', params: { id: scope.row.article.id } }">
                  {{ scope.row.article.title }}
                </router-link>
              </template>
            </el-table-column>
            <el-table-column :label="$t('common.entity.publishAt')">
              <template #default="scope">
                {{ $dayjs.format(scope.row.created_at) }}
              </template>
            </el-table-column>

            <el-table-column :label="$t('common.entity.status')">
              <template #default="scope">
                <el-button
                  type="info"
                  size="small"
                  round
                  v-if="isEqual(getPublicationState(scope.row), PUBLICATION_STATE_PENDING)"
                >
                  {{ $t('publication.state.' + getPublicationState(scope.row)) }}</el-button
                >
                <el-button
                  type="primary"
                  size="small"
                  round
                  v-if="isEqual(getPublicationState(scope.row), PUBLICATION_STATE_RUNNING)"
                >
                  {{ $t('publication.state.' + getPublicationState(scope.row)) }}</el-button
                >
                <el-button
                  type="success"
                  size="small"
                  round
                  v-if="isEqual(getPublicationState(scope.row), PUBLICATION_STATE_FINISHED)"
                >
                  {{ $t('publication.state.' + getPublicationState(scope.row)) }}</el-button
                >
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
import PublicationService from '@/services/content/Publication/service';
import { IPublication, IPublicationListResponse } from '@/services/content/Publication/types';
import { defineComponent } from 'vue';
import { Check, Close } from '@element-plus/icons';
import { PUBLICATION_STATE_MAP } from '@/services/content/publication/constants';
import { Constants, Methods } from '@/mixins/index';
import { DEFAULT_LIMIT } from '@/settings/article';
import { RouteQueryAndHash } from 'vue-router';

interface IData {
  items: IPublication[];
  loading: boolean;
  total: number;
  limit: number;
  offset: number;
}

export default defineComponent({
  mixins: [Constants, Methods],
  components: {
    Breadcrumb,
    Check,
    Close,
    Pagination
  },
  data(): IData {
    return {
      items: [],
      limit: this.$route.query.limit ? parseInt(this.$route.query.limit.toString()) : DEFAULT_LIMIT,
      offset: this.$route.query.offset ? parseInt(this.$route.query.offset.toString()) : 0,
      total: 0,
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
      PublicationService.getAll(this.offset, this.limit).then(
        ({ data: data }: { data: IPublicationListResponse }): void => {
          this.total = data.count;
          this.items = data.results;
          this.loading = false;
        }
      );
    },
    getPublicationState(publication: IPublication) {
      return PUBLICATION_STATE_MAP[publication.state];
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
  height: calc(100vh - 100px);
}
</style>
