<template>
  <el-dialog :model-value="visible" :title="$t('application.title.buyService')" width="60%" center>
    <el-form label-width="120px">
      <el-form-item v-if="application?.api?.title" :label="$t('application.field.service')">
        {{ application?.api?.title }}
      </el-form-item>
      <el-form-item :label="$t('application.field.amount')">
        <el-input-number v-model="form.amount" :min="1" :max="10000" controls-position="right" />
      </el-form-item>
      <el-form-item :label="$t('service.field.price')">
        <service-price :price="application?.api?.price" />
      </el-form-item>
      <el-divider />
      <el-form-item :label="$t('application.field.shouldPayPrice')">
        <span :class="{ price: true, unfree: price > 0 }">¥{{ price.toFixed(2) }}</span>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="$emit('hide')">{{ $t('common.button.cancel') }}</el-button>
        <el-button type="primary" :loading="creating" @click="onCreateOrder">
          {{ $t('application.button.createOrder') }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script lang="ts">
import { IApplication, IOrderDetailResponse, orderOperator } from '@/operators';
import { defineComponent } from 'vue';
import { ElMessage } from 'element-plus';
import { ROUTE_CONSOLE_ORDER_DETAIL } from '@/router';
import { ElDialog, ElForm, ElFormItem, ElButton, ElInputNumber, ElDivider } from 'element-plus';
import ServicePrice from '@/components/service/Price.vue';

export default defineComponent({
  name: 'CreateOrderDialog',
  components: {
    ElDialog,
    ElForm,
    ElFormItem,
    ElButton,
    ElInputNumber,
    ElDivider,
    ServicePrice
  },
  props: {
    application: {
      type: Object as () => IApplication,
      required: true
    },
    visible: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  emits: ['hide'],
  data() {
    return {
      form: {
        amount: 1000
      },
      creating: false
    };
  },
  computed: {
    price() {
      if (this.application.api?.price && this.form.amount) {
        return this.form.amount * this.application.api?.price;
      }
      return 0;
    }
  },
  methods: {
    onCreateOrder() {
      if (!this.application?.id) {
        return;
      }
      this.creating = true;
      orderOperator
        .create({
          application_id: this.application?.id,
          amount: this.form.amount
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
  .unfree {
    color: #ff5441;
  }
}
</style>
