<template>
  <div v-if="tasks === undefined" class="tasks">
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
  <div v-else-if="tasks && tasks?.length === 0">
    <p class="p-5 description">{{ $t('midjourney.message.noTasks') }}</p>
  </div>
  <div v-else-if="tasks.length > 0" class="tasks">
    <div v-for="(task, taskKey) in tasks" :key="taskKey" class="task">
      <task-item :full="false" :model-value="task" @custom="$emit('custom', $event)" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import TaskItem from './TaskItem.vue';
import { ElSkeleton, ElSkeletonItem } from 'element-plus';
import { Status } from '@/models';

export default defineComponent({
  name: 'TaskList',
  components: {
    TaskItem,
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
    tasks() {
      // eslint-disable-next-line vue/no-side-effects-in-computed-properties
      return this.$store.state.midjourney.tasks?.items;
    },
    application() {
      return this.$store.state.midjourney.application;
    }
  }
});
</script>

<style lang="scss" scoped>
.description {
  text-align: center;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.tasks {
  overflow-y: scroll;
  display: flex;
  flex-direction: column;

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

        .icon {
          display: flex;
          height: 300px;
          width: 300px;
        }

        .title {
          display: block;
          width: 200px;
          height: 20px;
          margin-bottom: 20px;
        }
      }
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
