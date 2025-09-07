<template>
  <el-dialog :model-value="visible" :title="$t('application.title.buyService')" width="500px" center>
    <el-row class="paycodes py-[30px] w-[500px] mx-auto">
      <el-col :span="12">
        <div class="paycode wechat">
          <qr-code
            v-if="modelValue?.pay_url"
            :value="modelValue?.pay_url"
            :size="200"
            class="qrcode m-auto w-[200px] h-[200px]"
            type="image/png"
            :color="{ dark: '#000000', light: '#ffffff' }"
          />
          <p
            class="help-text block bg-[#00c800] text-white text-[14px] h-[35px] w-[240px] text-center leading-[35px] mt-[10px] mx-auto"
          >
            {{ $t('order.message.wechatPayHelp') }}
          </p>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="help-img">
          <img src="https://midas.gtimg.cn/enterprise/images/ep_sys_wx_tip.jpg" />
        </div>
      </el-col>
    </el-row>
  </el-dialog>
</template>

<script lang="ts">
import { orderOperator } from '@/operators';
import { defineComponent } from 'vue';
import { ElDialog, ElRow, ElCol } from 'element-plus';
import QrCode from 'vue-qrcode';
import { IOrder, IOrderDetailResponse, OrderState } from '@/models';

interface IData {
  refreshTimer: number | undefined;
}

export default defineComponent({
  name: 'PayOrderDialog',
  components: {
    ElDialog,
    QrCode,
    ElRow,
    ElCol
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
      refreshTimer: undefined
    };
  },
  mounted() {
    this.onRefresh();
  },
  unmounted() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }
  },
  methods: {
    onRefresh() {
      if (!this.modelValue.id) {
        console.error('id does not exist');
        return;
      }
      orderOperator
        .refresh(this.modelValue.id)
        .then(({ data: data }: { data: IOrderDetailResponse }) => {
          // if not paid, check for next loop
          if (data.state !== OrderState.PAID) {
            setTimeout(() => {
              this.onRefresh();
            }, 2000);
          } else {
            // paid, just notify parent, and hide the dialog
            this.$emit('hide');
          }
          this.$emit('update:modelValue', data);
        })
        .catch(() => {
          setTimeout(() => {
            this.onRefresh();
          }, 2000);
        });
    }
  }
});
</script>
