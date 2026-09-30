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
  <template v-else>
    <scroll-list
      v-if="orderedTasks?.length > 0"
      ref="scrollList"
      class="flex-1 w-full overflow-y-auto tasks p-2"
      :loading="loading"
      @reach-top="$emit('reach-top')"
    >
      <task-preview
        v-for="task in orderedTasks"
        :key="task.id"
        :model-value="task"
        class="preview"
        @wallet-task="$emit('wallet-task', $event)"
      />
    </scroll-list>
    <div v-else-if="loading" class="w-full flex-1 flex items-center justify-center">
      <el-icon class="is-loading text-xl text-gray-400"
        ><loading :size="'1em' as any" aria-hidden="true" focusable="false"
      /></el-icon>
    </div>
    <div v-else-if="tasks?.items?.length === 0" class="w-full flex-1 flex items-center justify-center">
      <no-tasks />
    </div>
  </template>
  <div v-show="!!$store?.state?.suno?.audio?.object" class="h-20">
    <player namespace="suno" :tracks="visibleTracks" />
  </div>
</template>

<script lang="ts">
import { LoadingIcon as Loading } from '@acedatacloud/core/icons/components';
import { defineComponent } from 'vue';
import TaskPreview from './task/Preview.vue';
import Player from '@/components/common/player/Player.vue';
import NoTasks from '@/components/common/NoTasks.vue';
import { ElSkeleton, ElSkeletonItem, ElIcon } from 'element-plus';

import ScrollList from '@/components/common/ScrollList.vue';
import { ISunoTask, ISunoAudio } from '@/models';

export default defineComponent({
  name: 'RecentPanel',
  components: {
    ElSkeletonItem,
    ElSkeleton,
    ElIcon,
    Loading,
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
  emits: ['reach-top', 'load-all', 'wallet-task'],
  computed: {
    tasks() {
      return {
        ...this.$store.state.suno?.tasks,
        items: this.$store.state.suno?.tasks?.items?.slice()
      };
    },
    orderedTasks(): ISunoTask[] {
      return this.tasks?.items || [];
    },
    // Flat, ordered playable tracks in the *visible* order — feeds the player's
    // prev/next so it follows the list the user sees, not
    // the raw store order.
    visibleTracks(): ISunoAudio[] {
      const out: ISunoAudio[] = [];
      for (const task of this.orderedTasks) {
        for (const a of (Array.isArray(task?.response?.data) ? task.response.data : []) as ISunoAudio[]) {
          if (a?.audio_url) out.push(a);
        }
      }
      return out;
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
