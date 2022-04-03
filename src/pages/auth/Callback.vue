<template>
  <div></div>
</template>
<script lang="ts">
import { defineComponent } from 'vue';
import { getCookie } from 'typescript-cookie';

interface IData {
  accessToken: string | undefined;
  refreshToken: string | undefined;
  redirect: string | undefined;
}

export default defineComponent({
  name: 'Login',
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
      if (this.redirect) {
        this.$router.push(this.redirect);
      }
    } else {
      const host = window.location.host;
      const subDomain = import.meta.env.DEV ? 'test.zhishuyun.com' : host.substring(host.indexOf('.') + 1);
      // callback url used to init access token and then redirect back of `redirect`
      const callbackUrl = `https://${host}/auth/callback?redirect=${this.redirect}`;
      const targetUrl = `https://auth.${subDomain}?redirect=${callbackUrl}`;
      window.location.href = targetUrl;
    }
  },
  methods: {}
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
