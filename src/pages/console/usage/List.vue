<template>
  <el-row class="panel">
    <help-entry class="help" />
    <el-col :span="24">
      <el-row>
        <el-col :span="24">
          <h2 class="title">{{ $t('common.title.allUsages') }}</h2>
        </el-col>
      </el-row>
      <el-row>
        <el-col :md="8" :sm="12" class="mb-4">
          <span class="inline-block mr-3"> {{ $t('usage.field.application') }} </span>
          <el-select
            v-model="applicationId"
            :placeholder="$t('usage.field.application')"
            clearable
            @change="onApplicationChange"
          >
            <el-option v-for="item in applications" :key="item.id" :label="item.service?.title" :value="item?.id" />
          </el-select>
        </el-col>
        <el-col :md="8" :sm="12" class="mb-4">
          <span class="inline-block mr-3"> {{ $t('usage.field.api') }} </span>
          <el-select v-model="apiId" :placeholder="$t('usage.field.api')" clearable @change="onApiChange">
            <el-option v-for="item in apis" :key="item?.id" :label="item?.title" :value="item?.id" />
          </el-select>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-card shadow="hover">
            <el-table
              v-loading="loading"
              :data="apiUsages"
              stripe
              table-layout="fixed"
              :empty-text="$t('common.message.noData')"
            >
              <el-table-column :label="$t('application.field.name')" width="160px">
                <template #default="scope">
                  <span>{{ scope.row?.api?.title }}</span>
                </template>
              </el-table-column>
              <el-table-column :label="$t('usage.field.statusCode')" width="120px">
                <template #default="scope">
                  <span>{{ scope.row.status_code }}</span>
                </template>
              </el-table-column>
              <el-table-column
                prop="remaining_amount"
                :label="$t('usage.field.remainingAmount')"
                width="160px"
                class-name="text-center"
              >
                <template #default="scope">
                  <span>{{ getRemainingAmount(scope.row) }}</span>
                </template>
              </el-table-column>
              <el-table-column
                prop="deducted_amount"
                :label="$t('usage.field.deductedAmount')"
                width="150px"
                class-name="text-center"
              >
                <template #default="scope">
                  <span>{{ getDeductedAmount(scope.row) }}</span>
                </template>
              </el-table-column>
              <el-table-column
                prop="metadata"
                :label="$t('usage.field.metadata')"
                width="200px"
                class-name="text-center"
              >
                <template #default="scope">
                  <el-tag v-for="(name, key) in scope.row.metadata" :key="key" class="mb-2">
                    {{ key }}: {{ name }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column
                prop="trace_id"
                :label="$t('application.field.traceId')"
                width="200px"
                class-name="text-center"
              >
                <template #default="scope">
                  <span class="key">{{ scope.row.trace_id }}</span>
                  <span v-if="scope.row.trace_id" class="copy">
                    <copy-to-clipboard :content="scope.row.trace_id" class="inline-block" />
                  </span>
                </template>
              </el-table-column>
              <el-table-column :label="$t('usage.field.createdAt')" width="200px">
                <template #default="scope">
                  <span class="created-at">{{ $dayjs.format(scope.row.created_at) }}</span>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>
      </el-row>
      <el-row>
        <el-col>
          <div class="pagination">
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
  IApi,
  IApplication,
  IApplicationListResponse,
  IApiUsage,
  IApiUsageListResponse,
  ICredentialType
} from '@/models';
import Pagination from '@/components/common/Pagination.vue';
import { ElTable, ElRow, ElCol, ElTableColumn, ElCard, ElTag, ElSelect, ElOption } from 'element-plus';
import { apiUsageOperator, applicationOperator } from '@/operators';
import CopyToClipboard from '@/components/common/CopyToClipboard.vue';

interface IData {
  apiUsages: IApiUsage[];
  loading: boolean;
  total: number | undefined;
  applications: IApplication[];
  limit: number;
  credentialType: typeof ICredentialType;
  applicationId: string | undefined;
  apiId: string | undefined;
}

