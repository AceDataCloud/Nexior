<template>
  <el-row class="wrapper">
    <el-col :span="24">
      <el-row>
        <el-col :span="24">
          <h2 class="title">{{ $t('order.title.info') }}</h2>
        </el-col>
      </el-row>
      <el-row class="panel">
        <el-col :span="24">
          <el-card shadow="hover">
            <el-row>
              <el-col :xs="{ span: 22, offset: 1 }" :sm="{ span: 16, offset: 4 }">
                <div v-if="loading" class="pt-5">
                  <el-skeleton animated />
                </div>
                <div v-else-if="!order" class="pt-10 text-center">
                  <el-alert :title="$t('order.message.publicPayNotFound')" type="error" show-icon :closable="false" />
                </div>
                <div v-else class="order">
                  <el-descriptions :column="1">
                    <el-descriptions-item :label="$t('order.field.id')">
                      <span>{{ order.id }} </span>
                      <copy-to-clipboard v-if="order.id" :content="order.id" class="inline-block" />
                    </el-descriptions-item>
                    <el-descriptions-item :label="$t('order.field.description')">
                      {{ order.description }}
                    </el-descriptions-item>
                    <el-descriptions-item v-if="order.pay_way" :label="$t('order.field.payWay')">
                      <el-tag type="info" effect="dark" round size="small">
                        {{ payWayLabel(order.pay_way) }}
                      </el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item :label="$t('order.field.createdAt')">
                      {{ $dayjs.format(order.created_at || '') }}
                    </el-descriptions-item>
                    <el-descriptions-item :label="$t('order.field.price')">
                      <span v-if="order.price && order.price > 0" class="price current unfree">
                        {{ getPriceString({ value: order.price }) }}
                      </span>
                      <span v-else class="price free"> {{ $t('order.message.free') }} </span>
                    </el-descriptions-item>
                  </el-descriptions>
                </div>
              </el-col>
            </el-row>
            <el-row v-if="order?.state === OrderState.PAID || order?.state === OrderState.FINISHED" class="mb-5">
              <el-col :xs="{ span: 22, offset: 1 }" :sm="{ span: 16, offset: 4 }">
                <el-divider border-style="dashed" />
                <el-alert :title="$t('order.message.paidSuccessfully')" type="success" show-icon :closable="false" />
              </el-col>
            </el-row>
            <el-row v-if="order?.state === OrderState.EXPIRED" class="mb-5">
              <el-col :xs="{ span: 22, offset: 1 }" :sm="{ span: 16, offset: 4 }">
                <el-divider border-style="dashed" />
                <el-alert :title="$t('order.message.orderExpired')" type="error" show-icon :closable="false" />
              </el-col>
            </el-row>
            <el-row v-if="order?.state === OrderState.FAILED" class="mb-5">
              <el-col :xs="{ span: 22, offset: 1 }" :sm="{ span: 16, offset: 4 }">
                <el-divider border-style="dashed" />
                <el-alert :title="$t('order.state.failed')" type="error" show-icon :closable="false" />
              </el-col>
            </el-row>
            <el-row v-if="order?.state === OrderState.PENDING">
              <el-col :xs="{ span: 22, offset: 1 }" :sm="{ span: 16, offset: 4 }">
                <el-divider border-style="dashed" />
                <div v-if="!order.pay_way && order.price && order.price > 0" class="payways mb-6">
                  <div
                    :class="{ payway: true, wechatpay: true, active: payWay === PayWay.WechatPay }"
                    @click="payWay = PayWay.WechatPay"
                  >
                    <span class="payicon wechatpay"></span>
                    <span class="payname">{{ $t('order.title.wechatPay') }}</span>
                  </div>
                  <div
                    :class="{ payway: true, alipay: true, active: payWay === PayWay.AliPay }"
                    @click="payWay = PayWay.AliPay"
                  >
                    <span class="payicon alipay"></span>
                    <span class="payname">{{ $t('order.title.aliPay') }}</span>
                  </div>
                  <div
                    :class="{ payway: true, stripe: true, active: payWay === PayWay.Stripe }"
                    @click="payWay = PayWay.Stripe"
                  >
                    <span class="payicon stripe"></span>
                    <span class="payname">{{ $t('order.title.stripe') }}</span>
                  </div>
                </div>
                <div v-if="!order.pay_way">
                  <el-button :loading="prepaying" round type="primary" size="large" class="btn-pay" @click="onPay">
                    {{ $t('common.button.pay') }}
                  </el-button>
                </div>
                <div v-else>
                  <el-button type="primary" round size="large" class="btn-repay" @click="onRepay">
                    {{ $t('common.button.repay') }}
                  </el-button>
                </div>
              </el-col>
            </el-row>
          </el-card>
        </el-col>
      </el-row>
    </el-col>
  </el-row>
  <public-wechat-pay
    v-if="order && payWay === PayWay.WechatPay"
    :order="order"
    :visible="paying"
    @hide="paying = false"
  />
  <public-stripe-pay v-if="order && payWay === PayWay.Stripe" :order="order" :visible="paying" @hide="paying = false" />
  <public-alipay-pay v-if="order && payWay === PayWay.AliPay" :order="order" :visible="paying" @hide="paying = false" />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { orderOperator } from '@/operators';
