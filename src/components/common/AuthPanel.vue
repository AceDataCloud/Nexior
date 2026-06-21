<template>
  <div v-if="isInAppLogin" class="auth-native">
    <div v-if="useBrowser" class="auth-native__loading">
      <p>{{ $t('common.status.loading') }}</p>
    </div>
    <iframe v-else class="auth-native__iframe" :src="iframeUrl" frameborder="0" />
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
import axios from 'axios';
import { ElDialog } from 'element-plus';
import { ElMessage } from 'element-plus';
import { getBaseUrlAuth, withCurrentSite } from '@/utils';
import { getCookie } from 'typescript-cookie';
import QrCode from 'vue-qrcode';
import { ROUTE_SETTINGS_INDEX } from '@/router';
import { Browser } from '@capacitor/browser';
import { SignInWithApple } from '@capacitor-community/apple-sign-in';
import { isNative as isNativeSurface, isIOS, isDesktop } from '@/utils/surface';
import { desktopBridge } from '@/utils/desktop';
import { track } from '@/plugins/telemetry';

// Native Sign In with Apple is keyed by the iOS bundle identifier, NOT
// the web Services ID. The same Apple `sub` is returned for both, so
// accounts stay linked across native and web.
const APPLE_NATIVE_CLIENT_ID = 'com.acedatacloud.nexior';

