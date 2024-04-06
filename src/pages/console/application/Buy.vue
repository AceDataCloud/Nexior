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
            <el-row>
              <el-col :span="12" :offset="6">
                <el-skeleton v-if="loading" />
                <el-form v-else-if="application" label-width="100px">
                  <el-form-item :label="$t('application.field.service')">
                    {{ application?.service?.title }}
                  </el-form-item>
                  <el-form-item :label="$t('application.field.package')">
                    <el-radio-group v-if="application?.service?.packages" v-model="form.packageId">
                      <el-radio-button
                        v-for="(pkg, pkgIndex) in application?.service.packages"
                        :key="pkgIndex"
                        :label="pkg.id"
                      >
                        {{ pkg.amount }} {{ $t(`service.unit.${application?.service?.unit}s`) }}
                      </el-radio-button>
                    </el-radio-group>
                  </el-form-item>
                  <el-form-item :label="$t('service.field.price')">
                    <price :price="package?.price" />
                  </el-form-item>
                  <el-divider border-style="dashed" />
                  <el-form-item :label="$t('application.field.shouldPayPrice')">
                    <span
                      v-if="package"
                      :class="{ price: true, unfree: package?.price > 0, free: package?.price === 0 }"
                    >
                      ${{ package?.price?.toFixed(2) }}
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
import { IApplication, IApplicationDetailResponse, IOrderDetailResponse } from '@/models';
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
import { ROUTE_CONSOLE_ORDER_DETAIL } from '@/router';
import Price from '@/components/common/Price.vue';
import { applicationOperator, orderOperator } from '@/operators';

interface IData {
  application: IApplication | undefined;
  loading: boolean;
  form: {
    amount: number;
    packageId: string | undefined;
  };
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
    Price
  },
  data(): IData {
    return {
      application: undefined,
      loading: false,
      form: {
        packageId: undefined
      },
      creating: false
    };
  },
  computed: {
    id() {
      return this.$route.params?.id?.toString();
    },
    price() {
      if (this.application?.service?.price && this.form.amount) {
        return this.form.amount * this.application.service?.price;
      }
      return 0;
    },
    package() {
      if (this.application?.service?.packages && this.form.packageId) {
        const filterPackages = this.application.service?.packages.filter((item) => item.id === this.form.packageId);
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
    onFetchApplication() {
      this.loading = true;
      applicationOperator
        .get(this.id)
        .then(({ data: data }: { data: IApplicationDetailResponse }) => {
          this.application = data;
          this.loading = false;
          // by default select first packageId
          this.form.packageId = this.application?.service?.packages?.[0]?.id;
        })
        .catch(() => {
          this.loading = false;
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
</style>
