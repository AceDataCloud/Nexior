<script lang="ts">
import { defineComponent } from 'vue';
import { authReturnPath } from '@/utils/auth/returnPath';

interface IData {
  redirect: string | undefined;
}

export default defineComponent({
  name: 'AuthCallback',
  data(): IData {
    return {
      redirect: this.$route.query.redirect?.toString()
    };
  },
  async mounted() {
    const target = authReturnPath(this.redirect, !!this.$store.state.auth?.reauthenticate);
    this.$store.commit('setAuth', { visible: false, reauthenticate: false });
    await this.$router.push(target);
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
