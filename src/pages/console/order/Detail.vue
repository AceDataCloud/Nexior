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
                      <span v-else-if="order?.pay_way === PayWay.Stripe">{{ $t('order.title.stripe') }}</span>
                      <span v-else-if="order?.pay_way === PayWay.AliPay">{{ $t('order.title.aliPay') }}</span>
                      <span v-else-if="order?.pay_way === PayWay.X402">{{ $t('order.title.x402') }}</span>
                    </el-descriptions-item>
                    <el-descriptions-item :label="$t('order.field.createdAt')">
                      {{ $dayjs.format(order?.created_at) }}
                    </el-descriptions-item>
                    <el-descriptions-item :label="$t('order.field.price')">
                      <div v-if="shouldShowPriceBlock" class="price-block">
                        <div class="price-line">
                          <span v-if="showOriginalPrice" class="price original">
                            {{
                              getPriceString({
                                value: finalOriginalPrice
                              })
                            }}
                          </span>
                          <span class="price current unfree">
                            {{
                              getPriceString({
                                value: finalDiscountedPrice
                              })
                            }}
                          </span>
                          <el-tag
                            v-for="badge in discountBadges"
                            :key="badge.key"
                            class="discount-tag"
                            effect="light"
                            size="small"
                            :type="badge.type"
                          >
                            {{ badge.text }}
                          </el-tag>
                        </div>
                        <p v-for="(hint, index) in discountHints" :key="index" class="discount-hint">
                          {{ hint }}
                        </p>
                      </div>
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
            <el-row v-if="order?.state === OrderState.FAILED" class="mb-5">
              <el-col :span="16" :offset="4">
                <el-divider border-style="dashed" />
                <el-alert
                  :title="$t('order.state.failed')"
                  :description="orderFailedReason"
                  type="error"
                  show-icon
                  :closable="false"
                />
              </el-col>
            </el-row>
            <el-row v-if="order?.state === OrderState.PENDING">
              <el-col :span="16" :offset="4">
                <el-divider border-style="dashed" />
                <div v-if="showPayWays && order.price && order.price > 0 && !order.pay_way" class="payways mb-6">
                  <div
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
                  <div
                    :class="{
                      payway: true,
                      x402: true,
                      relative: true,
                      active: payWay === PayWay.X402
                    }"
                    @click="payWay = PayWay.X402"
                  >
                    <span class="payicon x402"></span>
                    <span class="payname">{{ $t('order.title.x402') }}</span>
                    <el-tag
                      v-if="x402DiscountRate > 0"
                      class="absolute -top-2 right-0"
                      effect="light"
                      size="small"
                      type="success"
                    >
                      {{ $t('order.message.x402DiscountTag', { percent: x402BadgePercent }) }}
                    </el-tag>
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
      <el-row>
        <el-col :span="24">
          <wechat-pay-order
            v-if="order && payWay === PayWay.WechatPay"
            v-model="order"
            :visible="paying"
            @hide="paying = false"
          />
          <stripe-pay-order
            v-if="order && payWay === PayWay.Stripe"
            v-model="order"
            :visible="paying"
            @hide="paying = false"
          />
          <alipay-pay-order
            v-if="order && payWay === PayWay.AliPay"
            v-model="order"
            :visible="paying"
            @hide="paying = false"
          />
          <x402-pay-order
            v-if="order && payWay === PayWay.X402"
            v-model="order"
            :session="x402Session"
            :visible="paying"
            @hide="paying = false"
          />
        </el-col>
      </el-row>
    </el-col>
  </el-row>
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
  ElCard,
  ElTag
} from 'element-plus';
import WechatPayOrder from '@/components/order/WechatPay.vue';
import StripePayOrder from '@/components/order/StripePay.vue';
import AlipayPayOrder from '@/components/order/AliPay.vue';
import X402PayOrder from '@/components/order/X402Pay.vue';
import { IConfigResponse, IOrder, IOrderDetailResponse, OrderState } from '@/models';
import { getPriceString } from '@/utils';
import CopyToClipboard from '@/components/common/CopyToClipboard.vue';

const POLL_INTERVAL_MS = 7000;
const POLL_INITIAL_DELAY_MS = 2000;

