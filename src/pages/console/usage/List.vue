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
                <template #header>
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <span class="text-[15px] font-medium text-[var(--el-text-color-primary)]">
                      {{ $t('usage.title.usageAnalytics') }}
                    </span>
                    <el-radio-group v-model="chartView" size="small">
                      <el-radio-button value="trend" :label="$t('usage.view.trend')" />
                      <el-radio-button value="distribution" :label="$t('usage.view.distribution')" />
                      <el-radio-button value="breakdown" :label="$t('usage.view.breakdown')" />
                    </el-radio-group>
                  </div>
                </template>
                <div class="chart-wrapper">
                  <el-skeleton v-if="aggLoading" class="w-full" />
                  <template v-else-if="chartView === 'trend'">
                    <bar-chart
                      v-if="barChartSeries.length"
                      :data="barChartData"
                      :options="barChartOptions"
                      class="chart"
                    />
                    <el-empty v-else :description="$t('common.message.noData')" :image-size="70" class="w-full" />
                  </template>
                  <template v-else-if="chartView === 'distribution'">
                    <doughnut-chart
                      v-if="pieData.length"
                      :data="doughnutChartData"
                      :options="doughnutChartOptions"
                      class="chart"
                    />
                    <el-empty v-else :description="$t('common.message.noData')" :image-size="70" class="w-full" />
                  </template>
                  <template v-else>
                    <el-table v-if="apiBreakdown.length" :data="apiBreakdown" size="small" height="300" class="w-full">
                      <el-table-column :label="$t('usage.field.api')" min-width="160">
                        <template #default="scope">
                          <span class="color-dot" :style="{ backgroundColor: scope.row.color }" />
                          <span>{{ scope.row.label }}</span>
                        </template>
                      </el-table-column>
                      <el-table-column :label="$t('usage.field.consumed')" width="120" align="right">
                        <template #default="scope">
                          <span>{{ fmtAmount(scope.row.amount) }}</span>
                        </template>
                      </el-table-column>
                      <el-table-column :label="$t('usage.field.share')" width="150">
                        <template #default="scope">
                          <div class="share-cell">
                            <div class="share-bar">
                              <div
                                class="share-bar-fill"
                                :style="{ width: scope.row.share * 100 + '%', backgroundColor: scope.row.color }"
                              />
                            </div>
                            <span class="share-pct">{{ (scope.row.share * 100).toFixed(1) }}%</span>
                          </div>
                        </template>
                      </el-table-column>
                    </el-table>
                    <el-empty v-else :description="$t('common.message.noData')" :image-size="70" class="w-full" />
                  </template>
                </div>
              </el-card>
            </el-col>
          </el-row>
          <el-card shadow="hover">
            <div class="flex items-center justify-end gap-2 mb-4">
              <span class="text-sm text-[var(--el-text-color-regular)]">{{ $t('usage.field.autoRefresh') }}</span>
              <el-switch v-model="autoRefresh" />
            </div>
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
                  <span v-if="scope.row.status_code">{{ scope.row.status_code }}</span>
                  <el-tag v-else type="warning" size="small">{{ $t('usage.value.processing') }}</el-tag>
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
              <el-table-column
                prop="credential_id"
                :label="$t('usage.field.credential')"
                width="200px"
                class-name="text-center"
              >
                <template #default="scope">
                  <span class="key">{{ getCredentialLabel(scope.row) }}</span>
                  <span v-if="scope.row.credential?.id || scope.row.credential_id" class="cursor-pointer">
                    <copy-to-clipboard
                      :content="scope.row.credential?.id || scope.row.credential_id"
                      class="inline-block"
                    />
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
              <el-table-column
                prop="credential_id"
                :label="$t('usage.field.credential')"
                width="200px"
                class-name="text-center"
              >
                <template #default="scope">
                  <span class="key">{{ getCredentialLabel(scope.row) }}</span>
                  <span v-if="scope.row.credential?.id || scope.row.credential_id" class="cursor-pointer">
                    <copy-to-clipboard
                      :content="scope.row.credential?.id || scope.row.credential_id"
                      class="inline-block"
                    />
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
  ElButton,
  ElEmpty,
  ElSwitch,
  ElMessage
} from 'element-plus';
import qs from 'qs';
import CopyToClipboard from '@/components/common/CopyToClipboard.vue';
import { getBaseUrlPlatform } from '@/utils';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { Bar as BarChart, Doughnut as DoughnutChart } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  DoughnutController,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, DoughnutController, Title, Tooltip, Legend);

