<template>
  <el-row class="panel">
    <el-col :span="24">
      <el-row>
        <el-col :span="24">
          <h2 class="title">{{ $t('common.title.allOrders') }}</h2>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-card shadow="hover">
            <el-table
              v-loading="loading"
              :data="orders"
              stripe
              :empty-text="$t('common.message.noData')"
              class="min-h-[calc(100vh-300px)] mb-[50px]"
            >
              <el-table-column prop="id" :label="$t('order.field.id')" class-name="text-center" width="200px">
                <template #default="scope">
                  <span class="key">{{ scope.row.id }}</span>
                  <span class="cursor-pointer">
                    <copy-to-clipboard :content="scope.row.id" class="inline-block" />
                  </span>
                </template>
              </el-table-column>
              <el-table-column :label="$t('order.field.price')" width="100px">
                <template #default="scope">
                  <span class="price">{{ getPriceString({ value: scope.row?.price }) }}</span>
                </template>
              </el-table-column>
              <el-table-column
                :label="$t('order.field.description')"
                width="270px"
                class-name="hidden md:table-cell"
                label-class-name="hidden md:table-cell"
              >
                <template #default="scope">
                  <span class="description">{{ scope.row.description }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="state" :label="$t('order.field.state')" class-name="text-center" width="160px">
                <template #default="scope">
                  <span v-if="scope.row.state === OrderState?.PENDING">
                    <el-tag type="info" class="mx-1" effect="dark" round>{{ $t('order.state.pending') }}</el-tag>
                  </span>
                  <span v-else-if="scope.row.state === OrderState?.PAID" class="state state-paid">
                    <el-tag type="success" class="mx-1" effect="dark" round>{{ $t('order.state.paid') }}</el-tag>
                  </span>
                  <span v-else-if="scope.row.state === OrderState?.FINISHED" class="state state-finished">
                    <el-tag type="success" class="mx-1" effect="dark" round>{{ $t('order.state.finished') }}</el-tag>
                  </span>
                  <span v-else-if="scope.row.state === OrderState?.EXPIRED" class="state state-expired">
                    <el-tag type="danger" class="mx-1" effect="dark" round>{{ $t('order.state.expired') }}</el-tag>
                  </span>
                  <span v-else-if="scope.row.state === OrderState?.FAILED" class="state state-failed">
                    <el-tag type="danger" class="mx-1" effect="dark" round> {{ $t('order.state.failed') }}</el-tag>
                  </span>
                </template>
              </el-table-column>
              <el-table-column :label="$t('order.field.createdAt')" width="250px">
                <template #default="scope">
                  <span class="created-at">{{ $dayjs.format(scope.row.created_at) }}</span>
                </template>
              </el-table-column>
              <el-table-column min-width="130px" fixed="right">
                <template #default="scope">
                  <div class="flex items-center justify-center flex-wrap">
                    <el-button
                      v-if="
                        scope.row.state !== OrderState.PAID &&
                        scope.row.state !== OrderState.FINISHED &&
                        scope.row.state !== OrderState.EXPIRED &&
                        scope.row.state !== OrderState.FAILED
                      "
                      type="primary"
                      size="small"
                      @click="
                        $router.push({
                          name: 'console-order-detail',
                          params: {
                            id: scope.row.id
                          }
                        })
                      "
                    >
                      {{ $t('order.button.continuePay') }}
                    </el-button>
                    <el-button
                      v-else
                      size="small"
                      @click="
                        $router.push({
                          name: 'console-order-detail',
                          params: {
                            id: scope.row.id
                          }
                        })
                      "
                    >
                      {{ $t('order.button.checkDetail') }}
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
import { orderOperator } from '@/operators/order';
import Pagination from '@/components/common/Pagination.vue';
import CopyToClipboard from '@/components/common/CopyToClipboard.vue';
import { ElRow, ElCol, ElTable, ElTableColumn, ElButton, ElTag, ElCard } from 'element-plus';
import { IOrder, IOrderListResponse, OrderState } from '@/models';
import { getPriceString } from '@/utils';

interface IData {
  orders: IOrder[];
  loading: boolean;
  total: number | undefined;
  limit: number;
  OrderState: typeof OrderState;
}

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
    ElCard
  },
  data(): IData {
    return {
      OrderState: OrderState,
      orders: [],
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
      orderOperator
        .getAll({
          ordering: '-created_at',
          limit: this.limit,
          offset: (this.page - 1) * this.limit,
          user_id: this.$store.getters.user.id
        })
        .then(({ data: data }: { data: IOrderListResponse }) => {
          this.orders = data.items;
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
