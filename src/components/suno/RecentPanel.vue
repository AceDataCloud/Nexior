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
      <el-popover trigger="click" placement="bottom-end" :width="260">
        <template #reference>
          <el-button size="small" class="filter-btn" :class="{ 'has-active-filter': activeFilterCount > 0 }">
            <font-awesome-icon icon="fa-solid fa-filter" class="mr-1" />
            {{ $t('suno.filter.title') }}
            <span v-if="activeFilterCount > 0" class="filter-badge">{{ activeFilterCount }}</span>
          </el-button>
        </template>
        <div class="filter-popover">
          <div class="filter-row">
            <div class="filter-label">{{ $t('suno.filter.type') }}</div>
            <el-radio-group v-model="filterType" size="small">
              <el-radio-button value="all">{{ $t('suno.filter.typeAll') }}</el-radio-button>
              <el-radio-button value="vocal">{{ $t('suno.filter.typeVocal') }}</el-radio-button>
              <el-radio-button value="instrumental">{{ $t('suno.filter.typeInstrumental') }}</el-radio-button>
            </el-radio-group>
          </div>
          <div class="filter-row">
            <div class="filter-label">{{ $t('suno.filter.duration') }}</div>
            <el-radio-group v-model="filterDuration" size="small">
              <el-radio-button value="all">{{ $t('suno.filter.durationAll') }}</el-radio-button>
              <el-radio-button value="short">{{ $t('suno.filter.durationShort') }}</el-radio-button>
              <el-radio-button value="medium">{{ $t('suno.filter.durationMedium') }}</el-radio-button>
              <el-radio-button value="long">{{ $t('suno.filter.durationLong') }}</el-radio-button>
            </el-radio-group>
          </div>
          <div class="filter-row">
            <div class="filter-label">{{ $t('suno.filter.video') }}</div>
            <el-radio-group v-model="filterVideo" size="small">
              <el-radio-button value="all">{{ $t('suno.filter.videoAll') }}</el-radio-button>
              <el-radio-button value="with">{{ $t('suno.filter.videoWith') }}</el-radio-button>
              <el-radio-button value="without">{{ $t('suno.filter.videoWithout') }}</el-radio-button>
            </el-radio-group>
          </div>
          <div v-if="availableModels.length > 0" class="filter-row">
            <div class="filter-label">{{ $t('suno.filter.model') }}</div>
            <el-select v-model="filterModel" size="small" :placeholder="$t('suno.filter.modelAll')" clearable>
              <el-option :label="$t('suno.filter.modelAll')" value="all" />
              <el-option v-for="m in availableModels" :key="m" :label="m" :value="m" />
            </el-select>
          </div>
          <div class="filter-actions">
            <el-button size="small" text @click="onResetFilters">
              {{ $t('suno.filter.reset') }}
            </el-button>
          </div>
        </div>
      </el-popover>
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
    <div
      v-else-if="activeFilterCount > 0 && tasks?.items?.length > 0"
      class="w-full flex-1 flex flex-col items-center justify-center gap-2"
    >
      <p class="text-sm text-gray-400">{{ $t('suno.message.noFilterResults') }}</p>
      <el-button size="small" text @click="onResetFilters">{{ $t('suno.filter.reset') }}</el-button>
    </div>
    <div v-else-if="tasks?.items?.length === 0" class="w-full flex-1 flex items-center justify-center">
      <no-tasks />
    </div>
  </template>
  <div v-show="!!$store?.state?.suno?.audio?.object" class="h-20">
    <player namespace="suno" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import TaskPreview from './task/Preview.vue';
import Player from '@/components/common/player/Player.vue';
import NoTasks from '@/components/common/NoTasks.vue';
import {
  ElSkeleton,
  ElSkeletonItem,
  ElInput,
  ElButton,
  ElDropdown,
  ElDropdownMenu,
  ElDropdownItem,
  ElPopover,
  ElRadioGroup,
  ElRadioButton,
  ElSelect,
  ElOption
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
    ElPopover,
    ElRadioGroup,
    ElRadioButton,
    ElSelect,
    ElOption,
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
      sortBy: 'newest' as 'newest' | 'oldest',
      filterType: 'all' as 'all' | 'vocal' | 'instrumental',
      filterDuration: 'all' as 'all' | 'short' | 'medium' | 'long',
      filterVideo: 'all' as 'all' | 'with' | 'without',
      filterModel: 'all' as string
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
    activeFilterCount(): number {
      let count = 0;
      if (this.filterType !== 'all') count++;
      if (this.filterDuration !== 'all') count++;
      if (this.filterVideo !== 'all') count++;
      if (this.filterModel && this.filterModel !== 'all') count++;
      return count;
    },
    availableModels(): string[] {
      const items = (this.tasks?.items || []) as ISunoTask[];
      const set = new Set<string>();
      for (const t of items) {
        const audios = (t?.response?.data ?? []) as ISunoAudio[];
        for (const a of audios) {
          if (a.model) set.add(a.model);
        }
      }
      return Array.from(set).sort();
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
      // Advanced filters: keep tasks where at least one audio matches all active filters
      if (this.activeFilterCount > 0) {
        items = items.filter((task: ISunoTask) => {
          const req: any = task?.request ?? {};
          const audios = (task?.response?.data ?? []) as ISunoAudio[];
          // Type filter (uses request.instrumental)
          if (this.filterType === 'vocal' && req.instrumental === true) return false;
          if (this.filterType === 'instrumental' && req.instrumental !== true) return false;
          // Audio-level filters: at least one audio must match
          if (
            this.filterDuration !== 'all' ||
            this.filterVideo !== 'all' ||
            (this.filterModel && this.filterModel !== 'all')
          ) {
            return audios.some((a) => {
              if (this.filterDuration === 'short' && !(typeof a.duration === 'number' && a.duration < 60)) return false;
              if (
                this.filterDuration === 'medium' &&
                !(typeof a.duration === 'number' && a.duration >= 60 && a.duration <= 180)
              )
                return false;
              if (this.filterDuration === 'long' && !(typeof a.duration === 'number' && a.duration > 180)) return false;
              if (this.filterVideo === 'with' && !a.video_url) return false;
              if (this.filterVideo === 'without' && a.video_url) return false;
              if (this.filterModel && this.filterModel !== 'all' && a.model !== this.filterModel) return false;
              return true;
            });
          }
          return true;
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
    onResetFilters() {
      this.filterType = 'all';
      this.filterDuration = 'all';
      this.filterVideo = 'all';
      this.filterModel = 'all';
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

  .filter-btn {
    flex-shrink: 0;
    white-space: nowrap;
    position: relative;

    &.has-active-filter {
      color: var(--el-color-primary);
      border-color: var(--el-color-primary-light-5);
    }

    .filter-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 16px;
      height: 16px;
      padding: 0 4px;
      margin-left: 4px;
      border-radius: 8px;
      background: var(--el-color-primary);
      color: #fff;
      font-size: 10px;
      line-height: 1;
    }
  }
}

.filter-popover {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .filter-row {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .filter-label {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .filter-actions {
    display: flex;
    justify-content: flex-end;
    border-top: 1px solid var(--el-border-color-lighter);
    padding-top: 8px;
    margin-top: 4px;
  }
}
</style>
