<template>
  <el-drawer
    :model-value="visible"
    direction="rtl"
    size="380px"
    :title="$t('codingBridge.history.title')"
    @update:model-value="$emit('update:visible', $event)"
  >
    <div class="flex flex-col h-full">
      <div class="flex items-center justify-between mb-3">
        <p class="text-xs text-[var(--app-text-subtle)] m-0">
          {{ $t('codingBridge.history.intro') }}
        </p>
        <el-button size="small" round :loading="loading" @click="refresh">
          <font-awesome-icon v-if="!loading" icon="fa-solid fa-rotate-right" class="mr-1" />
          {{ $t('codingBridge.history.refresh') }}
        </el-button>
      </div>

      <div v-if="!currentNodeId" class="m-auto text-sm text-[var(--app-text-subtle)]">
        {{ $t('codingBridge.session.noDevice') }}
      </div>
      <div v-else-if="loading && !sessions.length" class="m-auto text-sm text-[var(--app-text-subtle)]">
        {{ $t('codingBridge.history.loading') }}
      </div>
      <div v-else-if="!sessions.length" class="m-auto text-sm text-[var(--app-text-subtle)] text-center">
        {{ $t('codingBridge.history.empty') }}
      </div>

      <ul v-else class="list-none m-0 p-0 flex-1 overflow-y-auto flex flex-col gap-2">
        <li
          v-for="item in sessions"
          :key="item.provider + ':' + item.session_id"
          class="item rounded-lg p-3 cursor-pointer border border-[var(--app-border-subtle)]"
          @click="open(item)"
        >
          <div class="flex items-center gap-2 mb-1">
            <img
              :src="providerIcon(item.provider).src"
              class="provider-icon"
              :class="{ 'provider-icon--invert': providerIcon(item.provider).invertOnDark }"
              :alt="item.provider === 'codex' ? 'Codex' : 'Claude'"
            />
            <span class="text-sm font-medium truncate flex-1">{{ item.title }}</span>
          </div>
          <div class="text-[11px] text-[var(--app-text-subtle)] truncate">
            <span v-if="item.cwd">{{ item.cwd }}</span>
            <span v-if="item.git_branch"> · {{ item.git_branch }}</span>
          </div>
          <div class="text-[11px] text-[var(--app-text-subtle)] mt-0.5">
            <span v-if="item.updated_at">{{ formatTime(item.updated_at) }}</span>
            <span v-if="item.message_count">
              · {{ $t('codingBridge.history.messages', { count: item.message_count }) }}</span
            >
          </div>
        </li>
      </ul>
    </div>
  </el-drawer>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElDrawer, ElButton } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { ICodingBridgeHistorySummary, Status } from '@/models';
import claudeIcon from '@/assets/images/logos/claude.svg';
import openaiIcon from '@/assets/images/logos/openai.svg';

const PROVIDER_ICONS: Record<string, { src: string; invertOnDark: boolean }> = {
  claude: { src: claudeIcon, invertOnDark: false },
  codex: { src: openaiIcon, invertOnDark: true }
};

export default defineComponent({
  name: 'CodingBridgeHistoryDrawer',
  components: {
    ElDrawer,
    ElButton,
    FontAwesomeIcon
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:visible'],
  computed: {
    currentNodeId(): string | undefined {
      return this.$store.state.codingBridge?.currentNodeId;
    },
    loading(): boolean {
      return this.$store.state.codingBridge?.status?.getHistory === Status.Request;
    },
    sessions(): ICodingBridgeHistorySummary[] {
      const id = this.currentNodeId;
      const list = id ? (this.$store.state.codingBridge?.history?.[id] ?? []) : [];
      return [...list].sort((a, b) => (b.updated_at ?? 0) - (a.updated_at ?? 0));
    }
  },
  watch: {
    visible(value: boolean) {
      if (value && this.currentNodeId) {
        this.$store.dispatch('codingBridge/getHistory', this.currentNodeId);
      }
    }
  },
  methods: {
    providerIcon(provider: string): { src: string; invertOnDark: boolean } {
      return PROVIDER_ICONS[provider] ?? PROVIDER_ICONS.claude;
    },
    refresh() {
      if (this.currentNodeId) {
        this.$store.dispatch('codingBridge/getHistory', this.currentNodeId);
      }
    },
    open(item: ICodingBridgeHistorySummary) {
      if (!this.currentNodeId) {
        return;
      }
      this.$store.dispatch('codingBridge/getHistoryDetail', {
        node_id: this.currentNodeId,
        provider: item.provider,
        session_id: item.session_id
      });
      this.$emit('update:visible', false);
    },
    formatTime(ts: number): string {
      try {
        return new Date(ts).toLocaleString();
      } catch {
        return '';
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.item {
  transition: border-color 0.15s ease;
  &:hover {
    border-color: var(--el-color-primary);
  }
}

.provider-icon {
  flex: none;
  width: 16px;
  height: 16px;
  object-fit: contain;
}

// The OpenAI glyph ships black; flip it to white on dark backgrounds.
html.dark .provider-icon--invert {
  filter: invert(1);
}
</style>
