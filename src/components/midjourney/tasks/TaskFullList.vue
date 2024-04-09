<template>
  <div v-if="tasks" class="tasks">
    <div v-for="(task, taskKey) in tasks" :key="taskKey" class="task">
      <task-preview :full="true" :model-value="task" @custom="onCustom($event)" />
    </div>
  </div>
  <div v-else class="tasks">
    <el-card v-for="_ in 12" :key="_" class="task">
      <el-skeleton animated>
        <template #template>
          <el-skeleton-item variant="image" class="icon-placeholder" />
          <el-skeleton-item variant="p" class="title-placeholder" />
        </template>
      </el-skeleton>
    </el-card>
  </div>
  <div class="pagination">
    <pagination :current-page="page" :page-size="limit" :total="total" @change="onPageChange" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import TaskPreview from './TaskPreview.vue';
import Pagination from '@/components/common/Pagination.vue';
import { ElCard, ElSkeleton, ElSkeletonItem } from 'element-plus';
import { Status } from '@/models';

interface IData {
  job: number | undefined;
}

export default defineComponent({
  name: 'TaskFullList',
  components: {
    TaskPreview,
    Pagination,
    ElSkeleton,
    ElSkeletonItem,
    ElCard
  },
  emits: ['update:modelValue', 'custom', 'refresh'],
  data(): IData {
    return {
      job: undefined
    };
  },
  computed: {
    page() {
      return parseInt(this.$route.query.page?.toString() || '1');
    },
    total() {
      return this.$store.state.midjourney.imagineTasksTotal;
    },
    offset() {
      return (this.page - 1) * this.limit;
    },
    limit() {
      return 12;
    },
    loading() {
      return this.$store.state.midjourney.status.getApplication === Status.Request;
    },
    tasks() {
      return this.$store.state.midjourney.imagineTasks;
    },
    application() {
      return this.$store.state.midjourney.application;
    }
  },
  watch: {
    page: {
      async handler() {
        await this.$store.dispatch('midjourney/setImagineTasks', undefined);
        this.getImagineTasks();
      }
    },
    tasks: {
      handler(val, oldVal) {
        if (val && oldVal && JSON.stringify(val) !== JSON.stringify(oldVal)) {
          this.$emit('refresh', val);
        }
      },
      deep: true
    }
  },
  async mounted() {
    await this.$store.dispatch('midjourney/setImagineTasks', undefined);
    this.getImagineTasks();
    // @ts-ignore
    this.job = setInterval(() => {
      this.getImagineTasks();
    }, 5000);
  },
  unmounted() {
    clearInterval(this.job);
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
    async getImagineTasks() {
      // ensure that the previous request has been completed
      if (this.loading) {
        return;
      }
      await this.$store.dispatch('midjourney/getImagineTasks', {
        limit: this.limit,
        offset: this.offset
      });
    }
  }
});
</script>

<style lang="scss" scoped>
.tasks {
  flex: 1;
  width: 100%;
  overflow-y: scroll;
  flex-wrap: wrap;
  display: flex;
  justify-content: space-around;
  flex-direction: row;
  align-items: center;
  max-width: 1700px;
  margin: 15px auto;
  padding-top: 10px;
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
  width: fit-content;
  margin: auto;
}
</style>
