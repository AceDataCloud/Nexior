<template>
  <div v-if="tasks === undefined" class="tasks">
    <el-card v-for="_ in 3" :key="_" class="task">
      <el-skeleton animated>
        <template #template>
          <el-skeleton-item variant="image" class="icon-placeholder" />
          <el-skeleton-item variant="p" class="title-placeholder" />
        </template>
      </el-skeleton>
    </el-card>
  </div>
  <div v-else-if="tasks && tasks?.length === 0">
    <p class="p-5 description">{{ $t('midjourney.message.noTasks') }}</p>
  </div>
  <div v-else-if="tasks.length > 0" class="tasks">
    <div v-for="(task, taskKey) in tasks" :key="taskKey" class="task">
      <task-preview :full="false" :model-value="task" @custom="$emit('custom', $event)" />
    </div>
    <el-button type="primary" round class="btn mb-4" @click="onLoadHistory">{{
      $t('midjourney.button.history')
    }}</el-button>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import TaskPreview from './TaskPreview.vue';
import { ROUTE_MIDJOURNEY_HISTORY } from '@/router';
import { ElButton, ElCard, ElSkeleton, ElSkeletonItem } from 'element-plus';
import { Status } from '@/models';

export default defineComponent({
  name: 'TaskBriefList',
  components: {
    TaskPreview,
    ElButton,
    ElCard,
    ElSkeleton,
    ElSkeletonItem
  },
  emits: ['update:modelValue', 'custom', 'refresh'],
  data() {
    return {
      job: 0
    };
  },
  computed: {
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
    async onLoadHistory() {
      this.$router.push({ name: ROUTE_MIDJOURNEY_HISTORY });
    },
    async getImagineTasks() {
      // ensure that the previous request has been completed
      if (this.loading) {
        return;
      }
      await this.$store.dispatch('midjourney/getImagineTasks', {
        limit: 12,
        offset: 0
      });
    }
  }
});
</script>

<style lang="scss" scoped>
.description {
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.tasks {
  padding-top: 20px;
  overflow-y: scroll;
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
