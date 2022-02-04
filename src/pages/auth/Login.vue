<template>
  <div></div>
</template>
<script lang="ts">
import { defineComponent } from 'vue';

interface IData {
  accessToken: string | undefined;
  refreshToken: string | undefined;
  redirect: string | undefined;
}

export default defineComponent({
  name: 'Login',
  data(): IData {
    return {
      accessToken: this.$route.query['access-token']?.toString(),
      refreshToken: this.$route.query['refresh-token']?.toString(),
      redirect: this.$route.query.redirect?.toString()
    };
  },
  async mounted() {
    if (this.accessToken && this.refreshToken) {
      await this.$store.dispatch('setAccessToken', this.accessToken);
      await this.$store.dispatch('setRefreshToken', this.refreshToken);
      if (this.redirect) {
        this.$router.push(this.redirect);
      }
    } else {
      const currentUrl = window.location.href;
      const targetUrl = `https://auth.zhishuyun.com?redirect=${currentUrl}`;
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
