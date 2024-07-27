<template>
  <el-row class="panel">
    <el-col :span="24">
      <el-row>
        <el-col :span="24">
          <h2 class="title">{{ $t('common.title.distributionHistory') }}</h2>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-card shadow="hover">
            <el-table v-loading="loading" :data="distributionHistories" stripe>
              <el-table-column prop="id" :label="$t('distribution.field.id')" class-name="text-center" width="350px">
                <template #default="scope">
                  <span class="key">{{ scope.row.id }}</span>
                  <span class="copy">
                    <copy-to-clipboard :content="scope.row.id" />
                  </span>
                </template>
              </el-table-column>
              <el-table-column
                prop="id"
                :label="$t('distribution.field.userId')"
                class-name="text-center"
                width="350px"
              >
                <template #default="scope">
                  <span class="key">{{ scope.row.user_id }}</span>
                  <span class="copy">
                    <copy-to-clipboard :content="scope.row.user_id" />
                  </span>
                </template>
              </el-table-column>
              <el-table-column :label="$t('distribution.field.price')" width="100px">
                <template #default="scope">
                  <span class="price">{{ getPriceString({ value: scope.row?.price }) }}</span>
                </template>
              </el-table-column>
              <el-table-column :label="$t('distribution.field.reward')" width="100px">
                <template #default="scope">
                  <span class="description">{{ getPriceString({ value: scope.row?.reward }) }}</span>
                </template>
              </el-table-column>
              <el-table-column :label="$t('distribution.field.percentage')" width="120px">
                <template #default="scope">
                  <span class="description">{{ scope.row.percentage }}%</span>
                </template>
              </el-table-column>
              <el-table-column :label="$t('distribution.field.createdAt')" width="200px">
                <template #default="scope">
                  <span class="created-at">{{ $dayjs.format(scope.row.created_at) }}</span>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="10" :offset="14">
          <div class="pagination m-v-lg">
            <pagination :current-page="page" :page-size="limit" :total="total" @change="onPageChange"> </pagination>
          </div>
        </el-col>
      </el-row>
    </el-col>
  </el-row>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Pagination from '@/components/common/Pagination.vue';
import CopyToClipboard from '@/components/common/CopyToClipboard.vue';
import { ElRow, ElCol, ElTable, ElTableColumn, ElCard } from 'element-plus';
import { distributionHistoryOperator } from '@/operators/distribution';
import { IDistributionHistory, IDistributionStatus } from '@/models';
import { getPriceString } from '@/utils';

interface IData {
  distributionHistories: IDistributionHistory[];
  distributionStatus: IDistributionStatus | undefined;
  loading: boolean;
  total: number | undefined;
  limit: number;
}

export default defineComponent({
  name: 'ConsoleDistributionList',
  components: {
    Pagination,
    CopyToClipboard,
    ElRow,
    ElCol,
    ElTable,
    ElTableColumn,
    ElCard
  },
  data(): IData {
    return {
      distributionHistories: [],
      distributionStatus: undefined,
      loading: false,
      total: undefined,
      limit: 10
    };
  },
  computed: {
    redirect() {
      return this.$route.query.redirect;
    },
    page() {
      return parseInt(this.$route.query.page?.toString() || '1');
    }
  },
  watch: {
    page: {
      handler() {
        this.onFetchData();
      }
    }
  },
  mounted() {
    this.onFetchData();
  },
  methods: {
    getPriceString,
    onPageChange(page: number) {
      this.$router.push({
        name: this.$route.name?.toString(),
        query: {
          page: page
        }
      });
    },
    onFetchData() {
      this.loading = true;
      Promise.all([this.onFetchDistributionHistory()]).finally(() => {
        this.loading = false;
      });
    },
    async onFetchDistributionHistory() {
      const { data } = await distributionHistoryOperator.getAll({
        user_id: this.$store.getters.user.id,
        ordering: '-created_at',
        limit: this.limit,
        offset: (this.page - 1) * this.limit
      });
      this.distributionHistories = data.items;
      this.total = data.count;
    }
  }
});
</script>

<style lang="scss" scoped>
.title {
  font-size: 26px;
  font-weight: bold;
  margin-bottom: 20px;
  color: var(--el-text-color-primary);
}

.el-table {
  min-height: calc(100vh - 300px);
  margin-bottom: 50px;
}

.panel {
  padding: 30px;
  width: calc(100% - 300px);
  background-color: var(--el-bg-color-page);
  height: 100%;
  overflow-y: scroll;

  .api-key {
    .copy {
      cursor: pointer;
      margin: 0 10px;
    }
  }
}

.pagination {
  float: right;
}
</style>
