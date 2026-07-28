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
          <redo-icon v-if="!loading" class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
          {{ $t('codingBridge.history.refresh') }}
        </el-button>
      </div>

      <!-- Only worth showing once more than one provider is actually present. -->
      <div v-if="providerOptions.length > 1" class="flex flex-wrap items-center gap-1.5 mb-3">
        <button
          v-for="option in providerOptions"
          :key="option.value"
          type="button"
          class="chip"
          :class="{ 'chip--active': isSelected(option.value) }"
          :aria-pressed="isSelected(option.value)"
          @click="toggle(option.value)"
        >
          <img
            v-if="option.icon"
            :src="option.icon.src"
            class="provider-icon"
            :class="{ 'provider-icon--invert': option.icon.invertOnDark }"
            alt=""
            aria-hidden="true"
          />
          <code-icon v-else class="provider-icon" :size="'1em' as any" aria-hidden="true" focusable="false" />
          <span>{{ option.label }}</span>
          <span class="chip-count">{{ option.count }}</span>
        </button>
        <button v-if="selectedProviders.length" type="button" class="chip-clear" @click="clearFilter">
          {{ $t('codingBridge.history.filterAll') }}
        </button>
      </div>

      <div v-if="!currentNodeId" class="m-auto text-sm text-[var(--app-text-subtle)]">
        {{ $t('codingBridge.session.noDevice') }}
      </div>
      <div v-else-if="loading && !allSessions.length" class="m-auto text-sm text-[var(--app-text-subtle)]">
        {{ $t('codingBridge.history.loading') }}
      </div>
      <div v-else-if="!allSessions.length" class="m-auto text-sm text-[var(--app-text-subtle)] text-center">
        {{ $t('codingBridge.history.empty') }}
      </div>
      <!-- Sessions exist but the filter hides them all — say so, don't claim the
           device has no history. -->
      <div v-else-if="!sessions.length" class="m-auto text-sm text-[var(--app-text-subtle)] text-center">
        <p class="m-0">{{ $t('codingBridge.history.filterEmpty') }}</p>
        <el-button class="mt-2" size="small" round @click="clearFilter">
          {{ $t('codingBridge.history.filterAll') }}
        </el-button>
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
              v-if="providerIcon(item.provider)"
              :src="providerIcon(item.provider)!.src"
              class="provider-icon"
              :class="{ 'provider-icon--invert': providerIcon(item.provider)!.invertOnDark }"
              :alt="providerLabel(item.provider)"
            />
            <code-icon
              v-else
              class="provider-icon"
              :title="providerLabel(item.provider)"
              :size="'1em' as any"
              aria-hidden="true"
              focusable="false"
            />
            <!-- Unread (finished since the user last opened it) is shown by weight
                 alone. 400-vs-700 so the jump reads at 13px; 500 was invisible. The
                 watermark lives on the node, so opening it clears it everywhere. -->
            <span
              class="text-sm truncate flex-1"
              :class="item.unread ? 'font-bold' : 'font-normal'"
              :title="item.unread ? $t('codingBridge.history.unread') : undefined"
              >{{ item.title }}</span
            >
            <!-- Live on the node right now: opening it reattaches to the running
                 session (Stop button + streaming) rather than replaying a copy. -->
            <span v-if="item.running" class="running-dot" :title="$t('codingBridge.history.running')"></span>
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
import { CodeIcon, RedoIcon } from '@acedatacloud/core/icons/components';
import { defineComponent } from 'vue';
import { ElDrawer, ElButton } from 'element-plus';
import { ICodingBridgeHistorySummary, Status } from '@/models';
import claudeIcon from '@/assets/images/logos/claude.svg';
import openaiIcon from '@/assets/images/logos/openai.svg';
import copilotIcon from '@/assets/images/logos/github-copilot.svg';

const PROVIDER_ICONS: Record<string, { src: string; invertOnDark: boolean }> = {
  claude: { src: claudeIcon, invertOnDark: false },
  codex: { src: openaiIcon, invertOnDark: true },
  copilot: { src: copilotIcon, invertOnDark: true }
};

// Chip order; providers not listed here fall in after these, alphabetically.
const PROVIDER_ORDER = ['claude', 'codex', 'copilot'];

interface IProviderOption {
  value: string;
  label: string;
  count: number;
  icon: { src: string; invertOnDark: boolean } | null;
}

