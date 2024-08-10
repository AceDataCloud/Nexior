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
            <el-table v-loading="loading" :data="orders" stripe>
              <el-table-column prop="id" :label="$t('order.field.id')" class-name="text-center" width="350px">
                <template #default="scope">
                  <span class="key">{{ scope.row.id }}</span>
                  <span class="copy">
                    <copy-to-clipboard :content="scope.row.id" />
                  </span>
                </template>
              </el-table-column>
              <el-table-column :label="$t('order.field.price')" width="100px">
                <template #default="scope">
                  <span class="price">{{ getPriceString({ value: scope.row?.price }) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="state" :label="$t('order.field.state')" class-name="text-center" width="150px">
                <template #default="scope">
                  <span v-if="scope.row.state === OrderState?.PENDING">
                    <el-tag type="info" class="mx-1" effect="dark">{{ $t('order.state.pending') }}</el-tag>
                  </span>
                  <span v-else-if="scope.row.state === OrderState?.PAID" class="state state-paid">
                    <el-tag type="success" class="mx-1" effect="dark">{{ $t('order.state.paid') }}</el-tag>
                  </span>
                  <span v-else-if="scope.row.state === OrderState?.FINISHED" class="state state-finished">
                    <el-tag type="success" class="mx-1" effect="dark">{{ $t('order.state.finished') }}</el-tag>
                  </span>
                  <span v-else-if="scope.row.state === OrderState?.EXPIRED" class="state state-expired">
                    <el-tag type="warning" class="mx-1" effect="dark">{{ $t('order.state.expired') }}</el-tag>
                  </span>
                  <span v-else-if="scope.row.state === OrderState?.FAILED" class="state state-failed">
                    <el-tag type="danger" class="mx-1" effect="dark"> {{ $t('order.state.failed') }}</el-tag>
                  </span>
                </template>
              </el-table-column>
              <el-table-column :label="$t('order.field.description')" width="300px">
                <template #default="scope">
                  <span class="description">{{ scope.row.description }}</span>
                </template>
              </el-table-column>
              <el-table-column :label="$t('order.field.createdAt')" width="180px">
                <template #default="scope">
                  <span class="created-at">{{ $dayjs.format(scope.row.created_at) }}</span>
                </template>
              </el-table-column>
              <el-table-column fixed="right" min-width="120px">
                <template #default="scope">
                  <div class="float-right">
                    <el-button
                      v-if="scope.row.state !== OrderState.PAID || scope.row.state !== OrderState.FINISHED"
                      type="primary"
                      size="small"
                      round
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
                      round
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
      // dynamic calculate the limit according to window height
      limit: Math.floor((window.innerHeight - 300) / 50)
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
    height: calc(100vh - 350px);
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

@media (max-width: 767px) {
  .panel {
    width: 100%;
    height: 100%;
  }
}
</style>
