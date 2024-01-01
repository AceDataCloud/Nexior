<template>
  <el-row class="panel">
    <el-col :span="24">
      <el-row>
        <el-col :span="24">
          <h2 class="title">{{ $t('common.title.invitee') }}</h2>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-card shadow="hover">
            <el-table v-loading="loading" :data="invitees" stripe>
              <el-table-column prop="id" :label="$t('user.field.id')" class-name="text-center" width="350px">
                <template #default="scope">
                  <span class="key">{{ scope.row.id }}</span>
                  <span class="copy">
                    <copy-to-clipboard :content="scope.row.id" />
                  </span>
                </template>
              </el-table-column>
              <el-table-column :label="$t('user.field.username')" width="300px">
                <template #default="scope">
                  <span class="description">{{ scope.row?.username }}</span>
                </template>
              </el-table-column>
              <el-table-column :label="$t('user.field.nickname')" width="200px">
                <template #default="scope">
                  <span class="description">{{ scope.row.nickname }}</span>
                </template>
              </el-table-column>
              <el-table-column :label="$t('user.field.isVerified')" width="100px">
                <template #default="scope">
                  <el-switch :model-value="scope.row?.is_verified" />
                </template>
              </el-table-column>
              <el-table-column :label="$t('user.field.dateJoined')">
                <template #default="scope">
                  <span class="created-at">{{ $dayjs.format(scope.row.date_joined) }}</span>
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
import { ElRow, ElCol, ElTable, ElTableColumn, ElCard, ElSwitch } from 'element-plus';
import { IUser, userOperator } from '@/operators';

interface IData {
  invitees: IUser[];
  loading: boolean;
  total: number | undefined;
  limit: number;
}

export default defineComponent({
  name: 'ConsoleDistributionInvitees',
  components: {
    Pagination,
    CopyToClipboard,
    ElRow,
    ElSwitch,
    ElCol,
    ElTable,
    ElTableColumn,
    ElCard
  },
  data(): IData {
    return {
      invitees: [],
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
      Promise.all([this.onFetchInvitees()]).finally(() => {
        this.loading = false;
      });
    },
    async onFetchInvitees() {
      const { data } = await userOperator.getInvitees({
        limit: this.limit,
        offset: (this.page - 1) * this.limit
      });
      this.invitees = data.items;
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
  color: #333;
}

.item-mini {
  .value {
    font-weight: 600;
    font-size: 40px;
  }
  .description {
    color: #999;
    font-size: 14px;
  }
}
.el-table {
  min-height: calc(100vh - 300px);
  margin-bottom: 50px;
}

.panel {
  padding: 30px;
  width: calc(100% - 300px);
  background-color: #f3f5f6;
}

.pagination {
  float: right;
}
</style>
