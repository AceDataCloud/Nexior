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
            <span>{{ sessionMeta }}</span>
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
            <el-select
              v-model="provider"
              size="small"
              class="w-32"
              :placeholder="$t('codingBridge.session.providerLabel')"
            >
              <el-option v-for="opt in providerOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
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
            <el-select v-model="effort" size="small" class="w-32" :placeholder="$t('codingBridge.session.effortLabel')">
              <el-option v-for="opt in effortOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
            <el-select
              v-model="permissionMode"
              size="small"
              class="w-44"
              :placeholder="$t('codingBridge.session.permissionModeLabel')"
            >
              <el-option v-for="opt in permissionModeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
            <el-input
              v-model="cwd"
              size="small"
              class="flex-1 min-w-[160px]"
              :placeholder="$t('codingBridge.session.cwdPlaceholder')"
              clearable
            >
              <template #append>
                <el-button :title="$t('codingBridge.directory.title')" @click="openDirectory">
                  <font-awesome-icon icon="fa-solid fa-folder-open" />
                </el-button>
              </template>
            </el-input>
          </div>
          <!-- Attached image thumbnails -->
          <div v-if="images.length" class="flex flex-wrap gap-2 mb-2">
            <div
              v-for="(image, index) in images"
              :key="index"
              class="relative w-14 h-14 rounded-md overflow-hidden border border-[var(--app-border-subtle)]"
            >
              <img :src="image" class="w-full h-full object-cover" :alt="$t('codingBridge.session.imageAlt')" />
              <button
                type="button"
                class="absolute top-0 right-0 w-4 h-4 flex items-center justify-center bg-black/55 text-white text-[10px]"
                :title="$t('codingBridge.session.removeImage')"
                @click="removeImage(index)"
              >
                <font-awesome-icon icon="fa-solid fa-xmark" />
              </button>
            </div>
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
              @paste="onPaste"
            />
            <el-button round :title="$t('codingBridge.session.attachImage')" @click="onPickImages">
              <font-awesome-icon icon="fa-solid fa-image" />
            </el-button>
            <el-button v-if="running" round @click="onInterrupt">
              <font-awesome-icon icon="fa-solid fa-stop" />
            </el-button>
            <el-button type="primary" round :disabled="!canSend" @click="onSend">
              {{ $t('codingBridge.session.send') }}
            </el-button>
          </div>
          <input ref="imageInput" type="file" accept="image/*" multiple class="hidden" @change="onImageInputChange" />
          <p class="text-[11px] text-[var(--app-text-subtle)] mt-1 px-1">
            {{ resumeHint ? $t('codingBridge.history.resumeHint') : $t('codingBridge.session.enterHint') }}
          </p>
        </template>
      </div>
    </template>

    <directory-dialog v-model:visible="directoryVisible" :initial-path="cwd" @select="onDirectorySelect" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElInput, ElButton, ElSelect, ElOption, ElMessage } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import TranscriptItem from './TranscriptItem.vue';
import DirectoryDialog from './DirectoryDialog.vue';
import { ICodingBridgeEvent, ICodingBridgeNode, ICodingBridgeSession } from '@/models';

// Mirror the agent's per-image cap (12 MB) and bound how many attach per turn.
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const MAX_IMAGES = 8;

