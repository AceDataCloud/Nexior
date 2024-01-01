<template>
  <el-row class="panel">
    <el-col :span="24">
      <el-row>
        <el-col :span="24">
          <h2 class="title">{{ $t('common.title.allApplications') }}</h2>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-card shadow="hover">
            <el-table v-loading="loading" :data="applications" stripe table-layout="fixed">
              <el-table-column prop="id" :label="$t('application.field.id')" width="300px" class-name="text-center">
                <template #default="scope">
                  <span>{{ scope.row.id }}</span>
                  <span class="copy">
                    <copy-to-clipboard :content="scope?.row?.id" />
                  </span>
                </template>
              </el-table-column>
              <el-table-column :label="$t('application.field.name')" width="220px">
                <template #default="scope">
                  <span v-if="scope.row.type === applicationType.API">{{ scope.row?.api?.title }}</span>
                </template>
              </el-table-column>
              <el-table-column
                prop="remaining_amount"
                :label="$t('application.field.remainingAmount')"
                width="120px"
                class-name="text-center"
              >
                <template #default="scope">
                  <span>{{ getRemainingAmount(scope.row) }}</span>
                </template>
              </el-table-column>
              <el-table-column
                prop="used_amount"
                :label="$t('application.field.usedAmount')"
                width="120px"
                class-name="text-center"
              >
                <template #default="scope">
                  <span>{{ getUsedAmount(scope.row) }}</span>
                </template>
              </el-table-column>
              <el-table-column fixed="right" width="100px">
                <template #default="scope">
                  <div class="float-right">
                    <el-button type="primary" @click="onBuyMore(scope?.row)">
                      {{ $t('application.button.buyMore') }}
                    </el-button>
                  </div>
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
import {
  applicationOperator,
  IApplication,
  IApplicationListResponse,
  IApplicationType,
  ICredentialType
} from '@/operators';
import Pagination from '@/components/common/Pagination.vue';
import CopyToClipboard from '@/components/common/CopyToClipboard.vue';
import { ElTable, ElRow, ElCol, ElTableColumn, ElButton, ElCard } from 'element-plus';
import { ROUTE_CONSOLE_APPLICATION_BUY } from '@/router/constants';

interface IData {
  applications: IApplication[];
  loading: boolean;
  total: number | undefined;
  limit: number;
  buying: boolean;
  form: {
    amount: number | undefined;
  };
  active: {
    application: IApplication | undefined;
  };
  applicationType: typeof IApplicationType;
  credentialType: typeof ICredentialType;
}

export default defineComponent({
  name: 'ConsoleApplicationList',
  components: {
    Pagination,
    CopyToClipboard,
    ElTable,
    ElRow,
    ElCol,
    ElTableColumn,
    ElButton,
    ElCard
  },
  data(): IData {
    return {
      credentialType: ICredentialType,
      applicationType: IApplicationType,
      applications: [],
      loading: false,
      total: undefined,
      buying: false,
      // dynamic calculate the limit according to window height
      limit: Math.floor((window.innerHeight - 300) / 50),
      form: {
        amount: 1
      },
      active: {
        application: undefined
      }
    };
  },
  computed: {
    redirect() {
      return this.$route.query?.redirect;
    },
    page() {
      return parseInt(this.$route.query.page?.toString() || '1');
    },
    type() {
      return (this.$route.query.type?.toString() || IApplicationType.API) as IApplicationType;
    }
  },
  watch: {
    page: {
      handler() {
        this.onFetchData();
      }
    },
    type: {
      handler() {
        this.onFetchData();
      }
    }
  },
  mounted() {
    this.onFetchData();
  },
  methods: {
    onFilterType(type: string) {
      if (type === this.type) {
        return;
      }
      this.$router.push({
        ...this.$route,
        query: {
          ...this.$route.query,
          page: 1,
          type
        }
      });
    },
    onBuyMore(application: IApplication) {
      this.$router.push({
        name: ROUTE_CONSOLE_APPLICATION_BUY,
        params: {
          id: application.id
        }
      });
    },
    onPageChange(page: number) {
      this.$router.push({
        name: this.$route.name?.toString(),
        query: {
          ...this.$route.query,
          page: page
        }
      });
    },
    onFetchData() {
      this.loading = true;
      applicationOperator
        .getAll({
          limit: this.limit,
          offset: (this.page - 1) * this.limit,
          user_id: this.$store.getters.user.id,
          type: this.type,
          ordering: '-created_at'
        })
        .then(({ data: data }: { data: IApplicationListResponse }) => {
          this.applications = data.items;
          this.loading = false;
          this.total = data.count;
        })
        .catch(() => {
          this.loading = false;
        });
    },
    getRemainingAmount(application: IApplication) {
      if (application.type === IApplicationType.API) {
        const unit = this.$t(`api.unit.${application?.api?.unit}`);
        return `${application.remaining_amount}${unit}`;
      }
    },
    getUsedAmount(application: IApplication) {
      if (application.type === IApplicationType.API) {
        const unit = this.$t(`api.unit.${application?.api?.unit}`);
        return `${application.used_amount}${unit}`;
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.panel {
  padding: 30px;
  width: calc(100% - 300px);
  background-color: #f3f5f6;

  .title {
    font-size: 26px;
    font-weight: bold;
    margin-bottom: 20px;
    color: #333;
  }
  .el-table {
    min-height: calc(100vh - 350px);
    margin-bottom: 50px;
    .el-button {
      border-radius: 20px;
    }
  }
}

.pagination {
  float: right;
}
</style>
