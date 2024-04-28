<template>
  <div class="panel recent">
    <task-preview
      v-for="(task, taskIndex) in tasks?.items"
      :key="taskIndex"
      :model-value="task"
      class="preview"
      @click="onSelectTask(task)"
    />
    <p v-if="tasks?.items?.length === 0">
      {{ $t('qrart.message.noTasks') }}
    </p>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import TaskPreview from './task/Preview.vue';
import { Status, IQrartTask } from '@/models';

export default defineComponent({
  name: 'RecentPanel',
  components: {
    TaskPreview
  },
  emits: ['select'],
  data() {
    return {
      job: 0
    };
  },
  computed: {
    loading() {
      return this.$store.state.qrart?.status?.getApplication === Status.Request;
    },
    tasks() {
      return this.$store.state.qrart?.tasks;
    }
  },
  async mounted() {
    await this.$store.dispatch('qrart/setTasks', undefined);
    this.getTasks();
    // @ts-ignore
    this.job = setInterval(() => {
      this.getTasks();
    }, 5000);
  },
  methods: {
    async onLoadHistory() {
      // this.$router.push({ name: ROUTE_MIDJOURNEY_HISTORY });
    },
    async onSelectTask(task: IQrartTask) {
      this.$store.dispatch('qrart/setTasksActive', task);
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
  &.recent {
    width: 100%;
    height: 300px;
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    overflow-x: scroll;
    .preview {
      margin-right: 15px;
    }
  }
}
</style>
