<template>
  <el-row class="panel">
    <el-col :span="24">
      <el-row>
        <el-col :span="24">
          <h2 class="title">{{ $t('common.title.buyMore') }}</h2>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-card shadow="hover" class="min-h-[500px]">
            <el-row>
              <el-col :xs="{ span: 22, offset: 1 }" :sm="{ span: 20, offset: 2 }" :md="{ span: 16, offset: 4 }">
                <el-skeleton v-if="loading" />
                <div v-else-if="loadFailed" class="text-center">
                  <el-empty :description="$t('common.message.noData')" />
                  <el-button type="primary" round @click="onFetchApplication">
                    {{ $t('common.button.refresh') }}
                  </el-button>
                </div>
                <el-empty v-else-if="!showPayment" :description="$t('common.message.noData')" />
                <el-form v-else-if="application" class="purchase-form" label-width="100px">
                  <div v-if="!application?.service">
                    <p class="text-[var(--el-text-color-secondary)] text-[12px] mb-3">
                      {{ $t('application.message.globalBalanceBuyDescription') }}
                    </p>
                    <el-divider border-style="dashed" />
                  </div>
                  <el-form-item v-if="application?.service" :label="$t('application.field.service')">
                    {{ application?.service?.title }}
                  </el-form-item>
                  <el-form-item v-else :label="$t('application.field.scope')">
                    {{ $t('application.title.globalBuy') }}
                  </el-form-item>
                  <el-form-item :label="$t('application.field.package')" class="mb-0">
                    <el-radio-group v-if="packages.length > 0" v-model="form.packageId" class="package-options">
                      <el-radio-button v-for="(pkg, pkgIndex) in packages" :key="pkgIndex" :label="pkg.id" class="mb-2">
                        <span v-show="pkgIndex !== 0" class="corner">
                          {{ getDiscount(pkg) }}
                        </span>
                        {{ pkg.amount }} {{ $t(`service.unit.${application?.service?.unit || 'credit'}s`) }}
                      </el-radio-button>
                    </el-radio-group>
                    <el-empty v-else :description="$t('common.message.noData')" :image-size="48" />
                  </el-form-item>
                  <el-form-item
                    v-if="
                      application?.service?.apis &&
                      application?.service?.apis?.map((api) => api?.estimation).filter((x) => !!x)?.length > 0
                    "
                  >
                    <service-estimation v-if="application?.service" :service="application.service" :package="package" />
                  </el-form-item>
                  <el-form-item :label="$t('service.field.price')">
                    <template v-if="package && pricingAvailable">
                      <price :price="displayPackagePrice" />
                      <span v-if="package" class="ml-2"
                        >({{
                          getPriceString({ value: displayUnitPrice }) +
                          ' / ' +
                          $t(`service.unit.${application?.service?.unit || 'credits'}`)
                        }})
                      </span>
                    </template>
                    <span v-else class="text-[var(--el-text-color-secondary)]">{{ $t('common.message.noData') }}</span>
                  </el-form-item>
                  <el-divider border-style="dashed" />
                  <el-form-item :label="$t('application.field.shouldPayPrice')">
                    <div v-if="displayFinalPrice !== undefined" class="final-price-block">
                      <div class="final-price-line">
                        <span :class="{ price: true, unfree: displayFinalPrice > 0, free: displayFinalPrice === 0 }">
                          {{ getPriceString({ value: displayFinalPrice }) }}
                        </span>
                        <el-tag v-if="hasOrderDiscount" class="discount-tag" effect="light" size="small" type="success">
                          {{ $t('order.message.discountTag', { percent: discountPercent }) }}
                        </el-tag>
                      </div>
                      <p v-if="hasOrderDiscount" class="discount-hint">
                        {{ $t('order.message.discountHint', { percent: discountPercent }) }}
                      </p>
                    </div>
                    <span v-else class="text-[var(--el-text-color-secondary)]">{{ $t('common.message.noData') }}</span>
                  </el-form-item>
                  <el-form-item>
                    <el-button
                      v-if="showPayment"
                      type="primary"
                      size="large"
                      class="btn-create"
                      :loading="creating"
                      :disabled="!pricingAvailable || !package"
                      round
                      @click="onCreateOrder"
                    >
                      {{ $t('application.button.createOrder') }}
                    </el-button>
                  </el-form-item>
                  <el-divider border-style="dashed" />
                  <el-form-item v-show="false" label="">
                    <span>{{ $t('console.message.doNotWantExtra') }}</span>
                    <el-button type="primary" class="btn btn-subscribe" round size="small" @click="onSubscribe">
                      {{ $t('console.message.subscribe') }}
                    </el-button>
                  </el-form-item>
                </el-form>
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
import { IApplication, IApplicationDetailResponse, IOrderDetailResponse, IPackageType } from '@/models';
import {
  ElRow,
  ElCol,
  ElCard,
  ElSkeleton,
  ElMessage,
  ElForm,
  ElFormItem,
  ElButton,
  ElDivider,
  ElEmpty,
  ElRadioGroup,
  ElRadioButton,
  ElTag
} from 'element-plus';
import { ROUTE_CONSOLE_APPLICATION_SUBSCRIBE, ROUTE_CONSOLE_ORDER_DETAIL } from '@/router';
import Price from '@/components/common/Price.vue';
import { applicationOperator, orderOperator } from '@/operators';
import { getPriceString, applyMarkup, getApplicationMarkupRatio, getApplicationCallerOrderDiscountRate } from '@/utils';
import { isIOS } from '@/utils';
import { track } from '@/plugins/telemetry';
import ServiceEstimation from '@/components/service/Estimation.vue';

