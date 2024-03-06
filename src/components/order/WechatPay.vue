<template>
  <el-dialog :model-value="visible" :title="$t('application.title.buyService')" width="500px" center>
    <el-row class="paycodes">
      <el-col :span="12">
        <div class="paycode wechat">
          <qr-code v-if="modelValue?.pay_url" :value="modelValue?.pay_url" :size="200" class="qrcode m-auto" />
          <p class="help-text">{{ $t('order.message.wechatPayHelp') }}</p>
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

<style lang="scss" scoped>
.paycodes {
  padding: 30px 0;
  width: 500px;
  margin: auto;
  .wechat {
    .qrcode {
      width: 200px;
      height: 200px;
    }
    .help-text {
      display: block;
      background-color: #00c800;
      color: white;
      font-size: 14px;
      height: 35px;
      width: 240px;
      text-align: center;
      line-height: 35px;
      margin: 10px auto 0 auto;
    }
  }
}
</style>