import { IOrder, IOrderDetailResponse, OrderState } from '@/models';
import {
  ElRow,
  ElCol,
  ElCard,
  ElSkeleton,
  ElDivider,
  ElAlert,
  ElDescriptions,
  ElDescriptionsItem,
  ElButton,
  ElTag
} from 'element-plus';
import PublicWechatPay from '@/components/order/public/WechatPay.vue';
import PublicStripePay from '@/components/order/public/StripePay.vue';
import PublicAlipayPay from '@/components/order/public/AliPay.vue';
import CopyToClipboard from '@/components/common/CopyToClipboard.vue';
import { getPaymentSurface, getPriceString } from '@/utils';

// Polls the AllowAny GET /orders/<id> endpoint — POST /orders/<id>/refresh/
// is IsAuthenticated and would 401 here.
const POLL_INTERVAL_MS = 7000;
const POLL_INITIAL_DELAY_MS = 2000;

// Mirrors PlatformBackend's ANON_ALLOWED_PAY_WAYS. X402/PayPal need a
// request.user the anonymous flow can't supply and would 403 server-side.
enum PayWay {
  WechatPay = 'WechatPay',
  Stripe = 'Stripe',
  AliPay = 'AliPay'
}

interface IData {
  PayWay: typeof PayWay;
  OrderState: typeof OrderState;
  payWay: PayWay;
  order: IOrder | undefined;
  loading: boolean;
  paying: boolean;
  prepaying: boolean;
}

