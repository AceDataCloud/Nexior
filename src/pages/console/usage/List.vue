<template>
  <el-row>
    <el-col :span="24">
      <el-row>
        <el-col :span="24">
          <h2 class="text-[26px] font-bold mb-5 text-[var(--el-text-color-primary)]">
            {{ $t('common.title.allUsages') }}
          </h2>
        </el-col>
      </el-row>
      <el-row>
        <el-col :md="4" :xs="24" class="mb-5 flex px-2 gap-2 items-center">
          <span> {{ $t('application.field.type') }} </span>
          <el-radio-group v-model="type">
            <el-radio-button :value="serviceType.API" :label="$t('application.field.api')" />
            <el-radio-button :value="serviceType.Proxy" :label="$t('application.field.proxy')" />
          </el-radio-group>
        </el-col>
        <el-col v-show="false" :md="6" :xs="24" class="mb-5 flex px-2 gap-2 items-center">
          <span class="inline-block w-9"> {{ $t('usage.field.application') }} </span>
          <el-select
            v-model="applicationIds"
            :placeholder="$t('usage.field.application')"
            clearable
            multiple
            collapse-tags
            collapse-tags-tooltip
            class="w-full"
            @change="onApplicationsChange"
          >
            <el-option v-for="item in applications" :key="item.id" :label="item.service?.title" :value="item?.id!" />
          </el-select>
        </el-col>
        <el-col v-if="type === serviceType.API" :md="6" :xs="24" class="mb-5 flex px-2 gap-2 items-center">
          <span class="inline-block"> {{ $t('usage.field.api') }} </span>
          <el-skeleton v-if="apisLoading" animated class="w-full">
            <template #template>
              <el-skeleton-item variant="rect" style="height: 32px; border-radius: 4px" />
            </template>
          </el-skeleton>
          <el-select
            v-else
            v-model="apiIds"
            :placeholder="$t('usage.field.api')"
            clearable
            filterable
            multiple
            collapse-tags
            collapse-tags-tooltip
            class="w-full"
            @change="onApisChange"
          >
            <el-option v-for="item in apis" :key="item?.id" :label="item?.title" :value="item?.id!" />
          </el-select>
        </el-col>
        <el-col v-if="type === serviceType.API" :md="8" :xs="24" class="mb-5 flex px-2 gap-2 items-center">
          <el-date-picker
            v-model="createdAtRange"
            type="datetimerange"
            class="w-full"
            :shortcuts="shortcuts"
            :range-separator="$t('usage.placeholder.to')"
            :start-placeholder="$t('usage.placeholder.startDate')"
            :end-placeholder="$t('usage.placeholder.endDate')"
            @change="onTimeRangeChanged"
          />
        </el-col>
        <!-- Status-code filter — narrow because values are 3-digit codes.
             `filterable` + `allow-create` lets the user pick from discovered
             codes or type an unseen one (e.g. a future 503). -->
        <el-col v-if="type === serviceType.API" :md="3" :xs="24" class="mb-5 flex px-2 gap-2 items-center">
          <el-select
            v-model="statusCodeFilter"
            :placeholder="$t('usage.option.statusCodeAll')"
            class="w-full"
            clearable
            filterable
            allow-create
            default-first-option
            :loading="statusCodeOptionsLoading"
            @change="onStatusCodeChange"
          >
            <el-option v-for="code in statusCodeOptions" :key="code" :label="String(code)" :value="String(code)" />
          </el-select>
        </el-col>
        <el-col v-if="type === serviceType.API" :md="3" :xs="24" class="mb-5 flex px-2 gap-2 items-center justify-end">
          <el-button type="primary" plain :loading="exporting" class="w-full whitespace-nowrap" @click="onExport">
            <font-awesome-icon icon="fa-solid fa-file-export" class="mr-1" />
            {{ $t('usage.button.export') }}
          </el-button>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-row v-if="type === serviceType.API" :gutter="24" class="mb-5">
            <el-col :md="6" :xs="24">
              <el-card shadow="hover" class="h-full">
                <el-skeleton v-if="aggLoading" />
                <div v-else class="summary-card">
                  <div class="icon-wrapper">
                    <font-awesome-icon icon="fa-solid fa-cubes" class="icon" />
                  </div>
                  <div class="text-left">
                    <p class="description">{{ $t('usage.title.totalUsed') }}</p>
                    <p class="value">{{ totalUsedString }}</p>
                  </div>
                </div>
              </el-card>
            </el-col>
            <el-col :md="18" :xs="24">
              <el-card shadow="hover" class="h-full">
                <div class="chart-wrapper">
                  <el-skeleton v-if="aggLoading" class="w-full" />
                  <bar-chart v-else :data="barChartData" :options="barChartOptions" class="chart" />
                </div>
              </el-card>
            </el-col>
          </el-row>
          <el-card shadow="hover">
            <el-table
              v-if="type === serviceType.API"
              v-loading="loading"
              :data="apiUsages"
              stripe
              table-layout="fixed"
              :empty-text="$t('common.message.noData')"
              class="min-h-[calc(100vh-350px)] mb-5"
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
              <el-table-column :label="$t('usage.field.elapsed')" width="120px">
                <template #default="scope">
                  <span>{{ formatElapsed(scope.row.elapsed) }}</span>
                </template>
              </el-table-column>
              <el-table-column
                prop="deducted_amount"
                :label="$t('usage.field.deductedAmount')"
                width="150px"
                class-name="text-center"
              >
                <template #default="scope">
                  <div v-if="getDeductedAmount(scope.row) === getOriginalAmount(scope.row)">
                    <span>{{ getDeductedAmount(scope.row) }}</span>
                  </div>
                  <div v-else>
                    <p></p>
                    <p>
                      <span>{{ getDeductedAmount(scope.row) }}</span>
                    </p>
                    <p>
                      <del>{{ getOriginalAmount(scope.row) }}</del>
                    </p>
                  </div>
                </template>
              </el-table-column>
              <el-table-column
                prop="remaining_amount"
                :label="$t('usage.field.balanceAfter')"
                width="160px"
                class-name="text-center"
              >
                <template #default="scope">
                  <span>{{ getRemainingAmount(scope.row) }}</span>
                </template>
              </el-table-column>
              <el-table-column
                prop="metadata"
                :label="$t('usage.field.metadata')"
                width="260px"
                class-name="text-center"
              >
                <template #default="scope">
                  <div class="flex flex-wrap gap-2">
                    <el-tag
                      v-if="scope.row.original_amount > scope.row.deducted_amount && scope.row.original_amount > 0"
                      type="success"
                      :style="{
                        textWrap: 'wrap',
                        height: 'fit-content',
                        lineHeight: '20px',
                        borderRadius: '10px'
                      }"
                    >
                      {{
                        (
                          ((scope.row.original_amount - scope.row.deducted_amount) * 100) /
                          scope.row.original_amount
                        ).toFixed(0) + '% OFF'
                      }}
                    </el-tag>
                    <el-tag
                      v-for="(name, key) in getSimpleMetadata(scope.row.metadata)"
                      :key="key"
                      :style="{
                        textWrap: 'wrap',
                        height: 'fit-content',
                        lineHeight: '20px',
                        borderRadius: '10px'
                      }"
                    >
                      {{ key }}: {{ name }}
                    </el-tag>
                  </div>
                </template>
              </el-table-column>
              <el-table-column :label="$t('usage.button.viewDetail')" width="120px" class-name="text-center">
                <template #default="scope">
                  <el-button
                    v-if="scope.row.id"
                    type="primary"
                    plain
                    size="small"
                    class="!px-2 !py-1 !text-xs !h-auto !min-h-0"
                    @click="onShowDetail(scope.row)"
                  >
                    {{ $t('usage.button.viewDetail') }}
                  </el-button>
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
                  <span v-if="scope.row.trace_id" class="cursor-pointer">
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
            <el-table
              v-if="type === serviceType.Proxy"
              v-loading="loading"
              :data="proxyUsages"
              stripe
              table-layout="fixed"
              :empty-text="$t('common.message.noData')"
              class="min-h-[calc(100vh-350px)] mb-5"
            >
              <el-table-column :label="$t('application.field.name')" width="160px">
                <template #default="scope">
                  <span>{{ scope.row?.service?.title }}</span>
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
                  <span>{{ getOriginalAmount(scope.row) }}</span>
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
              <el-table-column :label="$t('usage.field.balanceAfter')" width="160px" class-name="text-center">
                <template #default="scope">
                  <span>{{ getRemainingAmount(scope.row) }}</span>
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
              <el-table-column :label="$t('usage.field.createdAt')" width="200px">
                <template #default="scope">
                  <span class="created-at">{{ $dayjs.format(scope.row.created_at) }}</span>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>
      </el-row>
      <el-dialog
        v-model="detailDialogVisible"
        :title="$t('usage.dialog.detailTitle')"
        width="70%"
        top="5vh"
        destroy-on-close
      >
        <el-tabs v-model="detailActiveTab">
          <el-tab-pane :label="$t('usage.dialog.request')" name="request">
            <el-skeleton v-if="detailLoading" :rows="6" animated />
            <pre v-else-if="detailRow?.metadata?.request" class="detail-json">{{
              formatJson(detailRow.metadata.request)
            }}</pre>
            <p v-else class="text-gray-400">{{ $t('usage.dialog.noData') }}</p>
          </el-tab-pane>
          <el-tab-pane :label="$t('usage.dialog.response')" name="response">
            <el-skeleton v-if="detailLoading" :rows="6" animated />
            <pre v-else-if="detailRow?.metadata?.response" class="detail-json">{{
              formatJson(detailRow.metadata.response)
            }}</pre>
            <p v-else class="text-gray-400">{{ $t('usage.dialog.noData') }}</p>
          </el-tab-pane>
        </el-tabs>
      </el-dialog>
      <el-row>
        <el-col :span="10" :offset="14">
          <div class="float-right">
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
  IApiListResponse,
  IApplication,
  IApplicationListResponse,
  IApplicationType,
  ICredentialType,
  IServiceType,
  IApiUsage,
  IApiUsageListResponse,
  IProxyUsage,
  IProxyUsageListResponse
} from '@/models';
import { apiUsageOperator, applicationOperator, apiOperator, proxyUsageOperator } from '@/operators';
import Pagination from '@/components/common/Pagination.vue';
import {
  ElTable,
  ElRow,
  ElCol,
  ElTableColumn,
  ElCard,
  ElTag,
  ElSelect,
  ElDatePicker,
  ElOption,
  ElRadioGroup,
  ElRadioButton,
  ElSkeleton,
  ElSkeletonItem,
  ElDialog,
  ElTabs,
  ElTabPane,
  ElButton
} from 'element-plus';
import CopyToClipboard from '@/components/common/CopyToClipboard.vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { Bar as BarChart } from 'vue-chartjs';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface IData {
  apiUsages: IApiUsage[];
  proxyUsages: IProxyUsage[];
  loading: boolean;
  total: number | undefined;
  shortcuts: { text: string; value: () => [Date, Date] }[];
  applications: IApplication[];
  apis: IApi[];
  apisLoading: boolean;
  limit: number;
  createdAtRange: [Date | string, Date | string];
  credentialType: typeof ICredentialType;
  applicationIds: string[] | undefined;
  apiIds: string[] | undefined;
  type: string | IServiceType;
  serviceType: typeof IServiceType;
  // aggregate
  totalUsed: number;
  barChartLabels: string[];
  barChartSeries: { key: string; label: string; data: number[]; color: string }[];
  aggLoading: boolean;
  // detail dialog
  detailDialogVisible: boolean;
  detailRow: IApiUsage | null;
  detailActiveTab: string;
  detailLoading: boolean;
  // export
  exporting: boolean;
  // status-code filter (free-form string — user can pick from discovered
  // codes or type any number)
  statusCodeFilter: string;
  statusCodeOptions: number[];
  statusCodeOptionsLoading: boolean;
}