export default defineComponent({
  name: 'CodingBridgeSessionView',
  components: {
    ElInput,
    ElButton,
    ElSelect,
    ElOption,
    FontAwesomeIcon,
    TranscriptItem,
    DirectoryDialog
  },
  emits: ['history'],
  data() {
    return {
      prompt: '',
      cwd: '',
      model: '',
      permissionMode: 'default',
      provider: 'claude',
      effort: '',
      directoryVisible: false,
      images: [] as string[]
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
      return (!!this.prompt.trim() || this.images.length > 0) && this.connected && this.nodeOnline;
    },
    providerOptions(): { label: string; value: string }[] {
      return [
        { label: this.$t('codingBridge.session.providerClaude') as string, value: 'claude' },
        { label: this.$t('codingBridge.session.providerCodex') as string, value: 'codex' }
      ];
    },
    modelOptions(): { label: string; value: string }[] {
      if (this.provider === 'codex') {
        return [
          { label: 'GPT-5 Codex', value: 'gpt-5-codex' },
          { label: 'GPT-5', value: 'gpt-5' },
          { label: 'o3', value: 'o3' }
        ];
      }
      return [
        { label: 'Claude Sonnet', value: 'sonnet' },
        { label: 'Claude Opus', value: 'opus' },
        { label: 'Claude Haiku', value: 'haiku' }
      ];
    },
    effortOptions(): { label: string; value: string }[] {
      const options = [
        { label: this.$t('codingBridge.session.effortDefault') as string, value: '' },
        { label: this.$t('codingBridge.session.effortLow') as string, value: 'low' },
        { label: this.$t('codingBridge.session.effortMedium') as string, value: 'medium' },
        { label: this.$t('codingBridge.session.effortHigh') as string, value: 'high' }
      ];
      // Claude exposes an extra "max" tier; Codex reasoning tops out at "high".
      if (this.provider !== 'codex') {
        options.push({ label: this.$t('codingBridge.session.effortMax') as string, value: 'max' });
      }
      return options;
    },
    permissionModeOptions(): { label: string; value: string }[] {
      return [
        { label: this.$t('codingBridge.session.permissionModeDefault') as string, value: 'default' },
        { label: this.$t('codingBridge.session.permissionModeAcceptEdits') as string, value: 'acceptEdits' },
        { label: this.$t('codingBridge.session.permissionModePlan') as string, value: 'plan' },
        { label: this.$t('codingBridge.session.permissionModeBypass') as string, value: 'bypassPermissions' }
      ];
    },
    sessionMeta(): string {
      const session = this.currentSession;
      if (!session) {
        return '';
      }
      const parts: string[] = [];
      if (session.provider) {
        parts.push(this.providerName(session.provider));
      }
      if (session.cwd) {
        parts.push(session.cwd);
      }
      if (session.model) {
        parts.push(session.model);
      }
      return parts.join(' · ');
    }
  },
  watch: {
    events() {
      this.scrollToBottom();
    },
    currentSessionId() {
      this.scrollToBottom();
    },
    provider() {
      // Model lists and effort tiers differ per backend, so reset both.
      this.model = '';
      this.effort = '';
    }
  },
  methods: {
    providerName(provider: string): string {
      return provider === 'codex'
        ? (this.$t('codingBridge.session.providerCodex') as string)
        : (this.$t('codingBridge.session.providerClaude') as string);
    },
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
        permissionMode: this.permissionMode,
        provider: this.provider,
        effort: this.effort,
        images: this.images.length ? [...this.images] : undefined
      });
      this.prompt = '';
      this.images = [];
    },
    onPaste(event: ClipboardEvent) {
      const items = event.clipboardData?.items;
      if (!items) {
        return;
      }
      const files: File[] = [];
      for (const item of Array.from(items)) {
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            files.push(file);
          }
        }
      }
      if (files.length) {
        event.preventDefault();
        this.addFiles(files);
      }
    },
    onPickImages() {
      (this.$refs.imageInput as HTMLInputElement | undefined)?.click();
    },
    onImageInputChange(event: Event) {
      const input = event.target as HTMLInputElement;
      if (input.files?.length) {
        this.addFiles(Array.from(input.files));
      }
      input.value = '';
    },
    async addFiles(files: File[]) {
      for (const file of files) {
        if (this.images.length >= MAX_IMAGES) {
          ElMessage.warning(this.$t('codingBridge.session.imageLimit', { count: MAX_IMAGES }) as string);
          break;
        }
        if (!file.type.startsWith('image/')) {
          continue;
        }
        if (file.size > MAX_IMAGE_BYTES) {
          ElMessage.warning(this.$t('codingBridge.session.imageTooLarge') as string);
          continue;
        }
        try {
          const dataUrl = await this.readFileAsDataUrl(file);
          this.images.push(dataUrl);
        } catch {
          // Ignore unreadable files rather than failing the whole paste.
        }
      }
    },
    removeImage(index: number) {
      this.images.splice(index, 1);
    },
    readFileAsDataUrl(file: File): Promise<string> {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
    },
    onInterrupt() {
      this.$store.dispatch('codingBridge/interruptSession');
    },
    openDirectory() {
      this.directoryVisible = true;
    },
    onDirectorySelect(path: string) {
      this.cwd = path;
    },
    onNewSession() {
      this.$store.dispatch('codingBridge/newSession');
      this.cwd = '';
      this.model = '';
      this.permissionMode = 'default';
      this.provider = 'claude';
      this.effort = '';
      this.prompt = '';
      this.images = [];
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
