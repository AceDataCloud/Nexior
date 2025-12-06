<template>
  <div v-if="tasks?.items === undefined" class="tasks">
    <div v-for="_ in 3" :key="_" class="flex">
      <div class="left w-[70px] p-[10px] flex items-center">
        <el-skeleton animated>
          <template #template>
            <el-skeleton-item variant="image" class="avatar w-[50px] h-[50px]" />
          </template>
        </el-skeleton>
      </div>
      <div class="main w-[calc(100%-70px)] flex-1 p-[10px]">
        <el-skeleton animated>
          <template #template>
            <el-skeleton-item variant="p" class="w-[200px] h-[15px] mb-[5px] mt-[10px]" />
            <el-skeleton-item variant="text" />
          </template>
        </el-skeleton>
      </div>
    </div>
  </div>
  <scroll-list
    v-else-if="tasks?.items?.length && tasks?.items?.length > 0"
    ref="scrollList"
    class="flex-1 w-full overflow-y-auto tasks p-2"
    :loading="loading"
    @reach-top="$emit('reach-top')"
  >
    <task-preview v-for="(task, taskId) in tasks?.items" :key="taskId" :model-value="task" class="preview" />
  </scroll-list>
  <div v-if="tasks?.items?.length === 0" class="w-full flex-1 flex items-center justify-center">
    <no-tasks />
  </div>
  <div v-show="!!$store?.state?.suno?.audio?.object" class="h-20">
    <player />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import TaskPreview from './task/Preview.vue';
import Player from '@/components/suno/player/Player.vue';
import NoTasks from '@/components/common/NoTasks.vue';
import { ElSkeleton, ElSkeletonItem } from 'element-plus';
import ScrollList from '@/components/common/ScrollList.vue';

export default defineComponent({
  name: 'RecentPanel',
  components: {
    ElSkeletonItem,
    ElSkeleton,
    TaskPreview,
    Player,
    NoTasks,
    ScrollList
  },
  props: {
    loading: {
      type: Boolean,
      default: false
    }
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
        ...this.$store.state.suno?.tasks,
        items: this.$store.state.suno?.tasks?.items?.slice()
      };
    }
  },
  methods: {
    getScrollElement(): HTMLElement | undefined {
      const list = this.$refs.scrollList as any;
      return list?.getScrollElement?.();
    }
  }
});
</script>
