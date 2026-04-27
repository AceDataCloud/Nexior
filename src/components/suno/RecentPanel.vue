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
    <!-- Search & Sort toolbar -->
    <div v-if="tasks?.items?.length" class="task-toolbar">
      <el-input
        v-model="searchQuery"
        size="small"
        :placeholder="$t('suno.placeholder.searchSongs')"
        clearable
        class="task-search"
      >
        <template #prefix>
          <font-awesome-icon icon="fa-solid fa-magnifying-glass" class="text-xs" />
        </template>
      </el-input>
      <el-dropdown trigger="click" @command="onSortChange">
        <el-button size="small" class="sort-btn">
          <font-awesome-icon icon="fa-solid fa-arrow-down-wide-short" class="mr-1" />
          {{ sortLabel }}
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="newest" :class="{ 'is-active': sortBy === 'newest' }">
              {{ $t('suno.sort.newest') }}
            </el-dropdown-item>
            <el-dropdown-item command="oldest" :class="{ 'is-active': sortBy === 'oldest' }">
              {{ $t('suno.sort.oldest') }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
    <scroll-list
      v-if="filteredTasks?.length > 0"
      ref="scrollList"
      class="flex-1 w-full overflow-y-auto tasks p-2"
      :loading="loading"
      @reach-top="$emit('reach-top')"
    >
      <task-preview v-for="(task, taskId) in filteredTasks" :key="taskId" :model-value="task" class="preview" />
    </scroll-list>
    <div v-else-if="searchQuery && tasks?.items?.length > 0" class="w-full flex-1 flex items-center justify-center">
      <p class="text-sm text-gray-400">{{ $t('suno.message.noSearchResults') }}</p>
    </div>
    <div v-else-if="tasks?.items?.length === 0" class="w-full flex-1 flex items-center justify-center">
      <no-tasks />
    </div>
  </template>
  <div v-show="!!$store?.state?.suno?.audio?.object" class="h-20">
    <player />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import TaskPreview from './task/Preview.vue';
import Player from '@/components/suno/player/Player.vue';
import NoTasks from '@/components/common/NoTasks.vue';
import {
  ElSkeleton,
  ElSkeletonItem,
  ElInput,
  ElButton,
  ElDropdown,
  ElDropdownMenu,
  ElDropdownItem
} from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import ScrollList from '@/components/common/ScrollList.vue';
import { ISunoTask, ISunoAudio } from '@/models';

export default defineComponent({
  name: 'RecentPanel',
  components: {
    ElSkeletonItem,
    ElSkeleton,
    ElInput,
    ElButton,
    ElDropdown,
    ElDropdownMenu,
    ElDropdownItem,
    FontAwesomeIcon,
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
      job: 0,
      searchQuery: '',
      sortBy: 'newest' as 'newest' | 'oldest'
    };
  },
  computed: {
    tasks() {
      return {
        ...this.$store.state.suno?.tasks,
        items: this.$store.state.suno?.tasks?.items?.slice()
      };
    },
    sortLabel(): string {
      return this.sortBy === 'newest'
        ? (this.$t('suno.sort.newest') as string)
        : (this.$t('suno.sort.oldest') as string);
    },
    filteredTasks(): ISunoTask[] {
      let items = this.tasks?.items || [];
      // Search filter
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        items = items.filter((task: ISunoTask) => {
          const audios = (task?.response?.data ?? []) as ISunoAudio[];
          return audios.some(
            (a) =>
              a.title?.toLowerCase().includes(q) ||
              a.style?.toLowerCase().includes(q) ||
              a.prompt?.toLowerCase().includes(q)
          );
        });
      }
      // Sort
      if (this.sortBy === 'oldest') {
        items = [...items].reverse();
      }
      return items;
    }
  },
  methods: {
    onSortChange(command: 'newest' | 'oldest') {
      this.sortBy = command;
    },
    getScrollElement(): HTMLElement | undefined {
      const list = this.$refs.scrollList as any;
      return list?.getScrollElement?.();
    }
  }
});
</script>

<style lang="scss" scoped>
.task-toolbar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;

  .task-search {
    flex: 1;
  }

  .sort-btn {
    flex-shrink: 0;
    white-space: nowrap;
  }
}
</style>
