<template>
  <el-row class="panel">
    <el-col :span="24">
      <el-row>
        <el-col :span="24">
          <h2 class="title">{{ $t('order.title.info') }}</h2>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-card shadow="hover">
            <el-row>
              <el-col :span="16" :offset="4">
                <div v-if="loading" class="pt-5">
                  <el-skeleton animated />
                </div>
                <div v-else class="order">
                  <el-descriptions :column="1">
                    <el-descriptions-item :label="$t('order.field.id')">
                      <span>{{ order?.id }} </span>
                      <copy-to-clipboard v-if="order?.id" :content="order?.id" class="inline-block" />
                    </el-descriptions-item>
                    <el-descriptions-item :label="$t('order.field.description')">
                      {{ order?.description }}
                    </el-descriptions-item>
                    <el-descriptions-item v-if="order?.application?.service" :label="$t('order.field.api')">
                      {{ order?.application?.service?.title }}
                    </el-descriptions-item>
                    <el-descriptions-item v-if="order?.pay_way" :label="$t('order.field.payWay')">
                      <span v-if="order?.pay_way === PayWay.WechatPay">{{ $t('order.title.wechatPay') }}</span>
                      <span v-if="order?.pay_way === PayWay.Stripe">{{ $t('order.title.stripe') }}</span>
                    </el-descriptions-item>
                    <el-descriptions-item :label="$t('order.field.createdAt')">
                      {{ $dayjs.format(order?.created_at) }}
                    </el-descriptions-item>
                    <el-descriptions-item :label="$t('order.field.price')">
                      <span v-if="order?.price && order?.price > 0" class="price unfree">
                        {{ getPriceString({ value: order?.price }) }}
                      </span>
                      <span v-else class="price free"> {{ $t('order.message.free') }} </span>
                    </el-descriptions-item>
                  </el-descriptions>
                </div>
              </el-col>
            </el-row>
            <el-row v-if="order?.state === OrderState.PAID || order?.state === OrderState.FINISHED" class="mb-5">
              <el-col :span="16" :offset="4">
                <el-divider border-style="dashed" />
                <el-alert :title="$t('order.message.paidSuccessfully')" type="success" show-icon :closable="false" />
              </el-col>
            </el-row>
            <el-row v-if="order?.state === OrderState.EXPIRED" class="mb-5">
              <el-col :span="16" :offset="4">
                <el-divider border-style="dashed" />
                <el-alert :title="$t('order.message.orderExpired')" type="error" show-icon :closable="false" />
              </el-col>
            </el-row>
            <el-row v-if="order?.state === OrderState.PENDING || order?.state === OrderState.FAILED">
              <el-col :span="16" :offset="4">
                <el-divider border-style="dashed" />
                <div v-if="showPayWays && order.price && order.price > 0 && !order.pay_way" class="payways mb-6">
                  <div
                    v-if="true"
                    :class="{
                      payway: true,
                      wechatpay: true,
                      active: payWay === PayWay.WechatPay
                    }"
                    @click="payWay = PayWay.WechatPay"
                  >
                    <span class="payicon wechatpay"></span>
                    <span class="payname">{{ $t('order.title.wechatPay') }}</span>
                  </div>
                  <div
                    v-if="false"
                    :class="{
                      payway: true,
                      alipay: true,
                      active: payWay === PayWay.AliPay
                    }"
                    @click="payWay = PayWay.AliPay"
                  >
                    <span class="payicon alipay"></span>
                    <span class="payname">{{ $t('order.title.aliPay') }}</span>
                  </div>
                  <div
                    v-if="true"
                    :class="{
                      payway: true,
                      stripe: true,
                      active: payWay === PayWay.Stripe
                    }"
                    @click="payWay = PayWay.Stripe"
                  >
                    <span class="payicon stripe"></span>
                    <span class="payname">{{ $t('order.title.stripe') }}</span>
                  </div>
                </div>
                <div v-if="!order?.pay_way">
                  <el-button :loading="prepaying" round type="primary" size="large" class="btn-pay" @click="onPay">{{
                    $t('common.button.pay')
                  }}</el-button>
                </div>
                <div v-else>
                  <el-button type="primary" round size="large" class="btn-repay" @click="onRepay">{{
                    $t('common.button.repay')
                  }}</el-button>
                </div>
              </el-col>
            </el-row>
          </el-card>
        </el-col>
      </el-row>
    </el-col>
  </el-row>
  <wechat-pay-order
    v-if="order && payWay === PayWay.WechatPay"
    v-model="order"
    :visible="paying"
    @hide="paying = false"
  />
  <stripe-pay-order v-if="order && payWay === PayWay.Stripe" v-model="order" :visible="paying" @hide="paying = false" />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { orderOperator } from '@/operators/order';
