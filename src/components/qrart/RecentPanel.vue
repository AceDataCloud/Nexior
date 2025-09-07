<template>
  <div
    ref="panel"
    class="panel recent flex flex-col items-center justify-center h-full w-full overflow-y-auto"
    @scroll="onHandleScroll"
  >
    <div v-if="tasks?.items === undefined" class="tasks w-full">
      <div v-for="_ in 3" :key="_" class="task placeholder flex flex-row w-full text-left mb-[15px]">
        <div class="left w-[70px] p-[10px]">
          <el-skeleton animated>
            <template #template>
              <el-skeleton-item variant="image" class="avatar w-[50px] h-[50px] rounded-full" />
            </template>
          </el-skeleton>
        </div>
        <div class="main flex-1 p-[10px] mb-[10px]">
          <el-skeleton animated>
            <template #template>
              <el-skeleton-item variant="p" class="title block w-[200px] h-[20px] mb-[15px]" />
              <el-skeleton-item variant="image" class="icon flex h-[200px] w-[300px]" />
            </template>
          </el-skeleton>
        </div>
      </div>
    </div>
    <div v-else-if="tasks?.items?.length && tasks?.items?.length > 0" class="tasks w-full">
      <task-preview
        v-for="(task, taskIndex) in tasks?.items"
        :key="taskIndex"
        :model-value="task"
        class="preview mr-[15px]"
      />
    </div>
    <p
      v-if="tasks?.items?.length === 0"
      class="description text-left text-[14px] text-[var(--el-text-color-secondary)]"
    >
      {{ $t('qrart.message.noTasks') }}
    </p>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import TaskPreview from './task/Preview.vue';
import { ElSkeleton, ElSkeletonItem } from 'element-plus';

export default defineComponent({
  name: 'RecentPanel',
  components: {
    TaskPreview,
    ElSkeleton,
    ElSkeletonItem
  },
  emits: ['reach-top'],
  data() {
    return {
      job: 0
    };
  },
  computed: {
    tasks() {
      // reverse the order of the tasks.items
      return {
        ...this.$store.state.qrart?.tasks,
        items: this.$store.state.qrart?.tasks?.items?.slice()
      };
    }
  },
  methods: {
    onHandleScroll() {
      const el = this.$refs.panel as HTMLElement;
      console.log('reach-top reach-top reach-top');
      if (el.scrollTop === 0) {
        this.$emit('reach-top');
      }
    }
  }
});
</script>
