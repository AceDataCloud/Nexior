<template>
  <div class="tasks">
    <div v-for="(task, taskKey) in tasks" :key="taskKey" class="task">
      <task-preview :model-value="task" @custom="$emit('custom', $event)" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import TaskPreview from './TaskPreview.vue';
import {
  IApplication,
  IMidjourneyImagineTask,
  MidjourneyImagineState,
  apiUsageOperator,
  midjourneyOperator
} from '@/operators';

interface IData {
  historyTasks: IMidjourneyImagineTask[];
}

export default defineComponent({
  name: 'TaskBriefList',
  components: {
    TaskPreview
  },
  props: {
    activeTask: {
      type: Object as () => IMidjourneyImagineTask | undefined,
      required: true
    },
    applications: {
      type: Object as () => IApplication[],
      required: true
    }
  },
  emits: ['update:modelValue', 'custom', 'update:activeTask'],
  data(): IData {
    return {
      historyTasks: []
    };
  },
  computed: {
    tasks() {
      return [...(this.activeTask ? [this.activeTask] : []), ...this.historyTasks];
    }
  },
  watch: {
    applications(val) {
      if (val) {
        this.getHistoryTasks();
      }
    },
    activeTask(val: IMidjourneyImagineTask | undefined, oldVal: IMidjourneyImagineTask | undefined) {
      if (
        (val?.state === MidjourneyImagineState.FINISHED && oldVal?.state !== MidjourneyImagineState.FINISHED) ||
        (val?.state === MidjourneyImagineState.FAILED && oldVal?.state !== MidjourneyImagineState.FAILED)
      ) {
        console.log('need to refresh history tasks');
        this.getHistoryTasks();
        this.$emit('update:activeTask', undefined);
      }
    }
  },
  methods: {
    async getHistoryTasks() {
      const {
        data: { items: apiUsages }
      } = await apiUsageOperator.getAll({
        user_id: this.$store.state.user.id,
        application_id: this.applications?.map((application) => application.id),
        offset: 0,
        limit: 5,
        ordering: '-created_at'
      });
      const tasks = (await midjourneyOperator.tasks(apiUsages.map((apiUsage) => apiUsage.metadata?.task_id as string)))
        .data;
      this.historyTasks = tasks.filter((task) => task && task?.response);
    }
  }
});
</script>

<style lang="scss" scoped>
.tasks {
  padding-top: 20px;
  height: 100%;
  overflow-y: scroll;
  border-left: 1px solid var(--el-border-color);
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