export default defineComponent({
  name: 'AuthPanel',
  components: {
    ElDialog,
    QrCode
  },
  data() {
    return {
      showQR: false,
      qrLink: '',
      useBrowser: false
    };
  },
  computed: {
    isNative() {
      return isNativeSurface();
    },
    // Both native AND desktop use the in-app iframe login UI (never the web
    // redirect, which can't return to an app://bundle / Capacitor window).
    isInAppLogin() {
      return isNativeSurface() || isDesktop();
    },
    // Per-surface OAuth redirect scheme. Mobile keeps its existing scheme;
    // desktop uses a distinct one so the two can't collide on one machine.
    nativeRedirect() {
      return isDesktop() ? 'acedata-desktop' : 'com.acedatacloud.nexior';
    },
    iframeUrl() {
      // Trailing slash matters: `/auth/login` 301s to a cleartext `http://`
      // URL that iOS ATS blocks, leaving this iframe blank (white screen).
      let url = `${getBaseUrlAuth()}/auth/login/?inviter_id=${this.inviterId}`;
      if (this.isInAppLogin) {
        url += `&native_redirect=${this.nativeRedirect}`;
      }
      // Pass `site` so the embedded AuthFrontend login form renders the
      // calling subsite's white-label logo (no-op on the main official host).
      return withCurrentSite(url);
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
    if (this.isNative) {
      // Capacitor-only: if the user closes the in-app browser manually, fall
      // back to the iframe login UI. Desktop OAuth opens the SYSTEM browser
      // (no browserFinished event), so this listener must stay isNative-only —
      // never isInAppLogin — or desktop would get stuck on the loading screen.
      Browser.addListener('browserFinished', () => {
        console.debug('browser closed by user');
        this.useBrowser = false;
      });
    }
    // On native platforms, keep the iframe for regular login (email/password).
    // When the user clicks Google/GitHub, the iframe (AuthFrontend) sends a
    // postMessage asking us to open the OAuth flow in the in-app browser.
    window.addEventListener('message', async (event: MessageEvent) => {
      if (event.origin !== getBaseUrlAuth()) {
        return;
      }
      console.debug('received from child page', event);
      if (event.data.name === 'nativeOAuth' && this.isInAppLogin) {
        const provider = event.data.data?.provider;
        // On iOS, Apple Sign In must use the native ASAuthorization sheet —
        // SFSafariViewController lacks the system bridge that Apple's JS SDK
        // needs, so it falls back to a webpage that asks for the iCloud
        // password instead of using Face ID.
        if (provider === 'apple' && isIOS()) {
          track('apple_login_submit', { action: 'native_ios' });
          try {
            const { response } = await SignInWithApple.authorize({
              clientId: APPLE_NATIVE_CLIENT_ID,
              redirectURI: '',
              scopes: 'email name'
            });
            if (!response?.identityToken) {
              throw new Error('apple identity_token missing');
            }
            // POST the identity_token directly to AuthBackend. Same endpoint
            // as the web Apple JS flow — apple_get_user_data verifies the JWT
            // against Apple's JWKS, no client_secret needed. Raw axios here
            // bypasses the platform httpClient, so set an explicit timeout —
            // otherwise a stalled connection hangs the sheet with no error.
            const loginResp = await axios.post(
              `${getBaseUrlAuth()}/api/v1/auth/login/`,
              {
                platform: 'apple',
                identity_token: response.identityToken,
                inviter_id: this.inviterId,
                user: {
                  name: {
                    firstName: response.givenName ?? '',
                    lastName: response.familyName ?? ''
                  }
                }
              },
              { timeout: 20000 }
            );
            const data = loginResp.data;
            const token = {
              access: data.access_token,
              refresh: data.refresh_token,
              expiration: data.expires_in
            };
            await this.$store.dispatch('setToken', token);
            await this.$store.dispatch('getUser');
            if (!this.$store.state.site?.origin) {
              await this.$store.dispatch('initializeSite');
            }
            track('apple_login_success', { action: 'native_ios' });
            this.$store.commit('setAuth', { visible: false });
            await this.$router.push('/');
          } catch (error: unknown) {
            // ASAuthorizationError code 1001 = the user dismissed the sheet.
            // That's an expected outcome, so stay silent and keep the iframe
            // login UI available for another method. Any OTHER failure
            // (network down, token rejected by AuthBackend, missing "Sign in
            // with Apple" capability) used to be swallowed too, leaving the
            // button looking dead — surface those to the user instead.
            const detail = error instanceof Error ? error.message : String(error);
            const canceled = /\b100[01]\b/.test(detail) || /cancel/i.test(detail);
            if (canceled) {
              track('apple_login_canceled', { action: 'native_ios' });
              console.debug('native apple sign in canceled by user', error);
            } else {
              track('apple_login_failed', { action: 'native_ios', error: detail });
              console.warn('native apple sign in failed', error);
              ElMessage.error(this.$t('common.error.appleSignInFailed').toString());
            }
          }
          return;
        }
        // AuthFrontend in iframe can't do OAuth popups/redirects (X-Frame-Options).
        // Open the auth page with the provider pre-selected, using the
        // per-surface redirect scheme.
        const authUrl = withCurrentSite(
          `${getBaseUrlAuth()}/auth/login/?inviter_id=${this.inviterId}&native_redirect=${this.nativeRedirect}&provider=${provider}`
        );
        if (isDesktop()) {
          // Desktop has no Capacitor in-app browser. Hand off to the Electron
          // main process, which appends + stores a `state` nonce and opens the
          // SYSTEM browser. The result returns via the custom-scheme deep link
          // → window.desktop.onAuthCallback → exchangeSsoCode (in App.vue).
          // Do NOT set useBrowser here — there's no browserFinished to clear it.
          await desktopBridge()?.openOAuth(authUrl);
        } else {
          this.useBrowser = true;
          Browser.open({ url: authUrl });
        }
        return;
      }
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
          // navigate to settings page (the dialog auto-opens) for
          // white-label site owners, but skip on native/desktop where users
          // are always on the official site
          if (!isNativeSurface() && !isDesktop()) {
            await this.$router.push({
              name: ROUTE_SETTINGS_INDEX
            });
          }
        }
        if (isNativeSurface() || isDesktop()) {
          // On native AND desktop, hide the auth panel and navigate home
          // instead of reloading — window.location.reload() in Capacitor
          // WKWebView can fail to re-trigger the auth check, and on desktop it
          // would reload the app://bundle (the navigation we avoid everywhere).
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

  &__loading {
    text-align: center;
    color: #666;
    font-size: 16px;
  }
}

@media (prefers-color-scheme: dark) {
  .auth-native {
    background: #1a1a1a;
  }
}
</style>
