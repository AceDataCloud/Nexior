<script lang="ts">
import { getBaseUrlAuth, getBaseUrlHub } from '@/utils';
import { defineComponent } from 'vue';

interface IData {
  redirect: string | undefined;
}

export default defineComponent({
  name: 'AuthLogin',
  data(): IData {
    return {
      redirect: this.$route.query.redirect?.toString() || '/'
    };
  },
  async mounted() {
    const hubBaseUrl = getBaseUrlHub();
    const authBaseUrl = getBaseUrlAuth();
    // callback url used to init access token and then redirect back of `redirect`
    const callbackUrl = `${hubBaseUrl}/auth/callback?redirect=${this.redirect}`;
    // redirect to auth service to get access token then redirect back
    const targetUrl = `${authBaseUrl}/auth/login?redirect=${callbackUrl}`;
    window.location.href = targetUrl;
  },
  methods: {}
});
</script>
