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
  disposed: boolean;
  purchaseController: AbortController | undefined;
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
      disposed: false,
      purchaseController: undefined,
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
          this.purchaseController?.abort();
          this.launched = false;
          if (this.refreshTimer) clearTimeout(this.refreshTimer);
          this.refreshTimer = undefined;
          return;
        }
        this.startPurchase();
      }
    }
  },
  unmounted() {
    this.disposed = true;
    this.purchaseController?.abort();
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }
  },
  methods: {
    async startPurchase() {
      if (this.launched || this.disposed || !this.visible) return;
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
      const orderId = this.modelValue.id;
      const controller = new AbortController();
      this.purchaseController = controller;
      const result = await purchaseAndVerify(orderId, this.productId, controller.signal);
      if (this.purchaseController === controller) this.purchaseController = undefined;
      if (this.disposed || !this.visible || this.modelValue.id !== orderId) return;
      if (result.verificationPending) {
        // Keep payment controls covered while confirming an already paid
        // receipt. The next attempt verifies the saved transaction only.
        this.statusText = this.$t('order.message.applePayProcessing');
        this.launched = false;
        if (this.visible) this.refreshTimer = window.setTimeout(() => this.startPurchase(), 5000);
        return;
      }
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
      if (!this.modelValue.id || this.disposed || !this.visible) {
        return;
      }
      const orderId = this.modelValue.id;
      orderOperator
        .refresh(orderId)
        .then(({ data }: { data: IOrderDetailResponse }) => {
          if (this.disposed || !this.visible || this.modelValue.id !== orderId) return;
          this.$emit('update:modelValue', data);
          if (data.state !== OrderState.PAID && data.state !== OrderState.FINISHED) {
            this.refreshTimer = window.setTimeout(() => this.onRefresh(), 2000);
          } else {
            this.$emit('hide');
          }
        })
        .catch(() => {
          if (this.disposed || !this.visible || this.modelValue.id !== orderId) return;
          this.refreshTimer = window.setTimeout(() => this.onRefresh(), 5000);
        });
    }
  }
});
</script>
