<script lang="ts">
import { defineComponent } from 'vue';
import { getCookie, removeCookie } from 'typescript-cookie';
import { getAuthBaseUrl, getDataBaseUrl } from '@/utils';

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
    this.accessToken = getCookie('ACCESS_TOKEN');
    this.refreshToken = getCookie('REFRESH_TOKEN');
    if (this.accessToken && this.refreshToken) {
      await this.$store.dispatch('setAccessToken', this.accessToken);
      await this.$store.dispatch('setRefreshToken', this.refreshToken);
      const host = window.location.host;
      // process test env and prod env, for example:
      // auth.zhishuyun.com -> .zhishuyun.com
      // auth.test.zhishuyun.com -> .zhishuyun.com
      const domain = host.replace(/^\S+?\.(test\.)?/, '.');
      const path = '/';
      removeCookie('ACCESS_TOKEN', { domain, path });
      removeCookie('REFRESH_TOKEN', { domain, path });
      if (this.redirect) {
        this.$router.push(this.redirect);
      }
    } else {
      console.debug('access token and refresh token not found, try to re-auth again');
      const dataBaseUrl = getDataBaseUrl();
      const authBaseUrl = getAuthBaseUrl();
      // callback url used to init access token and then redirect back of `redirect`
      const callbackUrl = `${dataBaseUrl}/auth/callback?redirect=${this.redirect}`;
      // redirect to auth service to get access token then redirect back
      const targetUrl = `${authBaseUrl}?redirect=${callbackUrl}`;
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
