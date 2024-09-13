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
          <el-card shadow="hover">
            <el-row v-show="false">
              <el-col class="text-center">
                <el-radio-group v-if="applicationId" v-model="type" size="large" class="mb-4" @change="onChangeType">
                  <el-radio-button label="Period">
                    {{ $t('application.type.period') }}
                  </el-radio-button>
                  <el-radio-button label="Usage">
                    {{ $t('application.type.usage') }}
                  </el-radio-button>
                </el-radio-group>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="16" :offset="4">
                <el-skeleton v-if="loading" />
                <el-form v-else-if="application" label-width="100px">
                  <el-form-item :label="$t('application.field.service')">
                    {{ application?.service?.title }}
                  </el-form-item>
                  <el-form-item :label="$t('application.field.package')" class="mb-0">
                    <el-radio-group v-if="packages" v-model="form.packageId">
                      <el-radio-button v-for="(pkg, pkgIndex) in packages" :key="pkgIndex" :label="pkg.id" class="mb-2">
                        <span v-show="pkgIndex !== 0" class="corner">
                          {{ getDiscount(pkg) }}
                        </span>
                        {{ pkg.amount }} {{ $t(`service.unit.${application?.service?.unit}s`) }}
                      </el-radio-button>
                    </el-radio-group>
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
                    <price :price="package?.price" />
                    <span v-if="package" class="ml-2"
                      >({{
                        getPriceString({ value: package?.price / package?.amount }) +
                        ' / ' +
                        $t(`service.unit.${application?.service?.unit}`)
                      }})
                    </span>
                  </el-form-item>
                  <el-divider border-style="dashed" />
                  <el-form-item :label="$t('application.field.shouldPayPrice')">
                    <span
                      v-if="package"
                      :class="{ price: true, unfree: package?.price > 0, free: package?.price === 0 }"
                    >
                      {{ getPriceString({ value: package?.price }) }}
                    </span>
                    <span v-else :class="{ price: true, free: true }"> $ 0 </span>
                  </el-form-item>
                  <el-form-item>
                    <el-button
                      type="primary"
                      size="large"
                      class="btn-create"
                      :loading="creating"
                      round
                      @click="onCreateOrder"
                    >
                      {{ $t('application.button.createOrder') }}
                    </el-button>
                  </el-form-item>
                  <el-divider border-style="dashed" />
                  <el-form-item label="">
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
  ElRadioGroup,
  ElRadioButton
} from 'element-plus';
import { ROUTE_CONSOLE_APPLICATION_SUBSCRIBE, ROUTE_CONSOLE_ORDER_DETAIL } from '@/router';
import Price from '@/components/common/Price.vue';
import { applicationOperator, orderOperator } from '@/operators';
import { getPriceString } from '@/utils';
import ServiceEstimation from '@/components/service/Estimation.vue';

interface IData {
  application: IApplication | undefined;
  loading: boolean;
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
    ElRadioGroup,
    ElRadioButton,
    Price,
    ServiceEstimation
  },
  data(): IData {
    return {
      lang: this.$i18n.locale,
      application: undefined,
      loading: false,
      type: 'Usage',
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
    price() {
      if (this.application?.service?.price && this.form.amount) {
        return this.form.amount * this.application.service?.price;
      }
      return 0;
    },
    packages() {
      return this.application?.service?.packages?.filter((pkg) => pkg.type === IPackageType.USAGE);
    },
    package() {
      if (this.packages && this.form.packageId) {
        const filterPackages = this.packages.filter((item) => item.id === this.form.packageId);
        if (filterPackages.length > 0) {
          return filterPackages[0];
        }
      }
      return undefined;
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
        });
    },
    onChangeType() {
      console.log('onChangeType', this.type);
      this.$router.push({
        name: ROUTE_CONSOLE_APPLICATION_SUBSCRIBE,
        params: this.$route.params
      });
    },
    onCreateOrder() {
      if (!this.application?.id) {
        return;
      }
      this.creating = true;
      const unit = this.$t(`service.unit.${this.application?.service?.unit}s`);
      orderOperator
        .create({
          application_id: this.application?.id,
          amount: this.package?.amount,
          ...(this.form.packageId !== 'custom' && this.package
            ? {
                package_id: this.package.id
              }
            : {}),
          description: `${this.application?.service?.title} x ${this.package?.amount} ${unit}`
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
        .catch(() => {
          ElMessage.error(this.$t('order.message.createFailed'));
          this.creating = false;
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

.el-form {
  .el-radio-group {
    .el-radio-button {
      position: relative;
      .corner {
        position: absolute;
        top: -13px;
        right: 0px;
        font-size: 12px;
        border: 1px solid #ff7200;
        color: #ff7200;
        background-color: #ffe8d5;
        border-radius: 3px;
        padding: 2px 5px;
        z-index: 1000;
      }
    }
  }
}

.panel {
  padding: 30px;
  width: calc(100% - 300px);
  background-color: var(--el-bg-color-page);

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
  }
}

.pagination {
  float: right;
}

@media (max-width: 767px) {
  .panel {
    width: 100%;
    height: 100%;
  }
}
</style>
