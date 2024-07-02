<template>
  <div class="panel recent">
    <div v-if="tasks?.items === undefined" class="tasks">
      <div v-for="_ in 3" :key="_" class="task placeholder">
        <div class="left">
          <el-skeleton animated>
            <template #template>
              <el-skeleton-item variant="image" class="avatar" />
            </template>
          </el-skeleton>
        </div>
        <div class="main">
          <el-skeleton animated>
            <template #template>
              <el-skeleton-item variant="p" class="title" />
              <el-skeleton-item variant="image" class="icon" />
            </template>
          </el-skeleton>
        </div>
      </div>
    </div>
    <div v-else-if="tasks?.items?.length && tasks?.items?.length > 0" class="tasks">
      <task-preview v-for="(task, taskIndex) in tasks?.items" :key="taskIndex" :model-value="task" class="preview" />
    </div>
    <p v-if="tasks?.items?.length === 0" class="description">
      {{ $t('qrart.message.noTasks') }}
    </p>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import TaskPreview from './task/Preview.vue';
import { Status } from '@/models';
import { ElSkeleton, ElSkeletonItem } from 'element-plus';

export default defineComponent({
  name: 'RecentPanel',
  components: {
    TaskPreview,
    ElSkeleton,
    ElSkeletonItem
  },
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
      // reverse the order of the tasks.items
      return {
        ...this.$store.state.qrart?.tasks,
        items: this.$store.state.qrart?.tasks?.items?.slice().reverse()
      };
    }
  },
  async mounted() {
    await this.$store.dispatch('qrart/setTasks', undefined);
    await this.getTasks();
    await this.onScrollDown();
    // @ts-ignore
    this.job = setInterval(() => {
      this.getTasks();
    }, 5000);
  },
  async unmounted() {
    clearInterval(this.job);
  },
  methods: {
    async onScrollDown() {
      setTimeout(() => {
        // scroll to bottom for `.recent`
        const el = document.querySelector('.recent');
        if (el) {
          el.scrollTop = el.scrollHeight;
        }
      }, 500);
    },
    async getTasks() {
      // ensure that the previous request has been completed
      if (this.loading) {
        return;
      }
      await this.$store.dispatch('qrart/getTasks', {
        limit: 50,
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
    height: 100%;
    display: flex;
    overflow-y: auto;
    flex-direction: column;
    .preview {
      margin-right: 15px;
    }
    .description {
      text-align: left;
      font-size: 14px;
      color: var(--el-text-color-secondary);
    }
    .tasks {
      width: 100%;
      .task {
        margin-bottom: 15px;
        width: 100%;
        height: fit-content;
        text-align: left;

        &.placeholder {
          display: flex;
          flex-direction: row;
          .left {
            width: 70px;
            padding: 10px;

            .avatar {
              width: 50px;
              height: 50px;
              border-radius: 50%;
            }
          }

          .main {
            width: calc(100% - 70px);
            flex: 1;
            padding: 10px;
            margin-bottom: 10px;

            .icon {
              display: flex;
              height: 200px;
              width: 300px;
            }

            .title {
              display: block;
              width: 200px;
              height: 20px;
              margin-bottom: 15px;
            }
          }
        }

        .operations {
          height: fit-content !important;
        }
      }
    }
  }
}
</style>
