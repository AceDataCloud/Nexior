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
              <el-skeleton-item variant="text" style="margin-right: 16px" />
              <el-skeleton-item variant="text" style="width: 80%" />
            </template>
          </el-skeleton>
        </div>
      </div>
    </div>
    <div v-else-if="tasks?.items?.length && tasks?.items?.length > 0" class="tasks">
      <task-preview v-for="(task, taskId) in tasks?.items" :key="taskId" :model-value="task" class="preview" />
    </div>
    <p v-if="tasks?.items?.length === 0" class="description">
      {{ $t('suno.message.noTasks') }}
    </p>
  </div>
  <div v-show="!!$store?.state?.suno?.audio?.object" class="flex-1 flex flex-col">
    <div class="h-20">
      <player />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import TaskPreview from './task/Preview.vue';
import Player from '@/components/suno/player/Player.vue';
import { ElSkeleton, ElSkeletonItem } from 'element-plus';

export default defineComponent({
  name: 'RecentPanel',
  components: {
    TaskPreview,
    ElSkeleton,
    ElSkeletonItem,
    Player
  },
  data() {
    return {
      job: 0
    };
  },
  computed: {
    tasks() {
      // reverse the order of the tasks.items
      return {
        ...this.$store.state.suno?.tasks,
        items: this.$store.state.suno?.tasks?.items?.slice().reverse()
      };
    }
  }
});
</script>

<style lang="scss" scoped>
.panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  // justify-content: center;
  // height: 100%;
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
              // border-radius: 50%;
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
