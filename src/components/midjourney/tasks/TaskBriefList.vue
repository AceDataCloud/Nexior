<template>
  <div v-if="tasks?.length > 0" class="tasks">
    <div v-for="(task, taskKey) in tasks" :key="taskKey" class="task">
      <task-preview :full="false" :model-value="task" :applications="applications" @custom="$emit('custom', $event)" />
    </div>
    <el-button type="primary" class="btn mb-4" @click="onLoadHistory">{{ $t('midjourney.button.history') }}</el-button>
  </div>
  <div v-else class="tasks">
    <el-card v-for="_ in 3" :key="_" class="task">
      <el-skeleton animated>
        <template #template>
          <el-skeleton-item variant="image" class="icon-placeholder" />
          <el-skeleton-item variant="p" class="title-placeholder" />
        </template>
      </el-skeleton>
    </el-card>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import TaskPreview from './TaskPreview.vue';
import { IApplication, IMidjourneyImagineTask, apiUsageOperator, midjourneyOperator } from '@/operators';
import { ROUTE_MIDJOURNEY_HISTORY } from '@/router';
import { ElButton, ElCard, ElSkeleton, ElSkeletonItem } from 'element-plus';

interface IData {
  tasks: IMidjourneyImagineTask[];
  mounted: boolean;
  loading: boolean;
}

export default defineComponent({
  name: 'TaskBriefList',
  components: {
    TaskPreview,
    ElButton,
    ElCard,
    ElSkeleton,
    ElSkeletonItem
  },
  props: {
    applications: {
      type: Object as () => IApplication[],
      required: true
    }
  },
  emits: ['update:modelValue', 'custom'],
  data(): IData {
    return {
      tasks: [],
      mounted: false,
      loading: false
    };
  },
  watch: {
    applications(val) {
      if (val) {
        this.getTasks();
      }
    }
  },
  mounted() {
    this.mounted = true;
  },
  methods: {
    async onLoadHistory() {
      this.$router.push({ name: ROUTE_MIDJOURNEY_HISTORY });
    },
    async getTasks() {
      // ensure that the previous request has been completed
      if (this.loading) {
        return;
      }
      this.loading = true;
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
      this.tasks = tasks.map((task) => {
        const apiUsage = apiUsages.filter((apiUsage) => apiUsage.metadata?.task_id === task.id)[0];
        return {
          ...task,
          created_at: apiUsage.created_at
        };
      });
      this.loading = false;
      if (this.mounted) {
        setTimeout(() => {
          this.getTasks();
        }, 5000);
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.tasks {
  padding-top: 20px;
  overflow-y: scroll;
  border-left: 1px solid var(--el-border-color);
  display: flex;
  flex-direction: column;
  align-items: center;
  .task {
    margin-bottom: 15px;
    width: 350px;
    margin: 8px;
    height: fit-content;

    .icon-placeholder {
      display: flex;
      height: 310px;
      width: 310px;
      margin: 0 auto 15px auto;
      text-align: center;
    }

    .title-placeholder {
      display: block;
      width: 80px;
      height: 20px;
      margin: 0 auto 10px auto;
    }

    .operations {
      height: fit-content !important;
    }
  }
}

.btn {
  border-radius: 20px;
}
</style>
