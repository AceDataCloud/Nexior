<template>
  <el-autocomplete
    ref="auto"
    v-model="input"
    :fetch-suggestions="onFetch"
    :placeholder="placeholderText"
    :debounce="350"
    :trigger-on-focus="false"
    :hide-loading="false"
    value-key="value"
    popper-class="user-picker__popper"
    clearable
    @select="onSelect"
    @clear="onClear"
    @input="onInput"
  >
    <template #prefix>
      <el-icon><search-icon /></el-icon>
    </template>
    <template #default="{ item }">
      <div class="user-picker__option" :class="{ 'user-picker__option--empty': item.__empty }">
        <template v-if="item.__empty">
          <el-icon class="user-picker__empty-icon"><warning-filled /></el-icon>
          <span class="user-picker__empty-text">{{ $t('site.message.userNotFound') }}</span>
        </template>
        <template v-else>
          <el-avatar v-if="item.avatar" :src="item.avatar" :size="32" class="user-picker__avatar" />
          <el-avatar v-else :size="32" class="user-picker__avatar">
            <el-icon><user-icon /></el-icon>
          </el-avatar>
          <div class="user-picker__option-text">
            <div class="user-picker__option-name">{{ item.display_name }}</div>
            <div class="user-picker__option-contact">{{ item.contact || shortIdOf(item) }}</div>
          </div>
        </template>
      </div>
    </template>
  </el-autocomplete>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import { ElAutocomplete, ElAvatar, ElIcon } from 'element-plus';
import { Search as SearchIcon, User as UserIcon, WarningFilled } from '@element-plus/icons-vue';
import { userOperator } from '@/operators';
import type { IUserPublic } from '@/models';
import { seedUserChipCache } from '@/components/site/UserChip.vue';

type UserSuggestion = IUserPublic & { value: string; __empty?: false };
type EmptySuggestion = { __empty: true; value: ''; id: '' };
type Suggestion = UserSuggestion | EmptySuggestion;

const EMPTY_SUGGESTION: EmptySuggestion = { __empty: true, value: '', id: '' };

export default defineComponent({
  name: 'UserPicker',
  components: {
    ElAutocomplete,
    ElAvatar,
    ElIcon,
    SearchIcon,
    UserIcon,
    WarningFilled
  },
  props: {
    placeholder: {
      type: String,
      default: ''
    },
    excludeIds: {
      type: Array as PropType<string[]>,
      default: () => []
    }
  },
  emits: ['select'],
  data() {
    return {
      input: ''
    };
  },
  computed: {
    placeholderText(): string {
      return this.placeholder || (this.$t('site.message.editUserHint') as string);
    }
  },
  methods: {
    shortIdOf(item: { id?: string }): string {
      const id = item.id || '';
      return id.length > 8 ? id.slice(0, 8) : id;
    },
    async onFetch(query: string): Promise<Suggestion[]> {
      const q = (query || '').trim();
      if (!q) return [];
      try {
        const res = await userOperator.resolve(q);
        const items: UserSuggestion[] = (res.data || [])
          .filter((u) => !this.excludeIds.includes(u.id))
          .map((u) => {
            seedUserChipCache(u);
            return { ...u, value: u.display_name || u.nickname || this.shortIdOf(u) } as UserSuggestion;
          });
        // The backend (`/users/resolve/`) does exact-match-only on
        // username / email / phone / UUID for privacy. When the query
        // doesn't hit, the API returns []. Without a sentinel the
        // el-autocomplete dropdown stays hidden (it only shows when
        // `suggestions.length > 0`), leaving the user with no feedback
        // — which looked like "the dropdown is broken". Inject a
        // non-selectable empty-state row so the dropdown surfaces
        // `site.message.userNotFound` instead.
        if (items.length === 0) return [EMPTY_SUGGESTION];
        return items;
      } catch {
        // Same UX treatment for network errors: better to show
        // "未找到该用户" than to silently swallow the failure.
        return [EMPTY_SUGGESTION];
      }
    },
    onSelect(item: Record<string, unknown>) {
      // Ignore clicks on the "user not found" sentinel — it is not a
      // real user and selecting it would emit a bogus id.
      if (item && (item as { __empty?: boolean }).__empty) {
        this.input = '';
        return;
      }
      const user = item as unknown as IUserPublic;
      seedUserChipCache(user);
      this.$emit('select', user);
      // Reset input so the picker is ready for another lookup.
      this.input = '';
    },
    onClear() {
      this.input = '';
    },
    onInput() {
      // No-op: the autocomplete's debounced fetch handles it. We just keep
      // the v-model binding so the input is controlled.
    },
    focus() {
      const el = (this.$refs.auto as { focus?: () => void } | undefined)?.focus;
      if (typeof el === 'function') el.call(this.$refs.auto);
    }
  }
});
</script>

<style lang="scss" scoped>
.user-picker__option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 0;
}

.user-picker__option--empty {
  color: var(--el-text-color-secondary);
  font-size: 13px;
  cursor: default;
}

.user-picker__empty-icon {
  font-size: 14px;
  color: var(--el-color-warning);
  flex-shrink: 0;
}

.user-picker__empty-text {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-picker__avatar {
  flex-shrink: 0;
}

.user-picker__option-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.user-picker__option-name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  font-size: 14px;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-picker__option-contact {
  font-size: 12px;
  font-family: var(--el-font-family-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>

<style lang="scss">
.user-picker__popper {
  .el-autocomplete-suggestion__list {
    max-height: 320px;
  }

  .el-autocomplete-suggestion li {
    height: auto;
    line-height: 1.4;
    padding: 6px 12px;
  }
}
</style>
