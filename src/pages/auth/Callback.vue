<script lang="ts">
import { defineComponent } from 'vue';
import { getAuthBaseUrl, getHubBaseUrl } from '@/utils';
import { oauthOperator } from '@/operators/auth/operator';
import { applicationOperator, userOperator } from '@/operators';

interface IData {
  accessToken: string | undefined;
  refreshToken: string | undefined;
  redirect: string | undefined;
  code: string | undefined;
}

export default defineComponent({
  name: 'AuthCallback',
  data(): IData {
    return {
      accessToken: undefined,
      refreshToken: undefined,
      redirect: this.$route.query.redirect?.toString(),
      code: this.$route.query.code?.toString()
    };
  },
  async mounted() {
    if (this.code) {
      console.debug('code found, try to get tokens');
      const { data } = await oauthOperator.token({
        code: this.code
      });
      this.accessToken = data.access_token;
      this.refreshToken = data.refresh_token;
      console.debug('get tokens successfully');
    }
    if (this.accessToken && this.refreshToken) {
      // store token to global store
      await this.$store.dispatch('common/setToken', {
        refresh: this.refreshToken,
        access: this.accessToken
      });
      console.debug('set token successfully');
      const { data: user } = await userOperator.getMe();
      await this.$store.dispatch('common/setUser', user);
      console.debug('set user successfully');
      const { data: applications } = await applicationOperator.getAll({
        user_id: user.id
      });
      await this.$store.dispatch('common/setApplications', applications);
      console.debug('set applications successfully');
      if (this.redirect) {
        this.$router.push(this.redirect);
      }
    } else {
      console.debug('access token and refresh token not found, try to re-auth again');
      const hubBaseUrl = getHubBaseUrl();
      const authBaseUrl = getAuthBaseUrl();
      // callback url used to init access token and then redirect back of `redirect`
      const callbackUrl = `${hubBaseUrl}/auth/callback?redirect=${this.redirect}`;
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