export default defineComponent({
  name: 'CodingBridgeHistoryDrawer',
  components: {
    CodeIcon,
    RedoIcon,
    ElDrawer,
    ElButton
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:visible'],
  data() {
    return {
      // Empty = no filter (show every provider).
      selectedProviders: [] as string[]
    };
  },
  computed: {
    currentNodeId(): string | undefined {
      return this.$store.state.codingBridge?.currentNodeId;
    },
    loading(): boolean {
      return this.$store.state.codingBridge?.status?.getHistory === Status.Request;
    },
    allSessions(): ICodingBridgeHistorySummary[] {
      const id = this.currentNodeId;
      const list = id ? (this.$store.state.codingBridge?.history?.[id] ?? []) : [];
      return [...list].sort((a, b) => (b.updated_at ?? 0) - (a.updated_at ?? 0));
    },
    sessions(): ICodingBridgeHistorySummary[] {
      if (!this.selectedProviders.length) {
        return this.allSessions;
      }
      return this.allSessions.filter((item) => this.selectedProviders.includes(item.provider));
    },
    providerOptions(): IProviderOption[] {
      const counts = new Map<string, number>();
      this.allSessions.forEach((item) => {
        counts.set(item.provider, (counts.get(item.provider) ?? 0) + 1);
      });
      return [...counts.entries()]
        .sort(([a], [b]) => {
          const ia = PROVIDER_ORDER.indexOf(a);
          const ib = PROVIDER_ORDER.indexOf(b);
          if (ia !== ib) {
            return (ia < 0 ? PROVIDER_ORDER.length : ia) - (ib < 0 ? PROVIDER_ORDER.length : ib);
          }
          return a.localeCompare(b);
        })
        .map(([value, count]) => ({
          value,
          label: this.providerLabel(value),
          count,
          icon: this.providerIcon(value)
        }));
    }
  },
  watch: {
    visible(value: boolean) {
      if (value && this.currentNodeId) {
        this.$store.dispatch('codingBridge/getHistory', this.currentNodeId);
      }
    },
    // History is per-device; a filter picked for one node means nothing on another.
    currentNodeId() {
      this.selectedProviders = [];
    }
  },
  methods: {
    isSelected(provider: string): boolean {
      return this.selectedProviders.includes(provider);
    },
    toggle(provider: string) {
      this.selectedProviders = this.isSelected(provider)
        ? this.selectedProviders.filter((item) => item !== provider)
        : [...this.selectedProviders, provider];
    },
    clearFilter() {
      this.selectedProviders = [];
    },
    providerLabel(provider: string): string {
      const labels: Record<string, string> = {
        claude: 'Claude Code',
        codex: 'Codex',
        copilot: 'GitHub Copilot'
      };
      return labels[provider] ?? provider;
    },
    providerIcon(provider: string): { src: string; invertOnDark: boolean } | null {
      return PROVIDER_ICONS[provider] ?? null;
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
      if (item.unread) {
        // Watermark what this browser rendered, so anything appended after the
        // listing stays unread. The node replies with a refreshed snapshot.
        this.$store.dispatch('codingBridge/markHistoryRead', {
          node_id: this.currentNodeId,
          provider: item.provider,
          session_id: item.session_id,
          updated_at: item.updated_at
        });
      }
      // Reattach (not just fetch the transcript): if this conversation is still
      // running on the node, this re-pulls its live stream, running state and any
      // blocked permission/AskUserQuestion prompt instead of showing it idle.
      this.$store.dispatch('codingBridge/reattachSession', {
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

.chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 9px;
  border-radius: 9999px;
  border: 1px solid var(--app-border-subtle);
  background: transparent;
  color: var(--app-text-subtle);
  font-size: 12px;
  line-height: 18px;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    color 0.15s ease,
    background-color 0.15s ease;

  &:hover {
    border-color: var(--el-color-primary);
  }

  &--active {
    border-color: var(--el-color-primary);
    color: var(--el-color-primary);
    background: color-mix(in srgb, var(--el-color-primary) 10%, transparent);
  }
}

.chip-count {
  opacity: 0.65;
  font-variant-numeric: tabular-nums;
}

.chip-clear {
  padding: 3px 6px;
  border: none;
  background: transparent;
  color: var(--app-text-subtle);
  font-size: 12px;
  line-height: 18px;
  cursor: pointer;

  &:hover {
    color: var(--el-color-primary);
  }
}

.provider-icon {
  flex: none;
  width: 16px;
  height: 16px;
  object-fit: contain;
}

.running-dot {
  flex: none;
  width: 8px;
  height: 8px;
  border-radius: 9999px;
  background: var(--el-color-success);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-success) 25%, transparent);
}

// The OpenAI glyph ships black; flip it to white on dark backgrounds.
html.dark .provider-icon--invert {
  filter: invert(1);
}
</style>
