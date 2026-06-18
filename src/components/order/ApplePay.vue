<template>
  <el-dialog :model-value="visible" :title="$t('application.title.buyService')" width="500px" center>
    <p class="text-center">
      {{ statusText }}
    </p>
  </el-dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElDialog, ElMessage } from 'element-plus';
import { orderOperator } from '@/operators';
import { IOrder, IOrderDetailResponse, OrderState } from '@/models';
import { purchaseAndVerify } from '@/utils';

interface IData {
  refreshTimer: number | undefined;
  launched: boolean;
  statusText: string;
}

export default defineComponent({
  name: 'ApplePayOrderDialog',
  components: {
    ElDialog
  },
  props: {
    modelValue: {
      type: Object as () => IOrder,
      required: true
    },
    visible: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  emits: ['hide', 'update:modelValue'],
  data(): IData {
    return {
      refreshTimer: undefined,
      launched: false,
      statusText: this.$t('order.message.applePayProcessing')
    };
  },
  computed: {
    // Apple consumable product id mapped to the order's package via
    // package.metadata.apple_product_id (embedded by the backend).
    productId(): string | undefined {
      return (
        (this.modelValue?.package?.metadata?.apple_product_id as string | undefined) ||
        (this.modelValue?.packages?.[0]?.metadata?.apple_product_id as string | undefined)
      );
    }
  },
  watch: {
    visible: {
      handler(val) {
        if (!val) {
          this.launched = false;
          return;
        }
        this.startPurchase();
      }
    }
  },
  unmounted() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }
  },
  methods: {
    async startPurchase() {
      if (this.launched) return;
      this.launched = true;
      if (!this.modelValue.id) {
        return;
      }
      if (!this.productId) {
        ElMessage.error(this.$t('order.message.applePayUnavailable'));
        this.$emit('hide');
        return;
      }
      this.statusText = this.$t('order.message.applePayProcessing');
      const result = await purchaseAndVerify(this.modelValue.id, this.productId);
      if (result.cancelled) {
        this.$emit('hide');
        return;
      }
      if (!result.ok) {
        // Surface the specific reason (product_not_found / iap_unavailable /
        // verify_failed …) to aid diagnosis during rollout.
        const reason = result.error ? ` (${result.error})` : '';
        ElMessage.error(this.$t('order.message.applePayFailed') + reason);
        this.$emit('hide');
        return;
      }
      // Verified server-side; poll once to pick up the FINISHED state + balance.
      this.onRefresh();
    },
    onRefresh() {
      if (!this.modelValue.id) {
        return;
      }
      orderOperator
        .refresh(this.modelValue.id)
        .then(({ data }: { data: IOrderDetailResponse }) => {
          this.$emit('update:modelValue', data);
          if (data.state !== OrderState.PAID && data.state !== OrderState.FINISHED) {
            this.refreshTimer = window.setTimeout(() => this.onRefresh(), 2000);
          } else {
            this.$emit('hide');
          }
        })
        .catch(() => {
          this.refreshTimer = window.setTimeout(() => this.onRefresh(), 5000);
        });
    }
  }
});
</script>
