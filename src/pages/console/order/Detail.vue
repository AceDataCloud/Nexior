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
              <el-col :span="12" :offset="6">
                <div v-if="loading" class="pt-5">
                  <el-skeleton animated />
                </div>
                <div v-else class="order">
                  <el-descriptions :column="1">
                    <el-descriptions-item :label="$t('order.field.id')">{{ order?.id }}</el-descriptions-item>
                    <el-descriptions-item :label="$t('order.field.description')">
                      {{ order?.description }}
                    </el-descriptions-item>
                    <el-descriptions-item
                      v-if="order?.application?.type === applicationType.API"
                      :label="$t('order.field.api')"
                    >
                      {{ order?.application?.api?.title }}
                    </el-descriptions-item>
                    <el-descriptions-item :label="$t('order.field.amount')">
                      <span v-if="order?.application?.type === applicationType.API">
                        {{ order?.amount }}{{ $t(`api.unit.${order?.application?.api?.unit}`) }}
                      </span>
                    </el-descriptions-item>
                    <el-descriptions-item :label="$t('order.field.createdAt')">
                      {{ $dayjs.format(order?.created_at) }}
                    </el-descriptions-item>
                    <el-descriptions-item :label="$t('order.field.price')">
                      <span v-if="order?.price && order?.price > 0" class="price unfree">
                        ¥{{ order?.price?.toFixed(2) }}
                      </span>
                      <span v-else class="price free"> {{ $t('order.message.free') }} </span>
                    </el-descriptions-item>
                    <el-descriptions-item v-if="order?.pay_way" :label="$t('order.field.payWay')">
                      <span v-if="order?.pay_way === PayWay.WechatPay">
                        {{ $t('order.title.wechatPay') }}
                      </span>
                      <span v-if="order?.pay_way === PayWay.AliPay">
                        {{ $t('order.title.aliPay') }}
                      </span>
                      <span v-if="order?.pay_way === PayWay.Stripe">
                        {{ $t('order.title.stripe') }}
                      </span>
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
                <div v-if="order.price && order.price > 0 && !order.pay_way" class="payways mb-4">
                  <div
                    :class="{
                      payway: true,
                      wechatpay: true,
                      active: payWay === PayWay.WechatPay
                    }"
                    @click="payWay = PayWay.WechatPay"
                  >
                    <span class="payicon wechatpay"></span>
                    {{ $t('order.title.wechatPay') }}
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
                    {{ $t('order.title.aliPay') }}
                  </div>
                  <div
                    v-if="false"
                    :class="{
                      payway: true,
                      stripe: true,
                      active: payWay === PayWay.Stripe
                    }"
                    @click="payWay = PayWay.Stripe"
                  >
                    <span class="payicon stripe"></span>
                    {{ $t('order.title.stripe') }}
                  </div>
                </div>
                <div v-if="!order?.pay_way">
                  <el-button :loading="prepaying" type="primary" size="large" class="btn-pay" @click="onPay">{{
                    $t('common.button.pay')
                  }}</el-button>
                </div>
                <div v-else>
                  <el-button type="primary" size="large" class="btn-repay" @click="onRepay">{{
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
  prepaying: boolean;
  applicationType: typeof IApplicationType;
}

export default defineComponent({
  name: 'ConsoleOrderDetail',
  components: {
    ElButton,
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
      background-image: url(https://acedatacloud-1256437459.cos.ap-beijing.myqcloud.com/2023-08-27-164440.png);
      background-size: contain;
      background-repeat: no-repeat;
    }
  }
}

.btn-pay,
.btn-repay {
  width: 150px;
  border-radius: 20px;
}
</style>
