<template>
  <el-dialog
    :model-value="visible"
    :title="$t('application.title.buyService')"
    width="500px"
    center
    @close="$emit('hide')"
  >
    <p class="text-center">
      {{ $t('order.message.buyInExternalUrl') }}
    </p>
  </el-dialog>
</template>

<script lang="ts">
import { IOrder } from '@/models';
import { defineComponent } from 'vue';
import { ElDialog } from 'element-plus';

export default defineComponent({
  name: 'PublicStripePayDialog',
  components: {
    ElDialog
  },
  props: {
    order: {
      type: Object as () => IOrder,
      required: true
    },
    visible: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  emits: ['hide'],
  watch: {
    visible: {
      handler(val) {
        if (val && this.order?.pay_url) {
          window.open(this.order.pay_url, '_blank');
        }
      }
    }
  }
});
</script>
