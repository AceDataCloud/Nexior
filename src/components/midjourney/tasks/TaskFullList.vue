<template>
  <div v-if="tasks.length > 0" class="tasks">
    <div v-for="(task, taskKey) in tasks" :key="taskKey" class="task">
      <task-preview :full="true" :model-value="task" :applications="applications" @custom="onCustom($event)" />
    </div>
  </div>
  <div v-else class="tasks">
    <el-card v-for="_ in 8" :key="_" class="task">
      <el-skeleton animated>
        <template #template>
          <el-skeleton-item variant="image" class="icon-placeholder" />
          <el-skeleton-item variant="p" class="title-placeholder" />
        </template>
      </el-skeleton>
    </el-card>
  </div>
  <el-row>
    <el-col :span="10" :offset="14">
      <div class="pagination">
        <pagination :current-page="page" :page-size="limit" :total="total" @change="onPageChange" />
      </div>
    </el-col>
  </el-row>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import TaskPreview from './TaskPreview.vue';
import { IApplication, IMidjourneyImagineTask, apiUsageOperator, midjourneyOperator } from '@/operators';
import Pagination from '@/components/common/Pagination.vue';
import { ElRow, ElCol, ElCard, ElSkeleton, ElSkeletonItem } from 'element-plus';

interface IData {
  tasks: IMidjourneyImagineTask[];
  mounted: boolean;
  total: number | undefined;
  limit: number;
  offset: number;
  loading: boolean;
}

export default defineComponent({
  name: 'TaskFullList',
  components: {
    TaskPreview,
    Pagination,
    ElRow,
    ElCol,
    ElSkeleton,
    ElSkeletonItem,
    ElCard
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
      limit: 12,
      offset: 0,
      total: undefined,
      loading: false
    };
  },
  computed: {
    page() {
      return parseInt(this.$route.query.page?.toString() || '1');
    }
  },
  watch: {
    applications(val) {
      if (val) {
        this.getTasks();
      }
    },
    page: {
      handler() {
        this.getTasks();
      }
    }
  },
  mounted() {
    this.mounted = true;
  },
  methods: {
    onPageChange(page: number) {
      this.$router.push({
        name: this.$route.name?.toString(),
        query: {
          page: page
        }
      });
    },
    async onCustom(event: any) {
      this.$emit('custom', event);
      setTimeout(() => {
        this.$router.push({
          name: this.$route.name?.toString(),
          query: {
            page: 1
          }
        });
      }, 3000);
    },
    async getTasks() {
      // ensure that the previous request has been completed
      if (this.loading) {
        return;
      }
      this.loading = true;
      const {
        data: { items: apiUsages, count }
      } = await apiUsageOperator.getAll({
        user_id: this.$store.state.user.id,
        application_id: this.applications?.map((application) => application.id),
        offset: (this.page - 1) * this.limit,
        limit: this.limit,
        ordering: '-created_at'
      });
      this.total = count;
      const tasks = (await midjourneyOperator.tasks(apiUsages.map((apiUsage) => apiUsage.metadata?.task_id as string)))
        .data;
      this.tasks = tasks.map((task) => {
        const apiUsage = apiUsages.filter((apiUsage) => apiUsage.metadata?.task_id === task?.id)[0];
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
  flex: 1;
  width: 100%;
  overflow-y: scroll;
  margin-top: 15px;
  flex-wrap: wrap;
  display: flex;
  justify-content: space-around;
  flex-direction: row;
  align-items: center;
  .task {
    width: 350px;
    margin-bottom: 30px;

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
  }
}

.pagination {
  height: 60px;
  padding-top: 10px;
}
</style>
