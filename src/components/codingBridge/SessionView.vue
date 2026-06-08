<template>
  <div class="session-view flex flex-col h-full bg-[var(--app-content-bg)]">
    <!-- Empty: no device selected -->
    <div
      v-if="!currentNode"
      class="flex-1 flex flex-col items-center justify-center text-center p-8 text-[var(--app-text-subtle)]"
    >
      <font-awesome-icon icon="fa-solid fa-laptop-code" class="text-4xl mb-3" />
      <p class="text-sm">{{ $t('codingBridge.session.noDevice') }}</p>
    </div>

    <template v-else>
      <!-- Header -->
      <div class="flex items-center justify-between gap-3 px-5 py-3 border-b border-[var(--app-border-subtle)]">
        <div class="min-w-0">
          <div class="flex items-center gap-2 font-medium">
            <span class="truncate">{{ currentNode.name }}</span>
            <span
              class="inline-block w-2 h-2 rounded-full flex-none"
              :class="nodeOnline ? 'bg-[var(--el-color-success)]' : 'bg-[var(--app-text-subtle)]'"
            />
          </div>
          <div v-if="currentSession" class="text-xs text-[var(--app-text-subtle)] truncate">
            <span v-if="currentSession.cwd">{{ currentSession.cwd }}</span>
            <span v-if="currentSession.model"> · {{ currentSession.model }}</span>
            <span v-if="replayLabel" class="text-[var(--el-color-primary)]"> · {{ replayLabel }}</span>
          </div>
        </div>
        <div class="flex items-center gap-2 flex-none">
          <el-button size="small" round @click="$emit('history')">
            <font-awesome-icon icon="fa-solid fa-clock-rotate-left" class="mr-1" />
            {{ $t('codingBridge.history.button') }}
          </el-button>
          <el-button v-if="currentSessionId" size="small" round @click="onNewSession">
            <font-awesome-icon icon="fa-solid fa-plus" class="mr-1" />
            {{ $t('codingBridge.session.newSession') }}
          </el-button>
        </div>
      </div>

      <!-- Offline warning -->
      <div
        v-if="!nodeOnline"
        class="px-5 py-2 text-xs bg-[var(--el-color-warning-light-9)] text-[var(--el-color-warning)] border-b border-[var(--app-border-subtle)]"
      >
        {{ $t('codingBridge.session.deviceOffline') }}
      </div>

      <!-- Transcript -->
      <div ref="transcript" class="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
        <div v-if="!events.length" class="m-auto text-center text-sm text-[var(--app-text-subtle)]">
          {{ $t('codingBridge.session.startHint') }}
        </div>
        <transcript-item v-for="event in events" :key="event.id" :event="event" />
      </div>

      <!-- Composer -->
      <div class="border-t border-[var(--app-border-subtle)] p-3">
        <!-- Read-only replay (e.g. Codex history cannot be resumed). -->
        <div v-if="readonly" class="flex items-center gap-2 text-xs text-[var(--app-text-subtle)] px-1 py-2">
          <font-awesome-icon icon="fa-solid fa-eye" />
          <span>{{ $t('codingBridge.history.readonly') }}</span>
          <el-button class="ml-auto" size="small" round @click="onNewSession">
            {{ $t('codingBridge.session.newSession') }}
          </el-button>
        </div>
        <template v-else>
          <div v-if="isNewSession" class="flex flex-wrap gap-2 mb-2">
            <el-input
              v-model="cwd"
              size="small"
              class="flex-1 min-w-[160px]"
              :placeholder="$t('codingBridge.session.cwdPlaceholder')"
              clearable
            />
            <el-select
              v-model="model"
              size="small"
              filterable
              allow-create
              default-first-option
              clearable
              class="w-40"
              :placeholder="$t('codingBridge.session.modelPlaceholder')"
            >
              <el-option v-for="opt in modelOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
            <el-select
              v-model="permissionMode"
              size="small"
              class="w-44"
              :placeholder="$t('codingBridge.session.permissionModeLabel')"
            >
              <el-option v-for="opt in permissionModeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </div>
          <div class="flex items-end gap-2">
            <el-input
              v-model="prompt"
              type="textarea"
              :autosize="{ minRows: 3, maxRows: 12 }"
              resize="none"
              class="flex-1"
              :placeholder="$t('codingBridge.session.promptPlaceholder')"
              @keydown.enter="onComposerEnter"
            />
            <el-button v-if="running" round @click="onInterrupt">
              <font-awesome-icon icon="fa-solid fa-stop" />
            </el-button>
            <el-button type="primary" round :disabled="!canSend" @click="onSend">
              {{ $t('codingBridge.session.send') }}
            </el-button>
          </div>
          <p class="text-[11px] text-[var(--app-text-subtle)] mt-1 px-1">
            {{ resumeHint ? $t('codingBridge.history.resumeHint') : $t('codingBridge.session.enterHint') }}
          </p>
        </template>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElInput, ElButton, ElSelect, ElOption } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import TranscriptItem from './TranscriptItem.vue';