enum PayWay {
  WechatPay = 'WechatPay',
  Stripe = 'Stripe',
  AliPay = 'AliPay',
  X402 = 'X402'
}

interface IData {
  PayWay: typeof PayWay;
  OrderState: typeof OrderState;
  payWay: PayWay | undefined;
  order: IOrder | undefined;
  x402Session: Record<string, any> | undefined;
  loading: boolean;
  paying: boolean;
  showPayWays: boolean;
  prepaying: boolean;
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
    ElTag,
    WechatPayOrder,
    StripePayOrder,
    AlipayPayOrder,
    X402PayOrder
  },
  data(): IData {
    return {
      PayWay: PayWay,
      payWay: PayWay.WechatPay,
      OrderState: OrderState,
      order: undefined,
      x402Session: undefined,
      showPayWays: true,
      loading: false,
      paying: false,
      prepaying: false
    };
  },
  computed: {
    config(): IConfigResponse | undefined {
      return this.$store.getters.config as IConfigResponse | undefined;
    },
    id() {
      return this.$route.params?.id?.toString();
    },
    redirect() {
      return this.$route.query?.redirect;
    },
    pricingInfo(): {
      original: number;
      discounted: number;
      discountRate: number;
      discountedMethods: string[];
      discountRateVip?: number;
      discountRateX402?: number;
    } {
      const metadataPricing = (this.order?.metadata?.pricing || {}) as Record<string, any>;
      const safeNumber = (value: unknown): number | undefined =>
        typeof value === 'number' && Number.isFinite(value) ? value : undefined;
      const originalCandidate = safeNumber(metadataPricing?.original_price);
      const discountedCandidate = safeNumber(metadataPricing?.discounted_price);
      const discountRateCandidate = safeNumber(metadataPricing?.discount_rate);
      const discountRateVipCandidate = safeNumber(metadataPricing?.discount_rate_vip);
      const discountRateX402Candidate = safeNumber(metadataPricing?.discount_rate_x402);
      const basePrice = safeNumber(this.order?.price);
      const original = originalCandidate ?? basePrice ?? 0;
      const discounted = discountedCandidate ?? basePrice ?? original;
      const discountRate = safeNumber((this.order as any)?.discount) ?? discountRateCandidate ?? 0;
      const discountedMethods = Array.isArray(metadataPricing?.discounted_methods)
        ? (metadataPricing.discounted_methods as unknown[]).filter(
            (method): method is string => typeof method === 'string' && method.length > 0
          )
        : [];
      return {
        original,
        discounted,
        discountRate,
        discountedMethods,
        discountRateVip: discountRateVipCandidate,
        discountRateX402: discountRateX402Candidate
      };
    },
    appliedDiscountMethods(): string[] {
      return this.pricingInfo.discountedMethods || [];
    },
    hasVipApplied(): boolean {
      return this.appliedDiscountMethods.includes('vip');
    },
    hasX402Applied(): boolean {
      return this.appliedDiscountMethods.includes('x402');
    },
    pendingX402Preview(): boolean {
      return this.payWay === PayWay.X402 && this.order?.pay_way !== PayWay.X402 && this.x402DiscountRate > 0;
    },
    finalOriginalPrice(): number {
      return this.pricingInfo.original || 0;
    },
    baseEffectivePrice(): number {
      const price = this.order?.price;
      if (typeof price === 'number' && Number.isFinite(price)) {
        return price;
      }
      return this.pricingInfo.discounted;
    },
    previewX402Price(): number {
      const base = this.baseEffectivePrice || 0;
      const rate = this.x402DiscountRate;
      if (!rate || rate <= 0) {
        return base;
      }
      return base * (1 - rate);
    },
    finalDiscountedPrice(): number {
      if (this.pendingX402Preview) {
        return this.previewX402Price;
      }
      return this.baseEffectivePrice;
    },
    showOriginalPrice(): boolean {
      if (this.finalOriginalPrice <= 0) {
        return false;
      }
      return this.finalOriginalPrice > this.finalDiscountedPrice;
    },
    totalDiscountRate(): number {
      const appliedRate = this.pricingInfo.discountRate ?? 0;
      if (this.pendingX402Preview) {
        const multiplier = 1 - appliedRate;
        const combined = multiplier * (1 - this.x402DiscountRate);
        return 1 - combined;
      }
      return appliedRate;
    },
    hasAnyDiscount(): boolean {
      return this.totalDiscountRate > 0;
    },
    discountBadges(): { key: string; text: string; type: 'success' | 'warning' }[] {
      const badges: { key: string; text: string; type: 'success' | 'warning' }[] = [];
      if (this.hasVipApplied && this.vipDiscountPercent) {
        badges.push({
          key: 'vip',
          text: this.$t('order.message.discountTag', { percent: this.vipDiscountPercent }).toString(),
          type: 'success'
        });
      }
      if (this.shouldDisplayX402Badge && this.x402BadgePercent) {
        badges.push({
          key: 'x402',
          text: this.$t('order.message.x402DiscountTag', { percent: this.x402BadgePercent }).toString(),
          type: 'success'
        });
      }
      return badges;
    },
    discountHints(): string[] {
      const hints: string[] = [];
      if (this.hasVipApplied && this.vipDiscountPercent) {
        hints.push(this.$t('order.message.discountHint', { percent: this.vipDiscountPercent }).toString());
      }
      if (this.hasX402Applied && this.x402AppliedPercent) {
        hints.push(this.$t('order.message.x402DiscountApplied', { percent: this.x402AppliedPercent }).toString());
      } else if (this.pendingX402Preview && this.x402BadgePercent) {
        hints.push(this.$t('order.message.x402DiscountHint', { percent: this.x402BadgePercent }).toString());
      }
      return hints;
    },
    x402DiscountRate(): number {
      const candidate = this.config?.features?.DISCOUNT_FOR_X402;
      if (typeof candidate === 'number' && Number.isFinite(candidate) && candidate > 0) {
        return candidate;
      }
      return 0;
    },
    vipDiscountPercent(): string {
      const percent = (this.pricingInfo.discountRateVip ?? 0) * 100;
      if (!Number.isFinite(percent) || percent <= 0) {
        return '';
      }
      return Number.isInteger(percent) ? percent.toFixed(0) : percent.toFixed(1);
    },
    x402AppliedPercent(): string {
      const rate = this.pricingInfo.discountRateX402 ?? 0;
      const percent = rate * 100;
      if (!Number.isFinite(percent) || percent <= 0) {
        return '';
      }
      return Number.isInteger(percent) ? percent.toFixed(0) : percent.toFixed(1);
    },
    x402BadgePercent(): string {
      const rate = this.hasX402Applied
        ? this.pricingInfo.discountRateX402 ?? this.x402DiscountRate
        : this.x402DiscountRate;
      const percent = rate * 100;
      if (!Number.isFinite(percent) || percent <= 0) {
        return '';
      }
      return Number.isInteger(percent) ? percent.toFixed(0) : percent.toFixed(1);
    },
    shouldDisplayX402Badge(): boolean {
      return this.hasX402Applied || this.pendingX402Preview;
    },
    shouldShowPriceBlock(): boolean {
      return (
        this.finalOriginalPrice > 0 || this.finalDiscountedPrice > 0 || this.hasAnyDiscount || this.pendingX402Preview
      );
    },
    orderFailedReason(): string | undefined {
      if (!this.order || this.order.state !== OrderState.FAILED) return undefined;
      const metadata = (this.order.metadata || {}) as Record<string, any>;
      const lastError = (metadata?.x402?.last_error || {}) as Record<string, any>;
      const reason = typeof lastError.reason === 'string' ? lastError.reason.trim() : '';
      return reason || undefined;
    }
  },
  watch: {
    paying(val: boolean) {
      if (val) this.startOrderPolling();
      else this.stopOrderPolling();
    },
    order: {
      handler(val) {
        if (val?.state === OrderState.PAID) {
          this.x402Session = undefined;
          setTimeout(() => {
            if (this.redirect) {
              window.location.replace(this.redirect?.toString());
            }
          }, 2000);
          return;
        }
        if (val?.state && val.state !== OrderState.PENDING && val.state !== OrderState.FAILED) {
          this.x402Session = undefined;
        }
      },
      deep: true
    },
    payWay(val) {
      if (val !== PayWay.X402) {
        this.x402Session = undefined;
      }
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
    startOrderPolling(delay = 0) {
      this.stopOrderPolling();
      const poll = async () => {
        try {
          const { data } = await orderOperator.refresh(this.id);
          this.order = data;
          if (
            data?.state === OrderState.PAID ||
            data?.state === OrderState.FAILED ||
            data?.state === OrderState.EXPIRED
          ) {
            this.paying = false;
            this.stopOrderPolling();
            return;
          }
        } catch {}
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
    onFetchData() {
      this.loading = true;
      orderOperator
        .refresh(this.id)
        .then(({ data: data }: { data: IOrderDetailResponse }) => {
          this.order = data;
          if (data.pay_way) {
            this.payWay = data.pay_way as PayWay;
          }
          this.loading = false;
        })
        .catch(() => {
          this.loading = false;
        });
    },
    onRepay() {
      if (this.payWay === PayWay.X402) {
        this.x402Session = undefined;
      }
      this.paying = true;
      this.startOrderPolling();
    },
    onPay() {
      this.prepaying = true;
      if (this.payWay === PayWay.X402) {
        this.x402Session = undefined;
      }
      orderOperator
        .pay(this.id, {
          pay_way: this.payWay
        })
        .then(({ data: data }: { data: IOrderDetailResponse }) => {
          this.prepaying = false;
          if (data?.id) {
            this.order = data;
          }
          if (this.payWay === PayWay.X402 && data) {
            const sessionCandidate = data as unknown as Record<string, any>;
            if (sessionCandidate.accepts) {
              this.x402Session = sessionCandidate;
            }
          }
          if ((this.order && this.order.price && this.order.price > 0) || this.payWay === PayWay.X402) {
            this.paying = true;
            this.startOrderPolling(POLL_INITIAL_DELAY_MS);
          }
        })
        .catch((error: any) => {
          this.prepaying = false;
          const session = error?.response?.data;
          if (this.payWay === PayWay.X402 && session) {
            this.x402Session = session;
            this.paying = true;
            this.startOrderPolling(POLL_INITIAL_DELAY_MS);
            return;
          }
        });
    }
  }
});
</script>

<style lang="scss" scoped>
.el-card {
  min-height: 500px;
}
.order {
  padding-top: 50px;
  .price-block {
    display: inline-flex;
    flex-direction: column;
    gap: 4px;
  }
  .price-line {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
  }
  .price {
    font-size: 20px;
    font-weight: bold;
    &.original {
      font-size: 16px;
      font-weight: 500;
      color: var(--el-text-color-secondary);
      text-decoration: line-through;
    }
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
  .discount-tag {
    border-radius: 999px;
  }
  .discount-hint {
    margin: 0;
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }
}
.payways {
  display: flex;
  flex-wrap: wrap;
  @media only screen and (max-width: 1300px) {
    gap: 8px;
  }
  .payway {
    cursor: pointer;
    min-width: 150px;
    font-size: 13px;
    padding: 0 18px;
    height: 40px;
    border: 2px solid var(--el-border-color);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    line-height: 1;
    @media only screen and (max-width: 1300px) {
      border-radius: 10px;

      &.active {
        border: 2px solid var(--el-color-primary);
        border-radius: 10px;
      }
    }
    @media only screen and (min-width: 1301px) {
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
  }
  .payname {
    display: inline-block;
    font-size: 13px;
    font-weight: 500;
  }

  .payicon {
    width: 20px;
    height: 20px;
    display: inline-block;
    background-position: center;
    background-repeat: no-repeat;
    &.wechatpay {
      width: 22px;
      height: 22px;
      background-image: url(//midas.gtimg.cn/enterprise/images/ep_new_sprites@2x.png);
      background-size: 60px 250px;
      background-position: 0 -50px;
    }
    &.stripe {
      width: 22px;
      height: 22px;
      background-image: url(//cdn.acedata.cloud/2023-08-27-164440.png);
      background-size: contain;
    }
    &.alipay {
      width: 22px;
      height: 22px;
      background-image: url(//cdn.acedata.cloud/alipay.webp);
      background-size: contain;
    }
    &.x402 {
      width: 22px;
      height: 22px;
      background-image: url(https://cdn.acedata.cloud/mf6rzl.jpg);
      background-size: contain;
      border-radius: 4px;
    }
  }
}

.btn-pay {
  width: 150px;
}
</style>
