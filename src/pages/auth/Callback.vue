<script lang="ts">
import { defineComponent } from 'vue';
import { getCookie } from 'typescript-cookie';
import { getAuthBaseUrl, getChatBaseUrl } from '@/utils';
import { removeCookies } from '@/utils/cookie';

interface IData {
  accessToken: string | undefined;
  refreshToken: string | undefined;
  redirect: string | undefined;
}

export default defineComponent({
  name: 'AuthCallback',
  data(): IData {
    return {
      accessToken: undefined,
      refreshToken: undefined,
      redirect: this.$route.query.redirect?.toString()
    };
  },
  async mounted() {
    // get tokens from cookies
    this.accessToken = getCookie('ACCESS_TOKEN');
    this.refreshToken = getCookie('REFRESH_TOKEN');
    if (this.accessToken && this.refreshToken) {
      // store token to global store
      this.$store.dispatch('setAccessToken', this.accessToken);
      this.$store.dispatch('setRefreshToken', this.refreshToken);
      console.debug('set token successfully');
      removeCookies();
      console.debug('remove cookie for tokens successfully');
      // get user info after get access token
      this.$store.dispatch('getMe');
      if (this.redirect) {
        this.$router.push(this.redirect);
      }
    } else {
      console.debug('access token and refresh token not found, try to re-auth again');
      const chatBaseUrl = getChatBaseUrl();
      const authBaseUrl = getAuthBaseUrl();
      // callback url used to init access token and then redirect back of `redirect`
      const callbackUrl = `${chatBaseUrl}/auth/callback?redirect=${this.redirect}`;
      // redirect to auth service to get access token then redirect back
      const targetUrl = `${authBaseUrl}/auth/login?redirect=${callbackUrl}`;
      window.location.href = targetUrl;
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
