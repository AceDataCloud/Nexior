<template>
  <el-dialog :model-value="visible" :title="$t('application.title.buyService')" :width="dialogWidth" center>
    <!-- State A: in WeChat with a JSAPI payload from backend -->
    <div v-if="jsapiPayload" class="wechat-pay-jsapi text-center py-[20px] px-[10px]">
      <p class="text-[14px] mb-4 leading-relaxed">
        {{ $t('order.message.wechatPayInWechatTip') }}
      </p>
      <el-button type="success" size="large" round class="w-[220px]" :loading="jsapiInvoking" @click="onInvokeJsapi">
        {{ $t('order.button.wechatPayNow') }}
      </el-button>
      <p v-if="jsapiError" class="text-[12px] text-red-500 mt-3 break-words">{{ jsapiError }}</p>
    </div>

    <!-- State B: mobile browser outside WeChat (H5 unavailable on our merchant) -->
    <div v-else-if="isMobileOutsideWechat" class="wechat-pay-guide text-center py-[20px] px-[10px]">
      <p class="text-[14px] mb-4 leading-relaxed">
        {{ $t('order.message.wechatPayMobileGuide') }}
      </p>
      <el-button type="success" size="large" round class="w-[220px]" @click="onCopyLink">
        {{ copied ? $t('common.message.copied') : $t('order.button.copyPayLink') }}
      </el-button>
      <p class="text-[12px] text-gray-500 mt-3 leading-relaxed">
        {{ $t('order.message.wechatPayMobileHint') }}
      </p>
    </div>

    <!-- State C: mobile inside WeChat — long-press the Native QR to recognise and pay. -->
    <!-- The same `weixin://wxpay/bizpayurl?pr=…` Native URL the desktop QR encodes also  -->
    <!-- works in mobile WeChat: long-press the image and the WeChat client opens the pay -->
    <!-- sheet directly. So we render the QR mobile-friendly (single column, no PC tutorial -->
    <!-- image) and tell the user to long-press. No JSAPI / openid required.               -->
    <div v-else-if="isMobileInsideWechat" class="wechat-pay-longpress text-center py-[20px] px-[10px]">
      <p class="text-[14px] mb-4 leading-relaxed">
        {{ $t('order.message.wechatPayLongPressTip') }}
      </p>
      <qr-code
        v-if="modelValue?.pay_url"
        :value="modelValue?.pay_url"
        :size="240"
        class="qrcode mx-auto"
        type="image/png"
        :color="{ dark: '#000000', light: '#ffffff' }"
      />
    </div>

    <!-- State D: PC / desktop — original QR code layout -->
    <el-row v-else class="paycodes py-[30px] w-[500px] mx-auto">
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
import { ElDialog, ElRow, ElCol, ElButton, ElMessage } from 'element-plus';
import QrCode from 'vue-qrcode';
import copy from 'copy-to-clipboard';
import { IOrder, IOrderDetailResponse, OrderState } from '@/models';
import { isInWeChat, isMobileBrowser, parseJsapiPayload, invokeWechatJsapi, IWechatJsapiPayload } from '@/utils/wechat';

interface IData {
  refreshTimer: number | undefined;
  copied: boolean;
  copiedTimer: number | undefined;
  jsapiInvoking: boolean;
  jsapiError: string;
}

export default defineComponent({
  name: 'PayOrderDialog',
  components: {
    ElDialog,
    ElButton,
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
      refreshTimer: undefined,
      copied: false,
      copiedTimer: undefined,
      jsapiInvoking: false,
      jsapiError: ''
    };
  },
  computed: {
    jsapiPayload(): IWechatJsapiPayload | null {
      return parseJsapiPayload(this.modelValue?.pay_url);
    },
    isMobileOutsideWechat(): boolean {
      return isMobileBrowser() && !isInWeChat();
    },
    isMobileInsideWechat(): boolean {
      return isMobileBrowser() && isInWeChat();
    },
    dialogWidth(): string {
      // Tighter dialog for any of the phone-sized views; keep 500px only for PC QR.
      if (this.jsapiPayload || this.isMobileOutsideWechat || this.isMobileInsideWechat) {
        return '90%';
      }
      return '500px';
    }
  },
  watch: {
    'modelValue.pay_url'() {
      // Reset transient state when the pay payload changes.
      this.jsapiError = '';
    },
    visible(value: boolean) {
      if (value && this.jsapiPayload) {
        // Auto-trigger the JSAPI bridge when the dialog opens with a payload.
        this.onInvokeJsapi();
      }
    }
  },
  mounted() {
    this.onRefresh();
    if (this.visible && this.jsapiPayload) {
      this.onInvokeJsapi();
    }
  },
  unmounted() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }
    if (this.copiedTimer) {
      clearTimeout(this.copiedTimer);
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
            this.refreshTimer = window.setTimeout(() => {
              this.onRefresh();
            }, 2000);
          } else {
            // paid, just notify parent, and hide the dialog
            this.$emit('hide');
          }
          this.$emit('update:modelValue', data);
        })
        .catch(() => {
          this.refreshTimer = window.setTimeout(() => {
            this.onRefresh();
          }, 2000);
        });
    },
    async onCopyLink() {
      const url = typeof window !== 'undefined' ? window.location.href : '';
      if (!url) {
        return;
      }
      let ok = false;
      try {
        // copy-to-clipboard v4 returns Promise<boolean>; v3 returned boolean.
        // `await` works for both so this stays robust across versions.
        ok = await copy(url, { debug: false });
      } catch {
        ok = false;
      }
      if (ok) {
        this.copied = true;
        if (this.copiedTimer) {
          clearTimeout(this.copiedTimer);
        }
        this.copiedTimer = window.setTimeout(() => {
          this.copied = false;
        }, 2000);
      } else {
        ElMessage.error(String(this.$t('common.message.copyFailed') || 'Copy failed'));
      }
    },
    async onInvokeJsapi() {
      const payload = this.jsapiPayload;
      if (!payload || this.jsapiInvoking) {
        return;
      }
      this.jsapiInvoking = true;
      this.jsapiError = '';
      try {
        const result = await invokeWechatJsapi(payload);
        if (result === 'ok') {
          // Backend webhook will flip the order to PAID; the refresh poller
          // will detect it and close the dialog.
          ElMessage.success(String(this.$t('order.message.paidSuccessfully')));
        } else if (result === 'cancel') {
          this.jsapiError = String(this.$t('order.message.wechatPayCancelled'));
        } else {
          this.jsapiError = String(this.$t('order.message.wechatPayFailed'));
        }
      } catch (err) {
        this.jsapiError = String(this.$t('order.message.wechatPayBridgeUnavailable'));
      } finally {
        this.jsapiInvoking = false;
      }
    }
  }
});
</script>