import {
  ElRow,
  ElCol,
  ElSkeleton,
  ElDivider,
  ElAlert,
  ElDescriptions,
  ElDescriptionsItem,
  ElButton,
  ElCard
} from 'element-plus';
import WechatPayOrder from '@/components/order/WechatPay.vue';
import StripePayOrder from '@/components/order/StripePay.vue';
import { IApplicationType, IOrder, IOrderDetailResponse, OrderState } from '@/models';
import { getPriceString } from '@/utils';
import CopyToClipboard from '@/components/common/CopyToClipboard.vue';

enum PayWay {
  WechatPay = 'WechatPay',
  Stripe = 'Stripe',
  AliPay = 'AliPay'
}

interface IData {
  PayWay: typeof PayWay;
  OrderState: typeof OrderState;
  payWay: PayWay | undefined;
  order: IOrder | undefined;
  loading: boolean;
  paying: boolean;
  showPayWays: boolean;
  prepaying: boolean;
  applicationType: typeof IApplicationType;
}

export default defineComponent({
  name: 'ConsoleOrderDetail',
  components: {
    ElButton,
    CopyToClipboard,
    ElRow,
    ElCard,
    ElCol,
    ElSkeleton,
    ElDivider,
    ElAlert,
    ElDescriptions,
    ElDescriptionsItem,
    WechatPayOrder,
    StripePayOrder
  },
  data(): IData {
    return {
      PayWay: PayWay,
      payWay: PayWay.WechatPay,
      OrderState: OrderState,
      order: undefined,
      showPayWays: true,
      loading: false,
      paying: false,
      prepaying: false,
      applicationType: IApplicationType
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
  watch: {
    order: {
      handler(val) {
        if (val?.state === OrderState.PAID) {
          setTimeout(() => {
            if (this.redirect) {
              window.location.replace(this.redirect?.toString());
            }
          }, 2000);
          return;
        }
      },
      deep: true
    }
  },
  mounted() {
    this.onFetchData();
  },
  methods: {
    getPriceString,
    onFetchData() {
      this.loading = true;
      orderOperator
        .refresh(this.id)
        .then(({ data: data }: { data: IOrderDetailResponse }) => {
          this.order = data;
          if (data.pay_way) {
            // @ts-ignore
            this.payWay = data.pay_way;
          }
          this.loading = false;
        })
        .catch(() => {
          this.loading = false;
        });
    },
    onRepay() {
      this.paying = true;
    },
    onPay() {
      this.prepaying = true;
      orderOperator
        .pay(this.id, {
          pay_way: this.payWay
        })
        .then(({ data: data }: { data: IOrderDetailResponse }) => {
          this.prepaying = false;
          this.order = data;
          if (this.order.price && this.order.price > 0) {
            this.paying = true;
          }
        })
        .catch(() => {
          this.prepaying = false;
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
  color: var(--el-text-color-primary);
}

.panel {
  padding: 30px;
  width: calc(100% - 300px);
  background-color: var(--el-bg-color-page);
  .el-card {
    min-height: 500px;
  }
  .order {
    padding-top: 50px;
    .price {
      font-size: 20px;
      font-weight: bold;
      &.unfree {
        color: #ff5441;
      }
      &.free {
        color: #29c287;
      }
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
      border: 2px solid var(--el-border-color);
      &:first-child {
        border-top-left-radius: 10px;
        border-bottom-left-radius: 10px;
      }
      &:last-child {
        border-top-right-radius: 10px;
        border-bottom-right-radius: 10px;
      }
      &:not(:last-child) {
        border-right: none;
      }
      &.active {
        border-top: 2px solid var(--el-color-primary);
        border-right: 2px solid var(--el-color-primary);
        border-bottom: 2px solid var(--el-color-primary);
        border-left: 2px solid var(--el-color-primary);
        & + .payway {
          border-left: none;
        }
      }
    }

    .payname {
      display: inline-block;
      font-size: 12px;
      margin-left: 5px;
      position: relative;
      top: -2px;
    }

    .payicon {
      width: 20px;
      height: 20px;
      margin-top: 2px;
      display: inline-block;
      &.wechatpay {
        position: relative;
        top: 3px;
        width: 22px;
        height: 19px;
        background-image: url(//midas.gtimg.cn/enterprise/images/ep_new_sprites@2x.png);
        background-repeat: no-repeat;
        background-size: 60px 250px;
        background-position: 0 -50px;
      }
      &.stripe {
        position: relative;
        top: 3px;
        width: 22px;
        height: 18px;
        background-image: url(//cdn.acedata.cloud/2023-08-27-164440.png);
        background-size: contain;
        background-repeat: no-repeat;
      }
    }
  }

  .btn-pay {
    width: 150px;
  }
}

@media (max-width: 767px) {
  .panel {
    width: 100%;
    height: 100%;
  }
}
</style>
