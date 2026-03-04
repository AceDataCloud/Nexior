<template>
  <div v-if="isNative" class="auth-native">
    <iframe class="auth-native__iframe" :src="iframeUrl" frameborder="0" />
  </div>
  <el-dialog
    v-else
    :model-value="!authenticated"
    modal-class="dialog"
    width="400px"
    :show-close="false"
    :close-on-press-escape="false"
    :close-on-click-modal="false"
  >
    <iframe width="360" height="560" :src="iframeUrl" frameborder="0" />
  </el-dialog>
  <el-dialog v-model="showQR" width="400px" :show-close="true">
    <qr-code
      v-if="qrLink"
      :value="qrLink"
      :width="230"
      :height="230"
      class="qrcode w-[320px] h-[320px] block mx-auto mb-[20px]"
      :type="'image/jpeg'"
      :color="{ dark: '#000000ff', light: '#ffffffff' }"
    />
  </el-dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElDialog } from 'element-plus';
import { getBaseUrlAuth } from '@/utils';
import { getCookie } from 'typescript-cookie';
import QrCode from 'vue-qrcode';
import { ROUTE_SITE_INDEX } from '@/router';

export default defineComponent({
  name: 'AuthPanel',
  components: {
    ElDialog,
    QrCode
  },
  data() {
    return {
      showQR: false,
      qrLink: ''
    };
  },
  computed: {
    isNative() {
      return import.meta.env.VITE_SURFACE === 'ios' || import.meta.env.VITE_SURFACE === 'android';
    },
    iframeUrl() {
      return `${getBaseUrlAuth()}/auth/login?inviter_id=${this.inviterId}`;
    },
    inviterId() {
      // if forceInviterId is set, then use forceInviterId
      if (this.$store?.state?.site?.distribution?.force_inviter_id) {
        return this.$store?.state?.site?.distribution?.force_inviter_id;
      }
      // Otherwise, use the inviter_id in the url, then use the inviter_id in the cookie, and finally use the default inviter_id
      const result =
        this.$route.query.inviter_id?.toString() ||
        getCookie('INVITER_ID') ||
        this.$store?.state?.site?.distribution?.default_inviter_id;
      return result;
    },
    authenticated() {
      return !!this.$store.state.token.access;
    }
  },
  mounted() {
    window.addEventListener('message', async (event: MessageEvent) => {
      if (event.origin !== getBaseUrlAuth()) {
        return;
      }
      console.debug('received from child page', event);
      if (event.data.name === 'login') {
        const data = event.data.data;
        const token = {
          access: data.access_token,
          refresh: data.refresh_token,
          expiration: data.expires_in
        };
        await this.$store.dispatch('setToken', token);
        await this.$store.dispatch('getUser');
        // if the site is not initialized, initialize it
        if (!this.$store.state.site?.origin) {
          await this.$store.dispatch('initializeSite');
          // navigate to site config page for white-label site owners,
          // but skip on native platforms (Android/iOS) where users are
          // always on the official site
          if (import.meta.env.VITE_SURFACE !== 'android' && import.meta.env.VITE_SURFACE !== 'ios') {
            await this.$router.push({
              name: ROUTE_SITE_INDEX
            });
          }
        }
        if (import.meta.env.VITE_SURFACE === 'ios' || import.meta.env.VITE_SURFACE === 'android') {
          // On native platforms, hide the auth panel and navigate home instead
          // of reloading — window.location.reload() in Capacitor WKWebView can
          // fail to re-trigger the auth check, leaving users on a blank screen.
          this.$store.commit('setAuth', { visible: false });
          await this.$router.push('/');
        } else {
          window.location.reload();
        }
      }
      if (event.data.name === 'show_qr') {
        const data = event.data.data;
        this.qrLink = data.qrLink;
        this.showQR = true;
      }
    });
  }
});
</script>

<style lang="scss" scoped>
.dialog {
  width: 400px;
  height: 600px;
}

.auth-native {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;

  &__iframe {
    width: 100%;
    height: 100%;
    border: none;
  }
}

@media (prefers-color-scheme: dark) {
  .auth-native {
    background: #1a1a1a;
  }
}
</style>