import { ICodingBridgeEvent, ICodingBridgeNode, ICodingBridgeSession } from '@/models';

export default defineComponent({
  name: 'CodingBridgeSessionView',
  components: {
    ElInput,
    ElButton,
    ElSelect,
    ElOption,
    FontAwesomeIcon,
    TranscriptItem
  },
  emits: ['history'],
  data() {
    return {
      prompt: '',
      cwd: '',
      model: '',
      permissionMode: 'default'
    };
  },
  computed: {
    currentNodeId(): string | undefined {
      return this.$store.state.codingBridge?.currentNodeId;
    },
    currentNode(): ICodingBridgeNode | undefined {
      return this.$store.state.codingBridge?.nodes?.find((node) => node.node_id === this.currentNodeId);
    },
    nodeOnline(): boolean {
      return this.currentNode?.status === 'online';
    },
    currentSessionId(): string | undefined {
      return this.$store.state.codingBridge?.currentSessionId;
    },
    currentSession(): ICodingBridgeSession | undefined {
      const id = this.currentSessionId;
      return id ? this.$store.state.codingBridge?.sessions?.[id] : undefined;
    },
    events(): ICodingBridgeEvent[] {
      const id = this.currentSessionId;
      return id ? (this.$store.state.codingBridge?.events?.[id] ?? []) : [];
    },
    isNewSession(): boolean {
      return !this.currentSessionId;
    },
    readonly(): boolean {
      return this.currentSession?.readonly === true;
    },
    // A history conversation that has been opened but not yet resumed.
    resumeHint(): boolean {
      return !!this.currentSession?.provider && !this.currentSession?.started && !this.readonly;
    },
    replayLabel(): string {
      if (!this.currentSession?.provider || this.currentSession?.started) {
        return '';
      }
      return this.currentSession.provider === 'codex'
        ? (this.$t('codingBridge.history.codexLabel') as string)
        : (this.$t('codingBridge.history.claudeLabel') as string);
    },
    running(): boolean {
      const status = this.currentSession?.status;
      return status === 'running' || status === 'starting';
    },
    connected(): boolean {
      return this.$store.state.codingBridge?.connection === 'connected';
    },
    canSend(): boolean {
      return !!this.prompt.trim() && this.connected && this.nodeOnline;
    },
    modelOptions(): { label: string; value: string }[] {
      return [
        { label: 'Claude Sonnet', value: 'sonnet' },
        { label: 'Claude Opus', value: 'opus' },
        { label: 'Claude Haiku', value: 'haiku' }
      ];
    },
    permissionModeOptions(): { label: string; value: string }[] {
      return [
        { label: this.$t('codingBridge.session.permissionModeDefault') as string, value: 'default' },
        { label: this.$t('codingBridge.session.permissionModeAcceptEdits') as string, value: 'acceptEdits' },
        { label: this.$t('codingBridge.session.permissionModePlan') as string, value: 'plan' },
        { label: this.$t('codingBridge.session.permissionModeBypass') as string, value: 'bypassPermissions' }
      ];
    }
  },
  watch: {
    events() {
      this.scrollToBottom();
    },
    currentSessionId() {
      this.scrollToBottom();
    }
  },
  methods: {
    onComposerEnter(event: KeyboardEvent | Event) {
      // Ignore Enter while an IME (e.g. pinyin) composition is active so that
      // confirming candidates never sends the message. Modifier+Enter inserts
      // a newline instead of sending.
      const e = event as KeyboardEvent;
      if (e.isComposing || e.keyCode === 229) {
        return;
      }
      if (e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }
      e.preventDefault();
      this.onSend();
    },
    onSend() {
      if (!this.canSend) {
        return;
      }
      this.$store.dispatch('codingBridge/sendPrompt', {
        prompt: this.prompt,
        cwd: this.cwd,
        model: this.model,
        permissionMode: this.permissionMode
      });
      this.prompt = '';
    },
    onInterrupt() {
      this.$store.dispatch('codingBridge/interruptSession');
    },
    onNewSession() {
      this.$store.dispatch('codingBridge/newSession');
      this.cwd = '';
      this.model = '';
      this.permissionMode = 'default';
      this.prompt = '';
    },
    scrollToBottom() {
      this.$nextTick(() => {
        const el = this.$refs.transcript as HTMLElement | undefined;
        if (el) {
          el.scrollTop = el.scrollHeight;
        }
      });
    }
  }
});
</script>
