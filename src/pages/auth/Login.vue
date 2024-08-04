<script lang="ts">
import { defineComponent } from 'vue';

interface IData {
  redirect: string | undefined;
}

export default defineComponent({
  name: 'AuthLogin',
  data(): IData {
    return {
      redirect: this.$route.query.redirect?.toString()
    };
  },
  async mounted() {
    if (!!this.$store.state.token.access) {
      this.$router.push(this.redirect || '/');
    } else {
      this.$store.dispatch('login');
    }
  }
});
</script>