interface IData {
  application: IApplication | undefined;
  loading: boolean;
  loadFailed: boolean;
  form: {
    amount: number | undefined;
    packageId: string | undefined;
  };
  type: string;
  lang: string;
  creating: boolean;
}

export default defineComponent({
  name: 'ConsoleApplicationBuy',
  components: {
    ElSkeleton,
    ElRow,
    ElCol,
    ElCard,
    ElForm,
    ElFormItem,
    ElButton,
    ElDivider,
    ElEmpty,
    ElRadioGroup,
    ElRadioButton,
    ElTag,
    Price,
    ServiceEstimation
  },
  data(): IData {
    return {
      lang: this.$i18n.locale,
      application: undefined,
      loading: false,
      loadFailed: false,
      type: IPackageType.USAGE,
      form: {
        packageId: undefined,
        amount: undefined
      },
      creating: false
    };
  },
  computed: {
    applicationId() {
      return this.$route.params?.id?.toString();
    },
    id() {
      return this.$route.params?.id?.toString();
    },
    // Credits are buyable on every surface now. On iOS the order is paid via
    // Apple IAP on the order-detail page; we only offer packages that have an
    // Apple product id mapped (see `packages`).
    showPayment(): boolean {
      return true;
    },
    price() {
      if (this.application?.service?.price && this.form.amount) {
        return this.form.amount * this.application.service?.price;
      }
      return 0;
    },
    packages() {
      const all =
        this.application?.packages
          ?.filter((pkg) => pkg.type === IPackageType.USAGE)
          .sort((a, b) => a.amount - b.amount) || [];
      // On iOS only packages with an Apple product id can be purchased via IAP.
      if (isIOS()) {
        return all.filter((pkg) => !!pkg?.metadata?.apple_product_id);
      }
      return all;
    },
    package() {
      if (this.packages && this.form.packageId) {
        const filterPackages = this.packages.filter((item) => item.id === this.form.packageId);
        if (filterPackages.length > 0) {
          return filterPackages[0];
        }
      }
      return undefined;
    },
    site() {
      return this.$store.getters.site;
    },
    markupRatio(): number | undefined {
      return getApplicationMarkupRatio(this.application, this.site);
    },
    orderDiscountRate(): number | undefined {
      if (isIOS()) return 0;
      return getApplicationCallerOrderDiscountRate(this.application);
    },
    pricingAvailable(): boolean {
      return this.markupRatio !== undefined && this.orderDiscountRate !== undefined;
    },
    // Backend-resolved markup keeps this preview aligned with order billing
    // when a service overrides the site-wide default.
    displayPackagePrice(): number | undefined {
      return this.package && this.markupRatio !== undefined
        ? applyMarkup(this.package.price, this.markupRatio)
        : undefined;
    },
    displayUnitPrice(): number | undefined {
      return this.package && this.markupRatio !== undefined
        ? applyMarkup(this.package.price, this.markupRatio) / this.package.amount
        : undefined;
    },
    displayFinalPrice(): number | undefined {
      if (this.displayPackagePrice === undefined || this.orderDiscountRate === undefined) {
        return undefined;
      }
      return this.displayPackagePrice * (1 - this.orderDiscountRate);
    },
    hasOrderDiscount(): boolean {
      return (this.orderDiscountRate ?? 0) > 0;
    },
    discountPercent(): string {
      const percent = (this.orderDiscountRate ?? 0) * 100;
      return Number.isInteger(percent) ? percent.toFixed(0) : percent.toFixed(1);
    }
  },
  mounted() {
    this.onFetchApplication();
  },
  methods: {
    getDiscount(pkg: any) {
      if (this.packages && this.packages.length > 0) {
        if (this.lang?.startsWith('zh')) {
          return (
            // @ts-ignore
            ((10 * pkg?.price) / pkg?.amount / (this.packages[0].price / this.packages[0]?.amount))?.toFixed(1) + '折'
          );
        } else {
          return (
            Math.round(100 - (100 * pkg?.price) / pkg?.amount / (this.packages[0].price / this.packages[0]?.amount)) +
            '% OFF'
          );
        }
      }
      return '';
    },
    onSubscribe() {
      this.$router.push({
        name: ROUTE_CONSOLE_APPLICATION_SUBSCRIBE,
        params: this.$route.params
      });
    },
    getPriceString,
    onFetchApplication() {
      this.loading = true;
      this.loadFailed = false;
      applicationOperator
        .get(this.id)
        .then(({ data: data }: { data: IApplicationDetailResponse }) => {
          this.application = data;
          this.loading = false;
          // by default select first packageId
          this.form.packageId = this.packages?.[0]?.id;
        })
        .catch(() => {
          this.loading = false;
          this.loadFailed = true;
        });
    },
    onChangeType() {
      this.$router.push({
        name: ROUTE_CONSOLE_APPLICATION_SUBSCRIBE,
        params: this.$route.params
      });
    },
    onCreateOrder() {
      if (!this.application?.id || !this.pricingAvailable || !this.package) {
        return;
      }
      this.creating = true;
      const unit = this.$t(`service.unit.${this.application?.service?.unit}s`);
      track('payment_initiated', {
        service: this.application?.service?.alias,
        amount: this.package?.amount,
        package_id: this.package?.id,
        action: 'extra'
      });
      orderOperator
        .create({
          application_id: this.application?.id,
          amount: this.package?.amount,
          ...(this.form.packageId !== 'custom' && this.package
            ? {
                package_id: this.package.id
              }
            : {}),
          description: this.application?.service
            ? `${this.application?.service?.title} x ${this.package?.amount} ${unit}`
            : this.$t('application.title.globalBuy') +
              ' - ' +
              this.package?.amount +
              ' ' +
              this.$t('service.unit.credits')
        })
        .then(({ data: data }: { data: IOrderDetailResponse }) => {
          this.creating = false;
          const order = data;
          this.$router.push({
            name: ROUTE_CONSOLE_ORDER_DETAIL,
            params: {
              id: order.id
            }
          });
        })
        .catch((error) => {
          ElMessage.error(this.$t('order.message.createFailed'));
          this.creating = false;
          track('payment_failed', {
            service: this.application?.service?.alias,
            action: 'extra',
            error: error?.response?.data?.error?.message ?? String(error)
          });
        });
    }
  }
});
</script>

