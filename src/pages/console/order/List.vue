<template>
  <el-row class="panel">
    <el-col :span="24">
      <el-row>
        <el-col :span="24">
          <h2 class="title">{{ $t('common.title.allOrders') }}</h2>
        </el-col>
      </el-row>

      <!-- Summary Cards -->
      <el-row :gutter="16">
        <el-col :md="6" :sm="12" :xs="24">
          <el-card shadow="hover" class="item-mini mb-3">
            <el-skeleton v-if="summaryLoading" />
            <div v-else class="card-content">
              <div class="icon-wrapper">
                <font-awesome-icon icon="fa-solid fa-receipt" class="icon" />
              </div>
              <p class="description">{{ $t('order.title.totalOrders') }}</p>
              <p class="value">{{ summary.total_count }}</p>
            </div>
          </el-card>
        </el-col>
        <el-col :md="6" :sm="12" :xs="24">
          <el-card shadow="hover" class="item-mini mb-3">
            <el-skeleton v-if="summaryLoading" />
            <div v-else class="card-content">
              <div class="icon-wrapper">
                <font-awesome-icon icon="fa-solid fa-dollar-sign" class="icon" />
              </div>
              <p class="description">{{ $t('order.title.totalSpent') }}</p>
              <p class="value">{{ getPriceString({ value: summary.total_spent }) }}</p>
            </div>
          </el-card>
        </el-col>
        <el-col :md="6" :sm="12" :xs="24">
          <el-card shadow="hover" class="item-mini mb-3">
            <el-skeleton v-if="summaryLoading" />
            <div v-else class="card-content">
              <div class="icon-wrapper">
                <font-awesome-icon icon="fa-solid fa-check-circle" class="icon" />
              </div>
              <p class="description">{{ $t('order.title.finishedOrders') }}</p>
              <p class="value">{{ summary.state_counts?.Finished || 0 }}</p>
            </div>
          </el-card>
        </el-col>
        <el-col :md="6" :sm="12" :xs="24">
          <el-card shadow="hover" class="item-mini mb-3">
            <el-skeleton v-if="summaryLoading" />
            <div v-else class="card-content">
              <div class="icon-wrapper">
                <font-awesome-icon icon="fa-solid fa-clock" class="icon" />
              </div>
              <p class="description">{{ $t('order.title.pendingOrders') }}</p>
              <p class="value">{{ summary.state_counts?.Pending || 0 }}</p>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- Filters -->
      <div class="filter-row mb-3">
        <el-select
          v-model="filterState"
          clearable
          :placeholder="$t('order.field.allStates')"
          class="filter-select"
          @change="onFilterChange"
        >
          <el-option v-for="s in stateOptions" :key="s.value" :label="s.label" :value="s.value" />
        </el-select>
        <el-select
          v-model="filterPayWay"
          clearable
          :placeholder="$t('order.field.allPayWays')"
          class="filter-select"
          @change="onFilterChange"
        >
          <el-option v-for="p in payWayOptions" :key="p.value" :label="p.label" :value="p.value" />
        </el-select>
        <el-date-picker
          v-model="createdAtRange"
          type="datetimerange"
          :shortcuts="shortcuts"
          :range-separator="$t('usage.placeholder.to')"
          :start-placeholder="$t('usage.placeholder.startDate')"
          :end-placeholder="$t('usage.placeholder.endDate')"
          @change="onFilterChange"
        />
        <el-button type="primary" plain :loading="exporting" @click="onExport">
          <font-awesome-icon icon="fa-solid fa-file-export" class="mr-1" />
          {{ $t('order.button.export') }}
        </el-button>
      </div>

      <!-- Table -->
      <el-row>
        <el-col :span="24">
          <el-card shadow="hover">
            <el-table
              v-loading="loading"
              :data="orders"
              stripe
              :empty-text="$t('common.message.noData')"
              class="min-h-[calc(100vh-450px)] mb-[20px]"
            >
              <el-table-column prop="id" :label="$t('order.field.id')" class-name="text-center" width="200px">
                <template #default="scope">
                  <span class="key">{{ scope.row.id }}</span>
                  <span class="cursor-pointer">
                    <copy-to-clipboard :content="scope.row.id" class="inline-block" />
                  </span>
                </template>
              </el-table-column>
              <el-table-column :label="$t('order.field.price')" width="110px" align="center">
                <template #default="scope">
                  <span class="price">{{ getPriceString({ value: scope.row?.price }) }}</span>
                </template>
              </el-table-column>
              <el-table-column
                :label="$t('order.field.description')"
                min-width="220px"
                class-name="hidden md:table-cell"
                label-class-name="hidden md:table-cell"
              >
                <template #default="scope">
                  <span class="description">{{ scope.row.description }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="state" :label="$t('order.field.state')" width="130px" align="center">
                <template #default="scope">
                  <el-tag :type="stateTagType(scope.row.state)" class="mx-1" effect="dark" round size="small">
                    {{ stateLabel(scope.row.state) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column
                :label="$t('order.field.payWay')"
                width="120px"
                align="center"
                class-name="hidden md:table-cell"
                label-class-name="hidden md:table-cell"
              >
                <template #default="scope">
                  <span class="text-gray-500">{{ scope.row.pay_way || '-' }}</span>
                </template>
              </el-table-column>
              <el-table-column
                :label="$t('order.field.createdAt')"
                width="200px"
                class-name="hidden sm:table-cell"
                label-class-name="hidden sm:table-cell"
              >
                <template #default="scope">
                  <span class="created-at">{{ $dayjs.format(scope.row.created_at) }}</span>
                </template>
              </el-table-column>
              <el-table-column min-width="130px" fixed="right">
                <template #default="scope">
                  <div class="flex items-center justify-center flex-wrap">
                    <el-button
                      v-if="isPendingAction(scope.row.state)"
                      type="primary"
                      size="small"
                      @click="goToDetail(scope.row.id)"
                    >
                      {{ $t('order.button.continuePay') }}
                    </el-button>
                    <el-button v-else size="small" @click="goToDetail(scope.row.id)">
                      {{ $t('order.button.checkDetail') }}
                    </el-button>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>
      </el-row>

      <!-- Pagination -->
      <el-row>
        <el-col :span="10" :offset="14">
          <div class="float-right">
            <pagination :current-page="page" :page-size="limit" :total="total" @change="onPageChange" />
          </div>
        </el-col>
      </el-row>
    </el-col>
  </el-row>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { orderOperator, IOrderSummary } from '@/operators/order';
import Pagination from '@/components/common/Pagination.vue';
import CopyToClipboard from '@/components/common/CopyToClipboard.vue';
import {
  ElRow,
  ElCol,
  ElTable,
  ElTableColumn,
  ElButton,
  ElTag,
  ElCard,
  ElSelect,
  ElOption,
  ElDatePicker,
  ElSkeleton
} from 'element-plus';
import { IOrder, IOrderListResponse, OrderState } from '@/models';
import { getPriceString } from '@/utils';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

interface IData {
  orders: IOrder[];
  loading: boolean;
  total: number | undefined;
  limit: number;
  OrderState: typeof OrderState;
  filterState: string;
  filterPayWay: string;
  createdAtRange: [Date, Date] | undefined;
  summary: IOrderSummary;
  summaryLoading: boolean;
  exporting: boolean;
  shortcuts: { text: string; value: () => [Date, Date] }[];
}

const DEFAULT_SUMMARY: IOrderSummary = { total_count: 0, total_spent: 0, state_counts: {} };

export default defineComponent({
  name: 'ConsoleOrderList',
  components: {
    Pagination,
    CopyToClipboard,
    ElRow,
    ElCol,
    ElTable,
    ElTableColumn,
    ElButton,
    ElTag,
    ElCard,
    ElSelect,
    ElOption,
    ElDatePicker,
    ElSkeleton,
    FontAwesomeIcon
  },
  data(): IData {
    return {
      OrderState: OrderState,
      orders: [],
      loading: false,
      total: undefined,
      limit: 10,
      filterState: this.$route.query.state?.toString() || '',
      filterPayWay: this.$route.query.pay_way?.toString() || '',
      createdAtRange: (() => {
        const fromStr = this.$route.query.created_at_from?.toString();
        const toStr = this.$route.query.created_at_to?.toString();
        if (fromStr && toStr) {
          return [new Date(fromStr), new Date(toStr)] as [Date, Date];
        }
        return undefined;
      })(),
      summary: { ...DEFAULT_SUMMARY },
      summaryLoading: false,
      exporting: false,
      shortcuts: [
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
      ]
    };
  },
  computed: {
    page() {
      return parseInt(this.$route.query.page?.toString() || '1');
    },
    stateOptions() {
      return [
        { value: OrderState.PENDING, label: this.$t('order.state.pending') },
        { value: OrderState.FINISHED, label: this.$t('order.state.finished') },
        { value: OrderState.PAID, label: this.$t('order.state.paid') },
        { value: OrderState.EXPIRED, label: this.$t('order.state.expired') },
        { value: OrderState.FAILED, label: this.$t('order.state.failed') },
        { value: OrderState.REFUNDED, label: this.$t('order.state.refunded') }
      ];
    },
    payWayOptions() {
      return [
        { value: 'WechatPay', label: this.$t('order.title.wechatPay') },
        { value: 'Stripe', label: this.$t('order.title.stripe') },
        { value: 'AliPay', label: this.$t('order.title.aliPay') },
        { value: 'X402', label: this.$t('order.title.x402') },
        { value: 'PayPal', label: this.$t('order.title.paypal') }
      ];
    },
    filterQuery(): Record<string, any> {
      const q: Record<string, any> = {
        user_id: this.$store.getters.user?.id
      };
      if (this.filterState) q.state = this.filterState;
      if (this.filterPayWay) q.pay_way = this.filterPayWay;
      if (this.createdAtRange?.[0]) q.created_at_from = this.createdAtRange[0];
      if (this.createdAtRange?.[1]) q.created_at_to = this.createdAtRange[1];
      return q;
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
    this.onFetchSummary();
  },
  methods: {
    getPriceString,
    stateTagType(state: string) {
      if (state === OrderState.FINISHED || state === OrderState.PAID) return 'success';
      if (state === OrderState.EXPIRED || state === OrderState.FAILED) return 'danger';
      if (state === OrderState.REFUNDED) return 'warning';
      return 'info';
    },
    stateLabel(state: string) {
      const map: Record<string, string> = {
        [OrderState.PENDING]: this.$t('order.state.pending'),
        [OrderState.PAID]: this.$t('order.state.paid'),
        [OrderState.FINISHED]: this.$t('order.state.finished'),
        [OrderState.EXPIRED]: this.$t('order.state.expired'),
        [OrderState.FAILED]: this.$t('order.state.failed'),
        [OrderState.REFUNDED]: this.$t('order.state.refunded')
      };
      return map[state] || state;
    },
    isPendingAction(state: string) {
      return (
        state !== OrderState.PAID &&
        state !== OrderState.FINISHED &&
        state !== OrderState.EXPIRED &&
        state !== OrderState.FAILED &&
        state !== OrderState.REFUNDED
      );
    },
    goToDetail(id: string) {
      this.$router.push({ name: 'console-order-detail', params: { id } });
    },
    async onFilterChange() {
      await this.$router.push({
        name: this.$route.name?.toString(),
        query: {
          page: 1,
          ...(this.filterState ? { state: this.filterState } : {}),
          ...(this.filterPayWay ? { pay_way: this.filterPayWay } : {}),
          ...(this.createdAtRange?.[0] ? { created_at_from: this.createdAtRange[0].toISOString() } : {}),
          ...(this.createdAtRange?.[1] ? { created_at_to: this.createdAtRange[1].toISOString() } : {})
        }
      });
      this.onFetchData();
      this.onFetchSummary();
    },
    onPageChange(page: number) {
      this.$router.push({
        name: this.$route.name?.toString(),
        query: {
          ...this.$route.query,
          page
        }
      });
    },
    onFetchData() {
      this.loading = true;
      orderOperator
        .getAll({
          ordering: '-created_at',
          limit: this.limit,
          offset: (this.page - 1) * this.limit,
          ...this.filterQuery
        })
        .then(({ data }: { data: IOrderListResponse }) => {
          this.orders = data.items;
          this.total = data.count;
        })
        .catch(() => {})
        .finally(() => {
          this.loading = false;
        });
    },
    onFetchSummary() {
      this.summaryLoading = true;
      orderOperator
        .getSummary(this.filterQuery)
        .then(({ data }: { data: IOrderSummary }) => {
          this.summary = data;
        })
        .catch(() => {
          this.summary = { ...DEFAULT_SUMMARY };
        })
        .finally(() => {
          this.summaryLoading = false;
        });
    },
    onExport() {
      this.exporting = true;
      orderOperator
        .exportCsv(this.filterQuery)
        .then(({ data }: { data: Blob }) => {
          const url = window.URL.createObjectURL(data);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'orders.csv';
          a.click();
          window.URL.revokeObjectURL(url);
        })
        .catch(() => {})
        .finally(() => {
          this.exporting = false;
        });
    }
  }
});
</script>

<style lang="scss" scoped>
.title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 16px;
  color: var(--el-text-color-primary);
}

.item-mini {
  .card-content {
    display: flex;
    flex-direction: column;
  }
  .icon-wrapper {
    height: 36px;
    width: 36px;
    line-height: 36px;
    border-radius: 50%;
    background-color: var(--el-bg-color-page);
    text-align: center;
    margin-bottom: 8px;
    .icon {
      color: var(--el-color-primary);
    }
  }
  .value {
    font-weight: 600;
    font-size: 24px;
    color: var(--el-text-color-primary);
  }
  .description {
    color: var(--el-text-color-regular);
    font-size: 13px;
  }
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-select {
  width: 160px;
}
</style>
