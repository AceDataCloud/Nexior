<template>
  <el-dialog
    :model-value="visible"
    :title="$t('application.title.buyService')"
    :width="dialogWidth"
    center
    @close="$emit('hide')"
  >
    <div v-if="isMobileOutsideWechat" class="wechat-pay-guide text-center py-[20px] px-[10px]">
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

    <div v-else-if="isMobileInsideWechat" class="wechat-pay-longpress text-center py-[20px] px-[10px]">
      <p class="text-[14px] mb-4 leading-relaxed">
        {{ $t('order.message.wechatPayLongPressTip') }}
      </p>
      <qr-code
        v-if="order?.pay_url"
        :value="order?.pay_url"
        :size="240"
        class="qrcode mx-auto"
        type="image/png"
        :color="{ dark: '#000000', light: '#ffffff' }"
      />
    </div>

    <el-row v-else class="paycodes py-[30px] w-[500px] mx-auto">
      <el-col :span="12">
        <div class="paycode wechat">
          <qr-code
            v-if="order?.pay_url"
            :value="order?.pay_url"
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
import { defineComponent } from 'vue';
import { ElDialog, ElRow, ElCol, ElButton, ElMessage } from 'element-plus';
import QrCode from 'vue-qrcode';
import copy from 'copy-to-clipboard';
import { IOrder } from '@/models';
import { isInWeChat, isMobileBrowser } from '@/utils/wechat';

interface IData {
  copied: boolean;
  copiedTimer: number | undefined;
}

export default defineComponent({
  name: 'PublicWechatPayDialog',
  components: {
    ElDialog,
    ElButton,
    QrCode,
    ElRow,
    ElCol
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
  data(): IData {
    return {
      copied: false,
      copiedTimer: undefined
    };
  },
  computed: {
    isMobileOutsideWechat(): boolean {
      return isMobileBrowser() && !isInWeChat();
    },
    isMobileInsideWechat(): boolean {
      return isMobileBrowser() && isInWeChat();
    },
    dialogWidth(): string {
      if (this.isMobileOutsideWechat || this.isMobileInsideWechat) {
        return '90%';
      }
      return '500px';
    }
  },
  unmounted() {
    if (this.copiedTimer) {
      clearTimeout(this.copiedTimer);
    }
  },
  methods: {
    async onCopyLink() {
      const url = typeof window !== 'undefined' ? window.location.href : '';
      if (!url) return;
      let ok = false;
      try {
        ok = await copy(url, { debug: false });
      } catch {
        ok = false;
      }
      if (ok) {
        this.copied = true;
        if (this.copiedTimer) clearTimeout(this.copiedTimer);
        this.copiedTimer = window.setTimeout(() => {
          this.copied = false;
        }, 2000);
      } else {
        ElMessage.error(String(this.$t('common.message.copyFailed') || 'Copy failed'));
      }
    }
  }
});
</script>