<style lang="scss" scoped>
.el-form {
  .el-radio-group {
    .el-radio-button {
      position: relative;
      .corner {
        position: absolute;
        top: -13px;
        right: 0px;
        font-size: 12px;
        border: 1px solid var(--app-badge-border);
        color: #ff7200;
        background-color: var(--app-badge-bg);
        border-radius: 3px;
        padding: 2px 5px;
        z-index: 1000;
      }
    }
  }
}

.panel {
  .el-card {
    padding: 50px 0;
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
    .final-price-block {
      display: inline-flex;
      flex-direction: column;
      gap: 4px;
    }
    .final-price-line {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
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
}

@media only screen and (max-width: 767px) {
  .panel {
    .el-card {
      padding: 16px 12px;
    }
  }

  :deep(.purchase-form .el-form-item) {
    display: block;
    margin-bottom: 10px;
  }

  :deep(.purchase-form .el-form-item__label) {
    width: auto !important;
    height: auto;
    margin-bottom: 8px;
    line-height: 1.4;
    text-align: left;
  }

  :deep(.purchase-form .el-form-item__content) {
    margin-left: 0 !important;
  }

  .package-options {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px 8px;
    width: 100%;
    padding-top: 4px;
  }

  :deep(.package-options .el-radio-button) {
    width: 100%;
    margin-bottom: 0 !important;
  }

  :deep(.package-options .el-radio-button__inner) {
    width: 100%;
    padding: 8px 6px;
    border: 1px solid var(--el-border-color);
    border-radius: 4px;
    box-shadow: none;
  }

  .final-price-block {
    width: 100%;
  }

  .package-options .corner {
    top: -8px;
    right: 4px;
    padding: 0 3px;
    font-size: 10px;
    line-height: 16px;
  }

  .btn-create {
    width: 100%;
  }
}
</style>