// Curated categorical palette — top spenders get distinct, readable hues
// instead of the old hsl(idx*57) generator that collided past ~6 series.
const CHART_PALETTE = [
  '#5B8FF9',
  '#5AD8A6',
  '#5D7092',
  '#F6BD16',
  '#6F5EF9',
  '#6DC8EC',
  '#945FB9',
  '#FF9845',
  '#1E9493',
  '#FF99C3'
];
const OTHERS_COLOR = '#C0C4CC';
// "Others" must stay negligible: include as many top APIs (ranked by spend) as
// needed so the folded tail is ≤ OTHERS_MAX_SHARE of the total — N is dynamic,
// not a fixed Top-N. MAX_SERIES is only a sanity backstop for the pathological
// "every API ~2%" case (the breakdown table still lists every API).
const OTHERS_MAX_SHARE = 0.01;
const MAX_SERIES = 20;

// Distinct colors for the given series count: the curated palette for a handful
// of series, else evenly-spaced hues (with alternating lightness) so adjacent
// stacks/slices never collide.
function seriesColors(n: number): string[] {
  if (n <= CHART_PALETTE.length) return CHART_PALETTE.slice(0, n);
  return Array.from({ length: n }, (_, i) => `hsl(${Math.round((i * 360) / n)}, 62%, ${i % 2 === 0 ? 55 : 45}%)`);
}