export default defineComponent({
  name: 'ConsoleUsageList',
  components: {
    Pagination,
    ElTag,
    ElDatePicker,
    ElTable,
    ElSelect,
    ElOption,
    CopyToClipboard,
    ElRow,
    ElCol,
    ElTableColumn,
    ElCard,
    ElRadioButton,
    ElRadioGroup,
    ElSkeleton,
    ElSkeletonItem,
    ElDialog,
    ElTabs,
    ElTabPane,
    ElButton,
    FontAwesomeIcon,
    BarChart
  },
  data(): IData {
    return {
      applicationIds: this.$route.query.application_id?.toString()
        ? this.$route.query.application_id?.toString().split(',')
        : [],
      apiIds: this.$route.query.api_id?.toString() ? this.$route.query.api_id?.toString().split(',') : [],
      applications: [],
      apis: [],
      apisLoading: false,
      credentialType: ICredentialType,
      serviceType: IServiceType,
      apiUsages: [],
      proxyUsages: [],
      createdAtRange: (() => {
        const toStr = this.$route.query.created_at_to?.toString();
        const fromStr = this.$route.query.created_at_from?.toString();
        if (fromStr && toStr) {
          return [new Date(fromStr), new Date(toStr)];
        }
        const end = new Date();
        const start = new Date();
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        return [start, end];
      })(),
      shortcuts: [
        {
          text: this.$t('usage.shortcuts.thisMonth'),
          value: () => {
            const end = new Date();
            const start = new Date();
            start.setDate(1);
            start.setHours(0, 0, 0, 0);
            return [start, end];
          }
        },
        {
          text: this.$t('usage.shortcuts.today'),
          value: () => {
            const end = new Date();
            const start = new Date();
            start.setHours(0, 0, 0, 0);
            return [start, end];
          }
        },
        {
          text: this.$t('usage.shortcuts.last1Day'),
          value: () => {
            const end = new Date();
            const start = new Date();
            start.setDate(start.getDate() - 1);
            return [start, end];
          }
        },
        {
          text: this.$t('usage.shortcuts.last3Days'),
          value: () => {
            const end = new Date();
            const start = new Date();
            start.setDate(start.getDate() - 3);
            return [start, end];
          }
        },
        {
          text: this.$t('usage.shortcuts.last7Days'),
          value: () => {
            const end = new Date();
            const start = new Date();
            start.setDate(start.getDate() - 7);
            return [start, end];
          }
        },
        {
          text: this.$t('usage.shortcuts.last1Month'),
          value: () => {
            const end = new Date();
            const start = new Date();
            start.setMonth(start.getMonth() - 1);
            return [start, end];
          }
        }
      ],
      type: this.$route.query.type?.toString() || IServiceType.API,
      loading: false,
      total: undefined,
      limit: 15,
      // aggregate
      totalUsed: 0,
      barChartLabels: [],
      barChartSeries: [],
      aggLoading: false,
      // detail dialog
      detailDialogVisible: false,
      detailRow: null,
      detailActiveTab: 'request',
      detailLoading: false,
      // export
      exporting: false,
      // status-code filter — read from URL so back/forward + share work
      statusCodeFilter: this.$route.query.status_code?.toString() || '',
      statusCodeOptions: [],
      statusCodeOptionsLoading: false
    };
  },
  computed: {
    redirect() {
      return this.$route.query?.redirect;
    },
    page() {
      return parseInt(this.$route.query.page?.toString() || '1');
    },
    totalUsedString() {
      return `${(this.totalUsed || 0).toFixed(2)}`;
    },
    barChartData() {
      return {
        labels: this.barChartLabels,
        datasets: this.barChartSeries.map((s) => ({ label: s.label, data: s.data, backgroundColor: s.color }))
      };
    },
    barChartOptions() {
      return {
        responsive: true,
        plugins: {
          legend: {
            position: 'top' as const,
            // Clicking a legend item isolates that API; clicking again restores all
            onClick: (_event: unknown, legendItem: any, legend: any) => {
              const chart = legend?.chart;
              if (!chart || legendItem?.datasetIndex === undefined) return;
              const index: number = legendItem.datasetIndex;
              const datasets = chart.data?.datasets || [];
              // Check if any other dataset is currently visible
              const othersVisible = datasets.some((_: any, i: number) => i !== index && chart.isDatasetVisible(i));
              if (othersVisible) {
                // Show only the clicked dataset
                datasets.forEach((_: any, i: number) => chart.setDatasetVisibility(i, i === index));
              } else {
                // If only this dataset is visible, restore all
                datasets.forEach((_: any, i: number) => chart.setDatasetVisibility(i, true));
              }
              chart.update();
            }
          },
          title: { display: true, text: this.$t('usage.title.usageTrend') }
        },
        scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } }
      };
    }
  },
  watch: {
    page: {
      handler() {
        this.onFetchUsages();
      }
    },
    type: {
      handler() {
        // reset multi-selects when switching type
        this.applicationIds = [];
        this.apiIds = [];
        this.onApplicationsChange(this.applicationIds);
        this.onFetchApplications();
        this.onFetchApis();
        this.onFetchUsages();
        this.onFetchAggregate();
        this.onFetchStatusCodeOptions();
      }
    }
  },
  mounted() {
    this.onFetchApplications();
    this.onFetchApis();
    this.onFetchUsages();
    this.onFetchAggregate();
    this.onFetchStatusCodeOptions();
  },
  methods: {
    async onFetchUsages() {
      if (this.type === IServiceType.API) {
        this.onFetchApiUsages();
      } else if (this.type === IServiceType.Proxy) {
        this.onFetchProxyUsages();
      }
    },
    async onApiChange(apiId: string) {
      await this.$router.push({
        name: this.$route.name?.toString(),
        query: {
          ...this.$route.query,
          api_id: apiId
        }
      });
      this.onFetchApiUsages();
      this.onFetchAggregate();
    },
    async onApisChange(apiIds: string[]) {
      await this.$router.push({
        name: this.$route.name?.toString(),
        query: {
          ...this.$route.query,
          api_id: apiIds && apiIds.length ? apiIds.join(',') : ''
        }
      });
      this.onFetchApiUsages();
      this.onFetchAggregate();
    },
    async onTimeRangeChanged() {
      console.log('onTimeRangeChanged', this.createdAtRange);
      await this.$router.push({
        name: this.$route.name?.toString(),
        query: {
          ...this.$route.query,
          // append timezone like 2025-05-10T13:01:36.566800Z
          created_at_from: this.createdAtRange
            ? this.$dayjs.format(this.createdAtRange[0].toString(), 'YYYY-MM-DDTHH:mm:ss.SSSSSSZ')
            : '',
          created_at_to: this.createdAtRange
            ? this.$dayjs.format(this.createdAtRange[1].toString(), 'YYYY-MM-DDTHH:mm:ss.SSSSSSZ')
            : ''
        }
      });
      this.onFetchUsages();
      this.onFetchAggregate();
      this.onFetchStatusCodeOptions();
    },
    async onApplicationChange(applicationId: string | undefined) {
      await this.$router.push({
        name: this.$route.name?.toString(),
        query: {
          ...this.$route.query,
          application_id: applicationId
        }
      });
      this.onFetchUsages();
      this.onFetchAggregate();
    },
    async onApplicationsChange(applicationIds: string[]) {
      await this.$router.push({
        name: this.$route.name?.toString(),
        query: {
          ...this.$route.query,
          application_id: applicationIds && applicationIds.length ? applicationIds.join(',') : ''
        }
      });
      this.onFetchUsages();
      this.onFetchAggregate();
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
      const unit = this.$t(`service.unit.${apiUsage?.service?.unit || 'credit'}s`);
      return `${apiUsage.remaining_amount?.toFixed(6)} ${unit}`;
    },
    getUsedAmount(usage: IApiUsage | IProxyUsage) {
      if (usage.used_amount === undefined || usage.used_amount === null) {
        return '';
      }
      const unit = this.$t(`service.unit.${usage?.service?.unit || 'credit'}s`);
      return `${usage.used_amount?.toFixed(6)} ${unit}`;
    },
    getDeductedAmount(usage: IApiUsage | IProxyUsage) {
      if (usage?.deducted_amount === undefined || usage?.deducted_amount === null) {
        return '';
      }
      const unit = this.$t(`service.unit.${usage?.service?.unit || 'credit'}s`);
      return `${usage.deducted_amount?.toFixed(6)} ${unit}`;
    },
    getOriginalAmount(usage: IApiUsage | IProxyUsage) {
      if (usage?.original_amount === undefined || usage?.original_amount === null) {
        return '';
      }
      const unit = this.$t(`service.unit.${usage?.service?.unit || 'credit'}s`);
      return `${usage.original_amount?.toFixed(6)} ${unit}`;
    },
    /**
     * Sync the active status-code filter to the URL and re-fetch with the
     * new server-side `?status_code=` param. Empty string clears the filter.
     */
    onStatusCodeChange(val: string) {
      const next = { ...this.$route.query };
      const trimmed = (val || '').trim();
      if (trimmed) next.status_code = trimmed;
      else delete next.status_code;
      // Drop the legacy client-side query key if it lingers in the URL.
      delete next.status_code_filter;
      this.$router.push({ name: this.$route.name?.toString(), query: next });
      this.onFetchUsages();
      this.onFetchAggregate();
    },
    /**
     * Populate the filter dropdown with the *exact* set of distinct status
     * codes the user actually saw within the active filters. Backed by the
     * `/usage/apis/status-codes/` endpoint added in PlatformBackend so the
     * client doesn't have to sample records and dedupe itself.
     */
    async onFetchStatusCodeOptions() {
      this.statusCodeOptionsLoading = true;
      try {
        const { data } = await apiUsageOperator.getStatusCodes({
          user_id: this.$store.getters.user.id,
          ...(this.applicationIds && this.applicationIds.length ? { application_id: this.applicationIds } : {}),
          ...(this.apiIds && this.apiIds.length ? { api_id: this.apiIds } : {}),
          ...(this.createdAtRange?.[0] ? { created_at_from: this.createdAtRange[0] } : {}),
          ...(this.createdAtRange?.[1] ? { created_at_to: this.createdAtRange[1] } : {})
        });
        this.statusCodeOptions = (data?.items || []).slice().sort((a, b) => a - b);
      } catch {
        // Silent fallback — `allow-create` means the user can still type
        // a code by hand even if discovery failed.
        this.statusCodeOptions = [];
      } finally {
        this.statusCodeOptionsLoading = false;
      }
    },
    formatElapsed(elapsed?: number) {
      if (elapsed === undefined || elapsed === null || Number.isNaN(elapsed)) {
        return '-';
      }
      if (elapsed < 1) {
        return `${Math.round(elapsed * 1000)} ms`;
      }
      return `${elapsed.toFixed(2)} s`;
    },
    getSimpleMetadata(metadata: Record<string, any> | undefined) {
      if (!metadata) return {};
      const result: Record<string, any> = {};
      for (const [key, value] of Object.entries(metadata)) {
        if (key === 'request' || key === 'response') continue;
        if (typeof value === 'object' && value !== null) continue;
        result[key] = value;
      }
      return result;
    },
    onShowDetail(row: IApiUsage) {
      this.detailRow = { ...row, metadata: undefined };
      this.detailActiveTab = 'request';
      this.detailDialogVisible = true;
      this.detailLoading = true;
      if (row.id) {
        apiUsageOperator
          .get(row.id)
          .then((response) => {
            this.detailRow = response.data;
          })
          .finally(() => {
            this.detailLoading = false;
          });
      }
    },
    formatJson(data: any): string {
      try {
        return JSON.stringify(data, null, 2);
      } catch {
        return String(data);
      }
    },
    onFetchApplications() {
      applicationOperator
        .getAll({
          limit: 100,
          offset: 0,
          user_id: this.$store.getters.user.id,
          ordering: '-created_at',
          type: IApplicationType.USAGE
        })
        .then(({ data: data }: { data: IApplicationListResponse }) => {
          this.applications = data.items.filter(
            (application: IApplication) => application?.service?.type === this.type
          );
        })
        .catch(() => {});
    },
    onFetchApis() {
      this.apisLoading = true;
      apiOperator
        .getAll({
          limit: 100,
          offset: 0,
          ordering: '-created_at'
        })
        .then(({ data: data }: { data: IApiListResponse }) => {
          this.apis = data.items;
        })
        .catch(() => {})
        .finally(() => {
          this.apisLoading = false;
        });
    },
    onFetchApiUsages() {
      console.log('onFetchApiUsages', this.createdAtRange);
      this.loading = true;
      apiUsageOperator
        .getAll({
          limit: this.limit,
          offset: (this.page - 1) * this.limit,
          user_id: this.$store.getters.user.id,
          ordering: '-created_at',
          ...(this.createdAtRange?.[0] ? { created_at_from: this.createdAtRange[0] } : {}),
          ...(this.createdAtRange?.[1] ? { created_at_to: this.createdAtRange[1] } : {}),
          ...(this.applicationIds && this.applicationIds.length ? { application_id: this.applicationIds } : {}),
          ...(this.apiIds && this.apiIds.length ? { api_id: this.apiIds } : {}),
          ...(this.statusCodeFilter ? { status_code: this.statusCodeFilter } : {})
        })
        .then(({ data: data }: { data: IApiUsageListResponse }) => {
          this.apiUsages = data.items;
          this.loading = false;
          this.total = data.count;
        })
        .catch(() => {
          this.loading = false;
        });
    },
    onFetchProxyUsages() {
      this.loading = true;
      proxyUsageOperator
        .getAll({
          limit: this.limit,
          offset: (this.page - 1) * this.limit,
          user_id: this.$store.getters.user.id,
          ordering: '-created_at',
          ...(this.applicationIds && this.applicationIds.length ? { application_id: this.applicationIds } : {})
        })
        .then(({ data: data }: { data: IProxyUsageListResponse }) => {
          this.proxyUsages = data.items;
          this.loading = false;
          this.total = data.count;
        })
        .catch(() => {
          this.loading = false;
        });
    },
    onExport() {
      this.exporting = true;
      apiUsageOperator
        .exportCsv({
          user_id: this.$store.getters.user.id,
          ...(this.createdAtRange?.[0] ? { created_at_from: this.createdAtRange[0] } : {}),
          ...(this.createdAtRange?.[1] ? { created_at_to: this.createdAtRange[1] } : {}),
          ...(this.applicationIds && this.applicationIds.length ? { application_id: this.applicationIds } : {}),
          ...(this.apiIds && this.apiIds.length ? { api_id: this.apiIds } : {}),
          ...(this.statusCodeFilter ? { status_code: this.statusCodeFilter } : {})
        })
        .then(({ data }: { data: Blob }) => {
          const url = window.URL.createObjectURL(data);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'usages.csv';
          a.click();
          window.URL.revokeObjectURL(url);
        })
        .catch(() => {})
        .finally(() => {
          this.exporting = false;
        });
    },
    async onFetchAggregate() {
      this.aggLoading = true;
      if (this.type !== this.serviceType.API) return;
      const params: any = {
        user_id: this.$store.getters.user.id,
        ...(this.applicationIds && this.applicationIds.length ? { application_id: this.applicationIds } : {}),
        ...(this.apiIds && this.apiIds.length ? { api_id: this.apiIds } : {}),
        ...(this.createdAtRange?.[0] ? { created_at_from: this.createdAtRange[0] } : {}),
        ...(this.createdAtRange?.[1] ? { created_at_to: this.createdAtRange[1] } : {})
      };
      try {
        const { data } = await apiUsageOperator.getAggregate(params);
        this.totalUsed = data.total || 0;
        const labels = Array.from(new Set((data.items || []).map((i: any) => i.date))).sort();
        const apiIds = Array.from(new Set((data.items || []).map((i: any) => i.api_id)));
        const color = (idx: number) => `hsl(${(idx * 57) % 360}, 70%, 60%)`;
        const series = apiIds.map((id: string, idx: number) => {
          const label = data.apis?.[id]?.title || id;
          const map: Record<string, number> = {};
          (data.items || [])
            .filter((i: any) => i.api_id === id)
            .forEach((i: any) => {
              map[i.date] = i.amount || 0;
            });
          const arr = labels.map((d: string) => map[d] || 0);
          return { key: id, label, data: arr, color: color(idx) };
        });
        this.barChartLabels = labels;
        this.barChartSeries = series;
      } finally {
        this.aggLoading = false;
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.summary-card {
  width: 25%;
  min-width: 260px;
  border-radius: 6px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.summary-card .icon-wrapper {
  height: 40px;
  width: 40px;
  line-height: 40px;
  border-radius: 50%;
  background-color: var(--el-bg-color-page);
  text-align: center;
  margin-bottom: 10px;
}
.summary-card .icon-wrapper .icon {
  color: var(--el-color-primary);
}
.summary-card .value {
  font-weight: 600;
  font-size: 30px;
}
.summary-card .description {
  color: var(--el-text-color-regular);
  font-size: 14px;
}
.chart-wrapper {
  flex: 1;
  min-height: 260px;
  display: flex;
  align-items: center;
}
.chart {
  width: 100%;
  max-height: 260px;
}
.detail-json {
  background: var(--el-bg-color-page);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  padding: 16px;
  font-size: 13px;
  line-height: 1.6;
  max-height: 60vh;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
