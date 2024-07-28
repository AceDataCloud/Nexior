<script lang="ts">
import { defineComponent } from 'vue';

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
    if (this.redirect) {
      await this.$router.push(this.redirect);
    } else {
      await this.$router.push('/');
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
