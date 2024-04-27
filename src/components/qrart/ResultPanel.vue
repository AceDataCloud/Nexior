<template>
  <div class="panel">
    <div class="detail"></div>

    <div class="previews"></div>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import ResultPreview from './result/Preview.vue';
import ApplicationStatus from '@/components/application/Status.vue';
import { Status } from '@/models';

export default defineComponent({
  name: 'ResultPanel',
  components: {
    ResultPreview,
    ApplicationStatus
  },
  data() {
    return {
      job: 0
    };
  },
  computed: {
    loading() {
      return this.$store.state.qrart.status.getApplication === Status.Request;
    }
  },
  async mounted() {
    await this.$store.dispatch('qrart/setTasks', undefined);
    this.getTasks();
    this.job = setInterval(() => {
      this.getTasks();
    }, 5000);
  },
  methods: {
    async onLoadHistory() {
      // this.$router.push({ name: ROUTE_MIDJOURNEY_HISTORY });
    },
    async getTasks() {
      // ensure that the previous request has been completed
      if (this.loading) {
        return;
      }
      await this.$store.dispatch('qrart/getTasks', {
        limit: 12,
        offset: 0
      });
    }
  }
});
</script>

<style lang="scss" scoped>
.panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}
</style>
