<template>
  <div></div>
</template>
<script lang="ts">
import { defineComponent } from 'vue';

interface IData {
  redirect: string | undefined;
}

export default defineComponent({
  name: 'Login',
  data(): IData {
    return {
      redirect: this.$route.query.redirect?.toString()
    };
  },
  async mounted() {
    const host = window.location.host;
    const subDomain = host.substring(host.indexOf('.') + 1);
    // callback url used to init access token and then redirect back of `redirect`
    const callbackUrl = `https://${host}/auth/callback?redirect=${this.redirect}`;
    // redirect to auth service to get access token then redirect back
    const targetUrl = `https://auth.${subDomain}?redirect=${callbackUrl}`;
    window.location.href = targetUrl;
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
