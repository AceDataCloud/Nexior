<script lang="ts">
import { defineComponent } from 'vue';
import { IUser, IToken } from '@/models';

interface IData {
  accessToken: string | undefined;
  refreshToken: string | undefined;
  redirect: string | undefined;
  code: string | undefined;
  user: IUser | undefined;
}

export default defineComponent({
  name: 'AuthCallback',
  data(): IData {
    return {
      accessToken: undefined,
      refreshToken: undefined,
      redirect: this.$route.query.redirect?.toString(),
      code: this.$route.query.code?.toString(),
      user: undefined
    };
  },
  async mounted() {
    // if auth code is provided, get token via oauth
    if (this.code) {
      const data: IToken = await this.$store.dispatch('getToken', this.code);
      this.accessToken = data.access;
      this.refreshToken = data.refresh;
    } else {
      this.$store.dispatch('resetToken');
      return;
    }
    // if token acquired, get user info
    if (this.accessToken && this.refreshToken) {
      const user = await this.$store.dispatch('getUser');
      this.user = user;
      if (this.redirect) {
        await this.$router.push(this.redirect);
      }
    } else {
      // reset token and trigger popup login window
      this.$store.dispatch('resetToken');
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
