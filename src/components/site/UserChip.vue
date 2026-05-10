<template>
  <span class="user-chip" :class="{ 'is-empty': !userId, 'is-missing': !!userId && state === 'missing' }">
    <template v-if="!userId">
      <span class="user-chip__placeholder">—</span>
    </template>
    <template v-else-if="state === 'loading'">
      <span class="user-chip__id" :title="userId">{{ shortId }}</span>
    </template>
    <template v-else-if="state === 'missing'">
      <el-icon class="user-chip__icon">
        <warning-filled />
      </el-icon>
      <span class="user-chip__id" :title="userId">{{ shortId }}</span>
    </template>
    <template v-else>
      <el-avatar v-if="user?.avatar" :src="user.avatar" :size="22" class="user-chip__avatar" />
      <el-avatar v-else :size="22" class="user-chip__avatar">
        <el-icon><user-icon /></el-icon>
      </el-avatar>
      <span class="user-chip__name" :title="userId">{{ user?.display_name || shortId }}</span>
      <el-icon v-if="methodIcon" class="user-chip__icon" :title="methodLabel">
        <component :is="methodIcon" />
      </el-icon>
      <span v-if="user?.contact" class="user-chip__contact">{{ user.contact }}</span>
    </template>
  </span>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import { ElAvatar, ElIcon } from 'element-plus';
import {
  User as UserIcon,
  Message,
  Iphone,
  ChatDotRound,
  Promotion,
  Link as LinkIcon,
  WarningFilled
} from '@element-plus/icons-vue';
import { userOperator } from '@/operators';
import type { IUserPublic, IUserPublicRegistrationMethod } from '@/models';

type ChipState = 'loading' | 'ready' | 'missing';

// Module-level cache so the same UUID rendered in many chips only fetches once.
const cache = new Map<string, IUserPublic>();
const inflight = new Map<string, Promise<IUserPublic | null>>();
// Negative cache: ids we already saw 404 for. Stops endless retries.
const missing = new Set<string>();

async function resolveUser(id: string): Promise<IUserPublic | null> {
  if (cache.has(id)) return cache.get(id) as IUserPublic;
  if (missing.has(id)) return null;
  let promise = inflight.get(id);
  if (!promise) {
    promise = userOperator
      .resolve({ id })
      .then((res) => {
        cache.set(id, res.data);
        return res.data;
      })
      .catch(() => {
        missing.add(id);
        return null;
      })
      .finally(() => {
        inflight.delete(id);
      });
    inflight.set(id, promise);
  }
  return promise;
}

const METHOD_ICONS: Record<IUserPublicRegistrationMethod, unknown> = {
  email: Message,
  phone: Iphone,
  github: LinkIcon,
  google: Promotion,
  wechat: ChatDotRound,
  username: UserIcon,
  unknown: UserIcon
};

export default defineComponent({
  name: 'UserChip',
  components: {
    ElAvatar,
    ElIcon,
    UserIcon,
    Message,
    Iphone,
    ChatDotRound,
    Promotion,
    LinkIcon,
    WarningFilled
  },
  props: {
    userId: {
      type: String as PropType<string | undefined>,
      default: ''
    }
  },
  data() {
    return {
      user: null as IUserPublic | null,
      state: 'loading' as ChipState
    };
  },
  computed: {
    shortId(): string {
      const id = this.userId || '';
      return id.length > 8 ? id.slice(0, 8) : id;
    },
    methodIcon(): unknown {
      const method = this.user?.registration_method;
      if (!method) return null;
      return METHOD_ICONS[method] || null;
    },
    methodLabel(): string {
      const method = this.user?.registration_method;
      if (!method) return '';
      const key = `site.label.method.${method}`;
      const translated = this.$t(key);
      // i18n returns the key itself if missing — fall back to the raw method.
      return translated === key ? method : (translated as string);
    }
  },
  watch: {
    userId: {
      immediate: true,
      handler(newId: string) {
        this.load(newId);
      }
    }
  },
  methods: {
    async load(id: string) {
      if (!id) {
        this.user = null;
        this.state = 'ready';
        return;
      }
      if (cache.has(id)) {
        this.user = cache.get(id) as IUserPublic;
        this.state = 'ready';
        return;
      }
      if (missing.has(id)) {
        this.user = null;
        this.state = 'missing';
        return;
      }
      this.state = 'loading';
      const result = await resolveUser(id);
      // Guard against the prop changing while we awaited.
      if (this.userId !== id) return;
      if (result) {
        this.user = result;
        this.state = 'ready';
      } else {
        this.user = null;
        this.state = 'missing';
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.user-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
  font-size: 13px;
  line-height: 1.4;
  color: var(--el-text-color-regular);

  &.is-empty {
    color: var(--el-text-color-secondary);
  }

  &.is-missing {
    color: var(--el-text-color-secondary);
    font-style: italic;
  }

  .user-chip__avatar {
    flex-shrink: 0;
  }

  .user-chip__name {
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 160px;
  }

  .user-chip__icon {
    font-size: 14px;
    color: var(--el-text-color-secondary);
    flex-shrink: 0;
  }

  .user-chip__contact {
    color: var(--el-text-color-secondary);
    font-size: 12px;
    font-family: var(--el-font-family-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
    white-space: nowrap;
  }

  .user-chip__id {
    font-family: var(--el-font-family-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
    font-size: 12px;
  }
}
</style>
