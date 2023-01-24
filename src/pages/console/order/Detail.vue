<template>
  <el-row class="wrapper">
    <el-col :span="24">
      <el-row>
        <el-col :span="24">
          <h2 class="title">{{ $t('common.title.orderInfo') }}</h2>
        </el-col>
      </el-row>
      <el-row class="panel">
        <el-col :span="24">
          <el-card shadow="hover">
            <el-row>
              <el-col :span="12" :offset="6">
                <div v-if="loading">
                  <el-skeleton />
                </div>
                <div v-else class="order">
                  <el-descriptions :title="$t('order.title.info')" :column="1">
                    <el-descriptions-item :label="$t('order.field.id')">{{ order?.id }}</el-descriptions-item>
                    <el-descriptions-item :label="$t('order.field.description')">
                      {{ order?.description }}
                    </el-descriptions-item>
                    <el-descriptions-item :label="$t('order.field.service')">
                      {{ order?.application?.service?.title }}
                    </el-descriptions-item>
                    <el-descriptions-item :label="$t('order.field.amount')">
                      {{ order?.amount }}
                    </el-descriptions-item>
                    <el-descriptions-item :label="$t('order.field.createdAt')">
                      {{ $dayjs.format(order?.created_at) }}
                    </el-descriptions-item>
                    <el-descriptions-item v-if="order?.price" :label="$t('order.field.price')">
                      <span class="price">¥{{ order?.price?.toFixed(2) }}</span>
                    </el-descriptions-item>
                  </el-descriptions>
                </div>
              </el-col>
            </el-row>
            <el-row v-if="order?.state === OrderState.PAID" class="mb-5">
              <el-col :span="12" :offset="6">
                <el-divider border-style="dashed" />
                <el-alert :title="$t('order.message.paidSuccessfully')" type="success" show-icon :closable="false" />
              </el-col>
            </el-row>
            <el-row v-if="order?.state === OrderState.PENDING || order?.state === OrderState.FAILED">
              <el-col :span="12" :offset="6">
                <el-divider border-style="dashed" />
                <div class="payways">
                  <div
                    :class="{
                      payway: true,
                      wechat: true,
                      active: payWay === PayWay.WechatPay
                    }"
                  >
                    <span class="payicon wechat"></span>
                    {{ $t('course.title.payWayWechat') }}
                  </div>
                </div>
              </el-col>
            </el-row>
            <el-row v-if="order?.state === OrderState.PENDING || order?.state === OrderState.FAILED">
              <el-col :span="12" :offset="6">
                <el-row class="paycodes">
                  <el-col :span="12">
                    <div class="paycode wechat">
                      <qr-code v-if="order?.wechatpay_url" :value="order?.wechatpay_url" :size="200" class="m-auto" />
                      <p class="help-text">{{ $t('course.message.wechatPayHelp') }}</p>
                    </div>
                  </el-col>
                  <el-col :span="12">
                    <div class="help-img">
                      <img src="https://midas.gtimg.cn/enterprise/images/ep_sys_wx_tip.jpg" />
                    </div>
                  </el-col>
                </el-row>
              </el-col>
            </el-row>
          </el-card>
        </el-col>
      </el-row>
    </el-col>
  </el-row>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { IOrder, IOrderDetailResponse, orderOperator, OrderState } from '@/operators/order';
import QrCode from 'qrcode.vue';

enum PayWay {
  WechatPay = 'WechatPay',
  AliPay = 'AliPay'
}

interface IData {
  PayWay: typeof PayWay;
  OrderState: typeof OrderState;
  payWay: PayWay | undefined;
  order: IOrder | undefined;
  loading: boolean;
}

export default defineComponent({
  name: 'ConsoleOrderDetail',
  components: {
    QrCode
  },
  data(): IData {
    return {
      PayWay: PayWay,
      payWay: PayWay.WechatPay,
      OrderState: OrderState,
      order: undefined,
      loading: false
    };
  },
  computed: {
    id() {
      return this.$route.params?.id?.toString();
    },
    redirect() {
      return this.$route.query?.redirect;
    }
  },
  watch: {},
  mounted() {
    this.onFetchData();
    this.onCheck();
  },
  methods: {
    onFetchData() {
      this.loading = true;
      orderOperator
        .get(this.id)
        .then(({ data: data }: { data: IOrderDetailResponse }) => {
          this.order = data;
          this.loading = false;
        })
        .catch(() => {
          this.loading = false;
        });
    },
    onCheck() {
      orderOperator
        .refresh(this.id)
        .then(({ data: data }: { data: IOrderDetailResponse }) => {
          this.order = data;
          if (this.order.state === OrderState.PAID) {
            setTimeout(() => {
              if (this.redirect) {
                window.location.replace(this.redirect?.toString());
              }
            }, 2000);
            return;
          }
          setTimeout(() => {
            this.onCheck();
          }, 2000);
        })
        .catch(() => {
          setTimeout(() => {
            this.onCheck();
          }, 2000);
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

.wrapper {
  padding: 30px;

  .panel {
    .el-card {
      min-height: 500px;
    }
    .order {
      .price {
        font-size: 20px;
        font-weight: bold;
      }
    }
    .payways {
      overflow: hidden;
      .payway {
        cursor: pointer;
        font-size: 14px;
        float: left;
        width: 120px;
        line-height: 40px;
        text-align: center;
        height: 40px;
        border: 1px solid #eee;
        &.active {
          border: 1px solid #3879d1;
        }
      }

      .payicon {
        width: 20px;
        height: 20px;
        margin-top: 2px;
        display: inline-block;
        &.wechat {
          position: relative;
          top: 3px;
          width: 22px;
          height: 19px;
          background-image: url(//midas.gtimg.cn/enterprise/images/ep_new_sprites@2x.png);
          background-repeat: no-repeat;
          background-size: 60px 250px;
          background-position: 0 -50px;
        }
      }
    }

    .paycodes {
      padding: 30px 0;
      .wechat {
        .help-text {
          display: block;
          background-color: #00c800;
          color: white;
          font-size: 14px;
          height: 35px;
          width: 240px;
          text-align: center;
          line-height: 35px;
          margin: 10px auto 0 auto;
        }
      }
    }
  }
}
</style>