export default defineComponent({
  name: 'OrderPublicPay',
  components: {
    ElButton,
    ElRow,
    ElCol,
    ElCard,
    ElSkeleton,
    ElDivider,
    ElAlert,
    ElDescriptions,
    ElDescriptionsItem,
    ElTag,
    PublicWechatPay,
    PublicStripePay,
    PublicAlipayPay,
    CopyToClipboard
  },
  data(): IData {
    return {
      PayWay,
      OrderState,
      payWay: PayWay.WechatPay,
      order: undefined,
      loading: false,
      paying: false,
      prepaying: false
    };
  },
  computed: {
    id(): string {
      return this.$route.params?.id?.toString() ?? '';
    }
  },
  watch: {
    paying(val: boolean) {
      if (val) this.startOrderPolling(POLL_INITIAL_DELAY_MS);
      else this.stopOrderPolling();
    }
  },
  created() {
    (this as any)._orderRefreshTimer = undefined;
  },
  mounted() {
    this.onFetchData();
  },
  beforeUnmount() {
    this.stopOrderPolling();
  },
  methods: {
    getPriceString,
    payWayLabel(payWay: string): string {
      const map: Record<string, string> = {
        WechatPay: this.$t('order.title.wechatPay') as string,
        Stripe: this.$t('order.title.stripe') as string,
        AliPay: this.$t('order.title.aliPay') as string
      };
      return map[payWay] || payWay;
    },
    onFetchData() {
      if (!this.id) return;
      this.loading = true;
      orderOperator
        .get(this.id)
        .then(({ data }: { data: IOrderDetailResponse }) => {
          this.order = data;
          if (data?.pay_way && (data.pay_way as any) in PayWay) {
            this.payWay = data.pay_way as PayWay;
          }
          this.loading = false;
        })
        .catch(() => {
          this.order = undefined;
          this.loading = false;
        });
    },
    startOrderPolling(delay = 0) {
      this.stopOrderPolling();
      const poll = async () => {
        try {
          const { data } = await orderOperator.get(this.id);
          this.order = data;
          if (
            data?.state === OrderState.PAID ||
            data?.state === OrderState.FINISHED ||
            data?.state === OrderState.FAILED ||
            data?.state === OrderState.EXPIRED
          ) {
            this.paying = false;
            this.stopOrderPolling();
            return;
          }
        } catch {
          // Network blip — keep polling while dialog is open.
        }
        if (this.paying) {
          (this as any)._orderRefreshTimer = window.setTimeout(poll, POLL_INTERVAL_MS);
        }
      };
      (this as any)._orderRefreshTimer = window.setTimeout(poll, delay);
    },
    stopOrderPolling() {
      const t = (this as any)._orderRefreshTimer as number | undefined;
      if (t) {
        clearTimeout(t);
        (this as any)._orderRefreshTimer = undefined;
      }
    },
    onRepay() {
      this.paying = true;
    },
    onPay() {
      if (!this.id) return;
      this.prepaying = true;
      // AliPay's backend serves Page (PC) and Wap (mobile) URLs based on
      // the `surface` hint. WeChat Pay is pinned to Native QR on our
      // merchant so we omit surface there. Stripe doesn't have a native
      // app variant on the anonymous page so 'pc' / 'wap' is moot.
      const payload: Record<string, unknown> = { pay_way: this.payWay };
      if (this.payWay === PayWay.AliPay) {
        payload.surface = getPaymentSurface();
      }
      orderOperator
        .pay(this.id, payload as any)
        .then(({ data }: { data: IOrderDetailResponse }) => {
          this.prepaying = false;
          if (data?.id) {
            this.order = data;
          }
          if (this.order && this.order.price && this.order.price > 0) {
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

.wrapper {
  padding: 24px 12px;
  max-width: 960px;
  margin: 0 auto;
  .panel {
    .el-card {
      min-height: 400px;
    }
    .order {
      padding-top: 30px;
      .price {
        font-size: 20px;
        font-weight: bold;
        &.current {
          font-size: 24px;
        }
        &.unfree {
          color: #ff5441;
        }
        &.free {
          color: #29c287;
        }
      }
    }
    .payways {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 20px;
      .payway {
        cursor: pointer;
        font-size: 13px;
        padding: 0 18px;
        height: 40px;
        border: 2px solid var(--el-border-color);
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        line-height: 1;
        &.active {
          border: 2px solid var(--el-color-primary);
        }
      }
      .payname {
        display: inline-block;
        font-size: 13px;
        font-weight: 500;
      }
      .payicon {
        width: 22px;
        height: 22px;
        display: inline-block;
        background-position: center;
        background-repeat: no-repeat;
        &.wechatpay {
          background-image: url(//midas.gtimg.cn/enterprise/images/ep_new_sprites@2x.png);
          background-size: 60px 250px;
          background-position: 0 -50px;
        }
        &.stripe {
          background-image: url(//cdn.acedata.cloud/2023-08-27-164440.png);
          background-size: contain;
        }
        &.alipay {
          background-image: url(//cdn.acedata.cloud/alipay.webp);
          background-size: contain;
        }
      }
    }
    .btn-pay,
    .btn-repay {
      width: 150px;
    }
  }
}
</style>
