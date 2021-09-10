<template>
  <el-row>
    <el-col :span="6" :offset="9">
      <el-card shadow="hover" class="panel">
        <h2 class="title mt-5">{{ $t('auth.title.wechatLogin') }}</h2>
        <div class="pt-7 pb-10" v-loading="!qrLink">
          <qr-code :value="qrLink" :size="200" class="m-auto" v-if="qrLink" />
        </div>
      </el-card>
    </el-col>
  </el-row>
</template>
<script lang="ts">
import { defineComponent } from 'vue';
import QrCode from 'qrcode.vue';
import WechatService from '@/services/common/wechat/service';
import UserService from '@/services/common/user/service';
import { IWechatQRCode, IWechatQRCodeResponse, IWechatLoginStatusResponse } from '@/services/common/wechat/types';
import { IUserDetailResponse, IUser } from '@/services/common/user/types';

interface IData {
  qrLink: string | undefined;
  ticket: string | undefined;
}

export default defineComponent({
  name: 'Login',
  components: {
    QrCode
  },
  data(): IData {
    return {
      qrLink: undefined,
      ticket: undefined
    };
  },
  mounted() {
    this.initQRCode();
  },
  watch: {
    ticket(val) {
      if (val) {
        this.detectLoginStatus();
      }
    }
  },
  methods: {
    initQRCode() {
      WechatService.createQRCode4Login().then(({ data }: { data: IWechatQRCodeResponse }) => {
        this.qrLink = data.url;
        this.ticket = data.ticket;
      });
    },
    getUserInfo(id: string) {
      UserService.get(id).then(async ({ data }: { data: IUserDetailResponse }) => {
        await this.$store.dispatch('setUser', data as IUser);
        this.$router.push({
          path: this.$route.query.redirect ? this.$route.query.redirect.toString() : '/'
        });
      });
    },
    detectLoginStatus() {
      if (!this.ticket) {
        return;
      }
      // return;
      WechatService.getLoginStatus(this.ticket)
        .then(
          async ({
            data: {
              access_token,
              refresh_token,
              user: { id }
            }
          }: {
            data: IWechatLoginStatusResponse;
          }) => {
            await this.$store.dispatch('setRefreshToken', refresh_token);
            await this.$store.dispatch('setAccessToken', access_token);
            this.getUserInfo(id);
          }
        )
        .catch((error) => {
          setTimeout(() => {
            this.detectLoginStatus();
          }, 2000);
        });
    }
  }
});
</script>

<style lang="scss" scoped>
.panel {
  .title {
    text-align: center;
    font-size: 22px;
  }
}
</style>