// Auto-refresh cadence for the usage table (ms).
const AUTO_REFRESH_INTERVAL_MS = 15000;

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
  chartView: string;
  apiBreakdown: { key: string; label: string; amount: number; color: string; share: number }[];
  pieLabels: string[];
  pieData: number[];
  pieColors: string[];
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
  traceId: string;
  statusCodeOptions: number[];
  statusCodeOptionsLoading: boolean;
  autoRefresh: boolean;
  autoRefreshTimer: number | null;
  fetchSeq: number;
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
    ElEmpty,
    ElSwitch,
    FontAwesomeIcon,
    BarChart,
    DoughnutChart
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
      chartView: 'trend',
      apiBreakdown: [],
      pieLabels: [],
      pieData: [],
      pieColors: [],
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
      traceId: this.$route.query.trace_id?.toString() || '',
      statusCodeOptions: [],
      statusCodeOptionsLoading: false,
      autoRefresh: true,
      autoRefreshTimer: null,
      fetchSeq: 0
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
        datasets: this.barChartSeries.map((s) => ({
          label: s.label,
          data: s.data,
          backgroundColor: s.color,
          maxBarThickness: 36,
          borderRadius: 2,
          borderSkipped: false
        }))
      };
    },
    barChartOptions() {
      const fmt = (v: number) => new Intl.NumberFormat().format(Math.round(((v || 0) + Number.EPSILON) * 100) / 100);
      return {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index' as const, intersect: false },
        plugins: {
          legend: {
            position: 'bottom' as const,
            labels: { usePointStyle: true, pointStyle: 'circle', boxWidth: 8, boxHeight: 8, padding: 14 },
            // Clicking a legend item isolates that API; clicking again restores all
            onClick: (_event: unknown, legendItem: any, legend: any) => {
              const chart = legend?.chart;
              if (!chart || legendItem?.datasetIndex === undefined) return;
              const index: number = legendItem.datasetIndex;
              const datasets = chart.data?.datasets || [];
              const othersVisible = datasets.some((_: any, i: number) => i !== index && chart.isDatasetVisible(i));
              if (othersVisible) {
                datasets.forEach((_: any, i: number) => chart.setDatasetVisibility(i, i === index));
              } else {
                datasets.forEach((_: any, i: number) => chart.setDatasetVisibility(i, true));
              }
              chart.update();
            }
          },
          title: { display: false },
          tooltip: {
            itemSort: (a: any, b: any) => (b.parsed?.y || 0) - (a.parsed?.y || 0),
            callbacks: {
              label: (ctx: any) => ` ${ctx.dataset.label}: ${fmt(ctx.parsed.y)}`,
              footer: (items: any[]) =>
                `${this.$t('usage.title.totalUsed')}: ${fmt(items.reduce((s, it) => s + (it.parsed?.y || 0), 0))}`
            }
          }
        },
        scales: {
          x: {
            stacked: true,
            grid: { display: false },
            ticks: { maxRotation: 0, autoSkip: true, autoSkipPadding: 16 }
          },
          y: {
            stacked: true,
            beginAtZero: true,
            border: { display: false },
            grid: { color: 'rgba(128, 128, 128, 0.15)' },
            ticks: { callback: (v: string | number) => fmt(Number(v)) }
          }
        }
      };
    },
    doughnutChartData() {
      return {
        labels: this.pieLabels,
        datasets: [
          {
            data: this.pieData,
            backgroundColor: this.pieColors,
            borderWidth: 0,
            hoverOffset: 6
          }
        ]
      };
    },
    doughnutChartOptions() {
      const fmt = (v: number) => this.fmtAmount(v);
      const total = this.pieData.reduce((s, v) => s + (v || 0), 0);
      return {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '58%',
        plugins: {
          legend: {
            position: 'right' as const,
            labels: { usePointStyle: true, pointStyle: 'circle', boxWidth: 8, boxHeight: 8, padding: 12 }
          },
          title: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx: any) => {
                const v = ctx.parsed || 0;
                const pct = total > 0 ? ((v / total) * 100).toFixed(1) : '0';
                return ` ${ctx.label}: ${fmt(v)} (${pct}%)`;
              }
            }
          }
        }
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
    },
    autoRefresh: {
      handler(enabled: boolean) {
        if (enabled) {
          this.startAutoRefresh();
        } else {
          this.stopAutoRefresh();
        }
      }
    }
  },
  mounted() {
    this.onFetchApplications();
    this.onFetchApis();
    this.onFetchUsages();
    this.onFetchAggregate();
    this.onFetchStatusCodeOptions();
    if (this.autoRefresh) {
      this.startAutoRefresh();
    }
  },
  beforeUnmount() {
    this.stopAutoRefresh();
  },
  methods: {
    async onFetchUsages(silent = false) {
      if (this.type === IServiceType.API) {
        this.onFetchApiUsages(silent);
      } else if (this.type === IServiceType.Proxy) {
        this.onFetchProxyUsages(silent);
      }
    },
    startAutoRefresh() {
      this.stopAutoRefresh();
      // Silent poll so filters/pagination stay put and the table doesn't flash.
      this.autoRefreshTimer = window.setInterval(() => {
        if (document.hidden) return;
        this.onFetchUsages(true);
      }, AUTO_REFRESH_INTERVAL_MS);
    },
    stopAutoRefresh() {
      if (this.autoRefreshTimer !== null) {
        clearInterval(this.autoRefreshTimer);
        this.autoRefreshTimer = null;
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
    getCredentialLabel(usage: IApiUsage | IProxyUsage) {
      const name = usage.credential?.name?.trim();
      if (name) return name;
      // Fall back to the full credential id (shown like the trace id column).
      return usage.credential?.id || usage.credential_id || '-';
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
          limit: 1000,
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
    onFetchApiUsages(silent = false) {
      if (!silent) this.loading = true;
      const seq = ++this.fetchSeq;
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
          ...(this.statusCodeFilter ? { status_code: this.statusCodeFilter } : {}),
          ...(this.traceId ? { trace_id: this.traceId } : {})
        })
        .then(({ data: data }: { data: IApiUsageListResponse }) => {
          if (seq !== this.fetchSeq) return;
          this.apiUsages = data.items;
          this.total = data.count;
        })
        .catch(() => {})
        .finally(() => {
          if (!silent) this.loading = false;
        });
    },
    onFetchProxyUsages(silent = false) {
      if (!silent) this.loading = true;
      const seq = ++this.fetchSeq;
      proxyUsageOperator
        .getAll({
          limit: this.limit,
          offset: (this.page - 1) * this.limit,
          user_id: this.$store.getters.user.id,
          ordering: '-created_at',
          ...(this.applicationIds && this.applicationIds.length ? { application_id: this.applicationIds } : {})
        })
        .then(({ data: data }: { data: IProxyUsageListResponse }) => {
          if (seq !== this.fetchSeq) return;
          this.proxyUsages = data.items;
          this.total = data.count;
        })
        .catch(() => {})
        .finally(() => {
          if (!silent) this.loading = false;
        });
    },
    async onExport() {
      const token = this.$store.state.token?.access;
      if (!token) {
        ElMessage.error(this.$t('usage.message.exportFailed') as string);
        return;
      }
      const params: Record<string, unknown> = {
        user_id: this.$store.getters.user.id,
        ...(this.createdAtRange?.[0] ? { created_at_from: this.createdAtRange[0] } : {}),
        ...(this.createdAtRange?.[1] ? { created_at_to: this.createdAtRange[1] } : {}),
        ...(this.applicationIds && this.applicationIds.length ? { application_id: this.applicationIds } : {}),
        ...(this.apiIds && this.apiIds.length ? { api_id: this.apiIds } : {}),
        ...(this.statusCodeFilter ? { status_code: this.statusCodeFilter } : {})
      };
      // Absolute platform URL — raw fetch bypasses httpClient, and the relative
      // `/api/v1` proxy only exists on the nginx web build (not Capacitor/Electron).
      const url = `${getBaseUrlPlatform()}/api/v1/usage/apis/export/?${qs.stringify(params, { arrayFormat: 'repeat' })}`;

      // Chromium: pick the save target up-front (needs the click's user
      // activation), then stream the response body straight to disk so the
      // browser writes each chunk as it arrives instead of buffering the whole
      // (100 MB+) file in tab memory.
      let fileHandle: { createWritable: () => Promise<WritableStream<Uint8Array>> } | null = null;
      const picker = (window as unknown as { showSaveFilePicker?: (o: unknown) => Promise<typeof fileHandle> })
        .showSaveFilePicker;
      if (typeof picker === 'function') {
        try {
          fileHandle = await picker({
            suggestedName: 'usages.csv',
            types: [{ description: 'CSV', accept: { 'text/csv': ['.csv'] } }]
          });
        } catch (e) {
          if ((e as DOMException)?.name === 'AbortError') return; // user cancelled the picker
          fileHandle = null; // any other picker error -> fall back to blob
        }
      }

      this.exporting = true;
      try {
        const response = await fetch(url, { headers: { authorization: `Bearer ${token}` } });
        if (!response.ok || !response.body) {
          throw new Error(`export failed: ${response.status}`);
        }
        if (fileHandle) {
          // Stream chunk-by-chunk onto disk (constant memory); the file is
          // committed when pipeTo() closes the writable, discarded on error.
          await response.body.pipeTo(await fileHandle.createWritable());
        } else {
          // Fallback (Firefox/Safari or no picker): buffer then save.
          const blob = await response.blob();
          const objectUrl = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = objectUrl;
          a.download = 'usages.csv';
          a.click();
          window.URL.revokeObjectURL(objectUrl);
        }
      } catch {
        ElMessage.error(this.$t('usage.message.exportFailed') as string);
      } finally {
        this.exporting = false;
      }
    },
    fmtAmount(v: number) {
      return new Intl.NumberFormat().format(Math.round(((v || 0) + Number.EPSILON) * 100) / 100);
    },
    async onFetchAggregate() {
      if (this.type !== this.serviceType.API) return;
      this.aggLoading = true;
      const params: any = {
        user_id: this.$store.getters.user.id,
        ...(this.applicationIds && this.applicationIds.length ? { application_id: this.applicationIds } : {}),
        ...(this.apiIds && this.apiIds.length ? { api_id: this.apiIds } : {}),
        ...(this.createdAtRange?.[0] ? { created_at_from: this.createdAtRange[0] } : {}),
        ...(this.createdAtRange?.[1] ? { created_at_to: this.createdAtRange[1] } : {}),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };
      try {
        const { data } = await apiUsageOperator.getAggregate(params);
        this.totalUsed = data.total || 0;
        const labels = Array.from(new Set((data.items || []).map((i: any) => i.date))).sort();
        // date -> api_id -> amount (single pass; also collapses any duplicates)
        const grid: Record<string, Record<string, number>> = {};
        const totals: Record<string, number> = {};
        (data.items || []).forEach((i: any) => {
          const amount = i.amount || 0;
          (grid[i.date] || (grid[i.date] = {}))[i.api_id] = (grid[i.date]?.[i.api_id] || 0) + amount;
          totals[i.api_id] = (totals[i.api_id] || 0) + amount;
        });
        // Rank APIs by total spend (desc) and compute the grand total.
        const rankedIds = Object.keys(totals).sort((a, b) => totals[b] - totals[a]);
        const grand = rankedIds.reduce((s, id) => s + totals[id], 0);
        // Dynamic Top-N: include as many top APIs as needed so the folded "Others"
        // tail stays ≤ OTHERS_MAX_SHARE of the total (N is NOT fixed). Walk the
        // cumulative share until the remainder is negligible; MAX_SERIES only guards
        // the pathological "every API ~2%" case.
        let topCount = rankedIds.length;
        if (grand > 0) {
          const limit = grand * (1 - OTHERS_MAX_SHARE);
          let cum = 0;
          for (let i = 0; i < rankedIds.length; i++) {
            cum += totals[rankedIds[i]];
            if (cum >= limit) {
              topCount = i + 1;
              break;
            }
          }
          topCount = Math.min(topCount, MAX_SERIES);
        }
        // Folding a single leftover API into "Others" is pointless — just show it.
        if (rankedIds.length - topCount === 1) topCount = rankedIds.length;
        const topIds = rankedIds.slice(0, topCount);
        const topSet = new Set(topIds);
        const colors = seriesColors(topIds.length);
        const tailIds = rankedIds.slice(topCount);
        const othersLabel = `${this.$t('usage.value.others')} (${tailIds.length})`;

        // Stacked-bar series (one per top API) + a folded "Others" series.
        const series = topIds.map((id: string, idx: number) => ({
          key: id,
          label: data.apis?.[id]?.title || id,
          data: labels.map((d: string) => grid[d]?.[id] || 0),
          color: colors[idx]
        }));
        if (tailIds.length) {
          const otherData = labels.map((d: string) =>
            Object.entries(grid[d] || {}).reduce((sum, [id, amt]) => (topSet.has(id) ? sum : sum + amt), 0)
          );
          if (otherData.some((v) => v > 0)) {
            series.push({ key: '__others__', label: othersLabel, data: otherData, color: OTHERS_COLOR });
          }
        }

        // Breakdown table: ALL APIs, exact numbers + share (nothing hidden). Top rows
        // get their chart color; the folded tail rows share the neutral "Others" grey.
        this.apiBreakdown = rankedIds.map((id: string, idx: number) => ({
          key: id,
          label: data.apis?.[id]?.title || id,
          amount: totals[id],
          color: idx < topIds.length ? colors[idx] : OTHERS_COLOR,
          share: grand > 0 ? totals[id] / grand : 0
        }));

        // Doughnut: one slice per top API + a single folded "Others" slice (≤ 1%).
        const pieLabels: string[] = [];
        const pieData: number[] = [];
        const pieColors: string[] = [];
        topIds.forEach((id: string, idx: number) => {
          pieLabels.push(data.apis?.[id]?.title || id);
          pieData.push(totals[id]);
          pieColors.push(colors[idx]);
        });
        const othersTotal = tailIds.reduce((s, id) => s + totals[id], 0);
        if (othersTotal > 0) {
          pieLabels.push(othersLabel);
          pieData.push(othersTotal);
          pieColors.push(OTHERS_COLOR);
        }
        this.pieLabels = pieLabels;
        this.pieData = pieData;
        this.pieColors = pieColors;
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
  height: 300px;
  display: flex;
  align-items: center;
}
.chart {
  width: 100%;
  height: 100%;
}
.color-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 8px;
  vertical-align: middle;
}
.share-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}
.share-bar {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: var(--el-fill-color-light);
  overflow: hidden;
}
.share-bar-fill {
  height: 100%;
  border-radius: 3px;
}
.share-pct {
  min-width: 44px;
  text-align: right;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-regular);
  font-size: 12px;
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