export default defineComponent({
  name: 'ConsoleUsageList',
  components: {
    Pagination,
    ElTag,
    ElTable,
    ElSelect,
    ElOption,
    CopyToClipboard,
    ElRow,
    ElCol,
    ElTableColumn,
    ElCard
  },
  data(): IData {
    return {
      applicationId: this.$route.query.application_id?.toString(),
      apiId: this.$route.query.api_id?.toString(),
      applications: [],
      credentialType: ICredentialType,
      apiUsages: [],
      loading: false,
      total: undefined,
      limit: 15
    };
  },
  computed: {
    redirect() {
      return this.$route.query?.redirect;
    },
    page() {
      return parseInt(this.$route.query.page?.toString() || '1');
    },
    apis() {
      // contact all apis from application.service.apis
      return this.applications
        .filter((application) => (this.applicationId ? application.id === this.applicationId : true))
        .map((application) => application.service?.apis)
        .flat();
    }
  },
  watch: {
    page: {
      handler() {
        this.onFetchApiUsages();
      }
    },
    type: {
      handler() {
        this.onFetchApiUsages();
      }
    }
  },
  mounted() {
    this.onFetchApplications();
    this.onFetchApiUsages();
  },
  methods: {
    async onApiChange(apiId: string) {
      await this.$router.push({
        name: this.$route.name?.toString(),
        query: {
          ...this.$route.query,
          api_id: apiId
        }
      });
      this.onFetchApiUsages();
    },
    async onApplicationChange(applicationId: string) {
      await this.$router.push({
        name: this.$route.name?.toString(),
        query: {
          ...this.$route.query,
          application_id: applicationId
        }
      });
      this.onFetchApiUsages();
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
    getRemainingAmount(apiUsage: IApiUsage) {
      if (apiUsage.remaining_amount === undefined || apiUsage.remaining_amount === null) {
        return '';
      }
      const unit = this.$t(`service.unit.${apiUsage?.service?.unit}s`);
      return `${apiUsage.remaining_amount?.toFixed(6)} ${unit}`;
    },
    getUsedAmount(apiUsage: IApiUsage) {
      if (apiUsage.used_amount === undefined || apiUsage.used_amount === null) {
        return '';
      }
      const unit = this.$t(`service.unit.${apiUsage?.service?.unit}s`);
      return `${apiUsage.used_amount?.toFixed(6)} ${unit}`;
    },
    getDeductedAmount(apiUsage: IApiUsage) {
      if (apiUsage?.deducted_amount === undefined || apiUsage?.deducted_amount === null) {
        return '';
      }
      const unit = this.$t(`service.unit.${apiUsage?.service?.unit}s`);
      return `${apiUsage.deducted_amount?.toFixed(6)} ${unit}`;
    },
    onFetchApplications() {
      applicationOperator
        .getAll({
          limit: 100,
          offset: 0,
          user_id: this.$store.getters.user.id,
          ordering: '-created_at'
        })
        .then(({ data: data }: { data: IApplicationListResponse }) => {
          this.applications = data.items;
          this.total = data.count;
        })
        .catch(() => {});
    },
    onFetchApiUsages() {
      this.loading = true;
      apiUsageOperator
        .getAll({
          limit: this.limit,
          offset: (this.page - 1) * this.limit,
          user_id: this.$store.getters.user.id,
          ordering: '-created_at',
          ...(this.applicationId ? { application_id: this.applicationId } : {}),
          ...(this.apiId ? { api_id: this.apiId } : {})
        })
        .then(({ data: data }: { data: IApiUsageListResponse }) => {
          this.apiUsages = data.items;
          this.loading = false;
          this.total = data.count;
        })
        .catch(() => {
          this.loading = false;
        });
    }
  }
});
</script>

<style lang="scss" scoped>
.panel {
  padding: 30px;
  width: calc(100% - 300px);
  background-color: var(--el-bg-color-page);

  .title {
    font-size: 26px;
    font-weight: bold;
    margin-bottom: 20px;
    color: var(--el-text-color-primary);
  }
  .el-table {
    height: calc(100vh - 430px);
    margin-bottom: 50px;
    .el-button {
      border-radius: 20px;
    }
  }
}

.pagination {
  margin: auto;
  width: fit-content;
}
</style>
