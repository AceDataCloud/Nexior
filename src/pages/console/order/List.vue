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
              <el-table-column prop="id" :label="$t('order.field.id')" class-name="text-center">
                <template #default="scope">
                  <span class="key">{{ scope.row.id }}</span>
                  <span class="copy">
                    <copy-to-clipboard :content="scope.row.id" />
                  </span>
                </template>
              </el-table-column>
              <el-table-column prop="price" :label="$t('order.field.price')">
                <template #default="scope">
                  <span class="key">{{ scope.row.price }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="state" :label="$t('order.field.state')" class-name="text-center" />
              <el-table-column>
                <template #default="scope">
                  <div class="float-right">
                    <el-button type="primary" @click="onContinuePay(scope.row)">
                      {{ $t('application.button.continuePay') }}
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
  <el-dialog v-model="paying" title="Warning" width="30%" center>
    <span> It should be noted that the content will not be aligned in center by default </span>
    <template #footer>
      {{ active.order?.wechatpay_url }}
    </template>
  </el-dialog>
</template>
<script lang="ts">
import { defineComponent } from 'vue';
import { IOrder, IOrderListResponse, IOrderDetailResponse, orderOperator } from '@/operators/order';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import Pagination from '@/components/common/Pagination.vue';
import CopyToClipboard from '@/components/common/CopyToClipboard.vue';
import { IService } from '@/operators/service/models';

interface IData {
  orders: IOrder[];
  loading: boolean;
  total: number | undefined;
  limit: number;
  page: number;
  paying: boolean;
  active: {
    service: IService | undefined;
    order: IOrder | undefined;
  };
}

export default defineComponent({
  name: 'OrderList',
  components: {
    FontAwesomeIcon,
    Pagination,
    CopyToClipboard
  },
  data(): IData {
    return {
      orders: [],
      loading: false,
      total: undefined,
      paying: false,
      limit: 8,
      active: {
        service: undefined,
        order: undefined
      },
      page: parseInt(this.$route.query.page?.toString() || '1')
    };
  },
  computed: {
    redirect() {
      return this.$route.query.redirect;
    }
  },
  watch: {},
  mounted() {
    this.onFetchData();
  },
  methods: {
    onContinuePay(order: IOrder) {
      this.active.order = order;
      this.paying = true;
    },
    onPageChange(page: number) {
      this.$router.push({
        name: this.$route.name?.toString(),
        query: {
          page: page
        }
      });
      this.onFetchData();
    },
    onFetchData() {
      this.loading = true;
      orderOperator
        .getAll({
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
.title {
  font-size: 26px;
  font-weight: bold;
  margin-bottom: 20px;
  color: #333;
}
.el-table {
  min-height: calc(100vh - 270px);
  margin-bottom: 50px;
}

.panel {
  padding: 30px;
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
