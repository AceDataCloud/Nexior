<template>
  <el-form label-width="100px">
    <el-form-item :label="$t('application.field.service')">
      <span v-if="application.type === applicationType.API">
        {{ application?.service?.title }}
      </span>
    </el-form-item>
    <el-form-item :label="$t('application.field.package')">
      <el-radio-group v-if="application.type === applicationType.API" v-model="form.packageId">
        <el-radio-button v-for="(pkg, pkgIndex) in application?.service?.packages" :key="pkgIndex" :label="pkg.id">
          {{ pkg.amount }}{{ $t(`api.unit.${application?.service?.unit}`) }}
        </el-radio-button>
        <el-radio-button label="custom">
          {{ $t('application.button.custom') }}
        </el-radio-button>
      </el-radio-group>
    </el-form-item>
    <el-form-item v-if="form.packageId === 'custom'" :label="$t('application.field.amount')">
      <el-input-number v-model="form.amount" :min="1" :max="10000" controls-position="right" />
    </el-form-item>
    <el-form-item :label="$t('application.field.price')">
      <div v-if="application.type === applicationType.API">
        <price
          v-if="form.packageId === 'custom'"
          :price="application?.service?.price"
          :unit="$t(`api.unit.${application?.service?.unit}`)"
        />
        <price v-else :price="package?.price" />
      </div>
    </el-form-item>
    <el-divider border-style="dashed" />
    <el-form-item :label="$t('application.field.shouldPayPrice')">
      <span v-if="form.packageId === 'custom'" :class="{ price: true, unfree: price > 0, free: price === 0 }">
        ¥{{ price.toFixed(2) }}
      </span>
      <span v-else-if="package" :class="{ price: true, unfree: package?.price > 0, free: package?.price === 0 }">
        ¥{{ package?.price?.toFixed(2) }}
      </span>
    </el-form-item>
    <el-form-item>
      <el-button type="primary" round size="large" class="btn-create" :loading="creating" @click="onCreateOrder">
        {{ $t('application.button.createOrder') }}
      </el-button>
    </el-form-item>
  </el-form>
</template>

<script lang="ts">
import { IApplication, IApplicationType, IOrderDetailResponse, IPackage } from '@/models';
import { defineComponent } from 'vue';
import { ElMessage } from 'element-plus';
import { ROUTE_CONSOLE_ORDER_DETAIL } from '@/router';
import { ElForm, ElFormItem, ElButton, ElInputNumber, ElDivider, ElRadioGroup, ElRadioButton } from 'element-plus';
import Price from '@/components/common/Price.vue';

interface IData {
  form: {
    amount: number;
    packageId: string | undefined;
  };
  creating: boolean;
  applicationType: typeof IApplicationType;
}

export default defineComponent({
  name: 'CreateOrderDialog',
  components: {
    ElForm,
    ElFormItem,
    ElInputNumber,
    ElButton,
    ElDivider,
    ElRadioGroup,
    ElRadioButton,
    Price
  },
  props: {
    application: {
      type: Object as () => IApplication,
      required: true
    }
  },
  data(): IData {
    return {
      form: {
        amount: 1000,
        packageId: undefined
      },
      creating: false,
      applicationType: IApplicationType
    };
  },
  computed: {
    price() {
      return 0;
    },
    package() {
      if (this.application?.type === IApplicationType.API) {
        if (this.application.service?.packages && this.form.packageId) {
          const filterPackages = this.application.service?.packages.filter((item) => item.id === this.form.packageId);
          if (filterPackages.length > 0) {
            return filterPackages[0];
          }
        }
      }
      return undefined;
    }
  },
  mounted() {
    this.onInit();
  },
  methods: {
    onInit() {
      if (this.application.type === IApplicationType.API) {
        if (this.application?.api?.packages && this.application?.api?.packages.length > 0) {
          this.form.packageId = this.application?.api?.packages[0].id;
        } else {
          this.form.packageId = 'custom';
        }
      }
    },
    onChangePackage(pkg: IPackage) {
      console.log('pkg', pkg);
    },
    onCreateOrder() {
      if (!this.application?.id) {
        return;
      }
      this.creating = true;
      orderOperator
        .create({
          application_id: this.application?.id,
          amount: this.form.amount,
          ...(this.form.packageId !== 'custom' && this.package
            ? {
                package_id: this.package.id
              }
            : {})
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

.btn-create {
  width: 150px;
  border-radius: 20px;
}
</style>
