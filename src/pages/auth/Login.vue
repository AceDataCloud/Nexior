<script lang="ts">
import { login } from '@/utils';
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
    login(this.redirect);
  },
  methods: {}
});
</script>
