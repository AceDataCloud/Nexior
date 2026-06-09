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
          <div class="rounded-lg border border-[var(--app-border-subtle)] bg-[var(--app-content-bg)] px-3 py-2">
            <div class="flex flex-wrap items-center gap-1.5 pb-2">
              <button
                v-for="chip in configChips"
                :key="chip.key"
                type="button"
                class="max-w-[220px] truncate rounded-full border border-[var(--app-border-subtle)] px-2.5 py-1 text-[11px] text-[var(--app-text-subtle)] hover:border-[var(--el-color-primary-light-5)] hover:text-[var(--el-color-primary)]"
                :disabled="!isNewSession"
                @click="settingsVisible = isNewSession"
              >
                <font-awesome-icon :icon="chip.icon" class="mr-1" />
                {{ chip.label }}
              </button>
            </div>

            <div v-if="attachmentFileList.length" class="flex flex-wrap gap-2 pb-2">
              <div
                v-for="(file, index) in attachmentFileList"
                :key="(file as any).uid || file.name || index"
                class="group relative flex max-w-[220px] items-center gap-2 rounded-md border border-[var(--app-border-subtle)] bg-[var(--app-sidebar-bg)] px-2 py-1.5 text-xs"
              >
                <img
                  v-if="attachmentPreviewUrl(file)"
                  :src="attachmentPreviewUrl(file)"
                  class="h-8 w-8 rounded object-cover"
                  :alt="$t('codingBridge.session.attachmentImageAlt')"
                />
                <span v-else class="flex h-8 w-8 items-center justify-center rounded bg-[var(--app-content-bg)]">
                  <font-awesome-icon icon="fa-solid fa-file" />
                </span>
                <span class="min-w-0 flex-1 truncate" :title="file.name">{{ file.name }}</span>
                <span v-if="isAttachmentUploading(file)" class="text-[10px] text-[var(--app-text-subtle)]">
                  {{ Math.round(file.percentage || 0) }}%
                </span>
                <button
                  type="button"
                  class="flex h-5 w-5 items-center justify-center rounded-full text-[var(--app-text-subtle)] hover:bg-[var(--app-content-hover-bg)] hover:text-[var(--el-color-danger)]"
                  :title="$t('codingBridge.session.removeAttachment')"
                  @click="removeAttachment(index, file)"
                >
                  <font-awesome-icon icon="fa-solid fa-xmark" />
                </button>
              </div>
            </div>

            <div class="flex items-end gap-2">
              <el-popover
                v-if="isNewSession"
                v-model:visible="settingsVisible"
                trigger="click"
                placement="top-start"
                width="460"
                popper-class="coding-bridge-settings-popover"
              >
                <template #reference>
                  <el-button circle :title="$t('codingBridge.session.settings')">
                    <font-awesome-icon icon="fa-solid fa-gear" />
                  </el-button>
                </template>
                <div class="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  <label class="flex flex-col gap-1">
                    <span class="text-xs font-medium text-[var(--app-text-subtle)]">
                      {{ $t('codingBridge.session.providerLabel') }}
                    </span>
                    <el-select v-model="provider" size="small">
                      <el-option
                        v-for="opt in providerOptions"
                        :key="opt.value"
                        :label="opt.label"
                        :value="opt.value"
                      />
                    </el-select>
                  </label>
                  <label class="flex flex-col gap-1">
                    <span class="text-xs font-medium text-[var(--app-text-subtle)]">
                      {{ $t('codingBridge.session.modelPlaceholder') }}
                    </span>
                    <el-select
                      v-model="model"
                      size="small"
                      filterable
                      :allow-create="allowCustomModel"
                      default-first-option
                      clearable
                    >
                      <el-option v-for="opt in modelOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
                    </el-select>
                  </label>
                  <label class="flex flex-col gap-1">
                    <span class="text-xs font-medium text-[var(--app-text-subtle)]">
                      {{ $t('codingBridge.session.effortLabel') }}
                    </span>
                    <el-select v-model="effort" size="small">
                      <el-option v-for="opt in effortOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
                    </el-select>
                  </label>
                  <label class="flex flex-col gap-1">
                    <span class="text-xs font-medium text-[var(--app-text-subtle)]">
                      {{ $t('codingBridge.session.permissionModeLabel') }}
                    </span>
                    <el-select v-model="permissionMode" size="small">
                      <el-option
                        v-for="opt in permissionModeOptions"
                        :key="opt.value"
                        :label="opt.label"
                        :value="opt.value"
                      />
                    </el-select>
                  </label>
                  <label class="col-span-1 flex flex-col gap-1 sm:col-span-2">
                    <span class="text-xs font-medium text-[var(--app-text-subtle)]">
                      {{ $t('codingBridge.session.cwdPlaceholder') }}
                    </span>
                    <el-input v-model="cwd" size="small" clearable>
                      <template #append>
                        <el-button :title="$t('codingBridge.directory.title')" @click="openDirectory">
                          <font-awesome-icon icon="fa-solid fa-folder-open" />
                        </el-button>
                      </template>
                    </el-input>
                  </label>
                </div>
              </el-popover>
              <el-button v-else circle :disabled="true" :title="$t('codingBridge.session.settingsLocked')">
                <font-awesome-icon icon="fa-solid fa-gear" />
              </el-button>
              <el-upload
                ref="uploader"
                v-model:file-list="attachmentFileList"
                class="h-0 w-0 overflow-hidden opacity-0"
                name="file"
                :action="uploadUrl"
                :headers="headers"
                :multiple="true"
                :limit="maxAttachments"
                :show-file-list="false"
                :before-upload="beforeAttachmentUpload"
                :on-change="onAttachmentChange"
                :on-success="onAttachmentSuccess"
                :on-error="onAttachmentError"
                :on-exceed="onAttachmentExceed"
              >
                <span ref="attachmentUploadTrigger" class="block h-0 w-0" aria-hidden="true"></span>
              </el-upload>
              <el-button circle :title="$t('codingBridge.session.attachFile')" @click="onTriggerAttachmentUpload">
                <font-awesome-icon icon="fa-solid fa-paperclip" />
              </el-button>
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
          </div>
          <p class="text-[11px] text-[var(--app-text-subtle)] mt-1 px-1">
            {{ composerHint }}
          </p>
        </template>
      </div>
    </template>

    <directory-dialog v-model:visible="directoryVisible" :initial-path="cwd" @select="onDirectorySelect" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import {
  ElInput,
  ElButton,
  ElSelect,
  ElOption,
  ElMessage,
  ElPopover,
  ElUpload,
  UploadFile,
  UploadFiles
} from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import TranscriptItem from './TranscriptItem.vue';
import DirectoryDialog from './DirectoryDialog.vue';
import { getBaseUrlPlatform, pasteUploadMixin } from '@/utils';
import {
  ICodingBridgeAttachment,
  ICodingBridgeCapabilities,
  ICodingBridgeEvent,
  ICodingBridgeNode,
  ICodingBridgeProviderCapability,
  ICodingBridgeSession
} from '@/models';

const MAX_ATTACHMENT_BYTES = 50 * 1024 * 1024;
const MAX_ATTACHMENTS = 10;

type ConfigChip = { key: string; label: string; icon: string };

export default defineComponent({
  name: 'CodingBridgeSessionView',
  components: {
    ElInput,
    ElButton,
    ElSelect,
    ElOption,
    ElPopover,
    ElUpload,
    FontAwesomeIcon,
    TranscriptItem,
    DirectoryDialog
  },
  mixins: [pasteUploadMixin],
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
      settingsVisible: false,
      attachmentFileList: [] as UploadFiles,
      uploadUrl: getBaseUrlPlatform() + '/api/v1/files/',
      maxAttachments: MAX_ATTACHMENTS
    };
  },
  computed: {
    headers(): Record<string, string> {
      return {
        Authorization: `Bearer ${this.$store.state.token.access}`
      };
    },
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
    attachments(): ICodingBridgeAttachment[] {
      return (this.attachmentFileList || [])
        .map((file: UploadFile) => {
          const response = file.response as { file_url?: string } | undefined;
          const url =
            response?.file_url || (typeof file.url === 'string' && !file.url.startsWith('blob:') ? file.url : '');
          if (!url) {
            return undefined;
          }
          const raw = file.raw as File | undefined;
          const mime = raw?.type || (file as any).mime_type || '';
          return {
            type: this.isImageAttachment(file) ? 'image' : 'file',
            url,
            name: file.name,
            mime_type: mime,
            size: raw?.size
          } as ICodingBridgeAttachment;
        })
        .filter((item: ICodingBridgeAttachment | undefined): item is ICodingBridgeAttachment => !!item);
    },
    uploadingAttachments(): boolean {
      return (this.attachmentFileList || []).some((file: UploadFile) => this.isAttachmentUploading(file));
    },
    canSend(): boolean {
      return (
        (!!this.prompt.trim() || this.attachments.length > 0) &&
        !this.uploadingAttachments &&
        this.connected &&
        this.nodeOnline
      );
    },
    composerHint(): string {
      if (this.uploadingAttachments) {
        return this.$t('codingBridge.session.uploadingAttachment') as string;
      }
      return this.resumeHint
        ? (this.$t('codingBridge.history.resumeHint') as string)
        : (this.$t('codingBridge.session.enterHint') as string);
    },
    configChips(): ConfigChip[] {
      if (!this.isNewSession && this.currentSession) {
        const chips: ConfigChip[] = [
          {
            key: 'session-provider',
            label: this.providerName(this.currentSession.provider || 'claude'),
            icon: 'fa-solid fa-code'
          }
        ];
        if (this.currentSession.model) {
          chips.push({ key: 'session-model', label: this.currentSession.model, icon: 'fa-solid fa-brain' });
        }
        if (this.currentSession.cwd) {
          chips.push({ key: 'session-cwd', label: this.currentSession.cwd, icon: 'fa-solid fa-folder-open' });
        }
        return chips;
      }
      return [
        { key: 'provider', label: this.providerName(this.provider), icon: 'fa-solid fa-code' },
        {
          key: 'model',
          label: this.model || (this.$t('codingBridge.session.modelDefault') as string),
          icon: 'fa-solid fa-brain'
        },
        { key: 'effort', label: this.effortLabel(this.effort), icon: 'fa-solid fa-gauge-high' },
        {
          key: 'permission',
          label: this.permissionModeLabel(this.permissionMode),
          icon: 'fa-solid fa-shield-halved'
        },
        {
          key: 'cwd',
          label: this.cwd || (this.$t('codingBridge.session.cwdDefault') as string),
          icon: 'fa-solid fa-folder-open'
        }
      ];
    },
    // Everything below is sourced from the node's `capabilities.get` so the UI
    // never hard-codes providers / models / efforts. The fallbacks only apply
    // before capabilities have loaded (or for an offline node).
    nodeCapabilities(): ICodingBridgeCapabilities | undefined {
      const id = this.currentNodeId;
      return id ? this.$store.state.codingBridge?.capabilities?.[id] : undefined;
    },
    providerCaps(): ICodingBridgeProviderCapability[] {
      return this.nodeCapabilities?.providers ?? [];
    },
    currentProviderCap(): ICodingBridgeProviderCapability | undefined {
      return this.providerCaps.find((cap) => cap.name === this.provider);
    },
    providerOptions(): { label: string; value: string }[] {
      if (this.providerCaps.length) {
        return this.providerCaps.map((cap) => ({ value: cap.name, label: cap.label }));
      }
      return [
        { label: this.$t('codingBridge.session.providerClaude') as string, value: 'claude' },
        { label: this.$t('codingBridge.session.providerCodex') as string, value: 'codex' }
      ];
    },
    modelOptions(): { label: string; value: string }[] {
      return this.currentProviderCap?.models ?? [];
    },
    // Free-typed models stay allowed by default so a brand-new model always works.
    allowCustomModel(): boolean {
      return this.currentProviderCap?.allow_custom_model ?? true;
    },
    effortOptions(): { label: string; value: string }[] {
      const efforts = this.currentProviderCap?.efforts;
      const tokens = efforts && efforts.length ? efforts : [''];
      return tokens.map((token) => ({ value: token, label: this.effortLabel(token) }));
    },
    permissionModeOptions(): { label: string; value: string }[] {
      const modes = this.currentProviderCap?.permission_modes;
      const tokens = modes && modes.length ? modes : ['default', 'acceptEdits', 'plan', 'bypassPermissions'];
      return tokens.map((token) => ({ value: token, label: this.permissionModeLabel(token) }));
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
    currentNodeId() {
      // Refresh capabilities when switching devices.
      this.requestCapabilities();
    },
    providerCaps() {
      // If the picked backend isn't offered by this node, fall back to the
      // first one it reports so the model list always matches.
      if (this.providerCaps.length && !this.providerCaps.some((cap) => cap.name === this.provider)) {
        this.provider = this.providerCaps[0].name;
      }
    },
    provider() {
      // Model lists and effort tiers differ per backend, so reset both.
      this.model = '';
      this.effort = '';
    }
  },
  mounted() {
    this.requestCapabilities();
  },
  methods: {
    requestCapabilities() {
      if (this.currentNodeId) {
        this.$store.dispatch('codingBridge/getCapabilities', this.currentNodeId);
      }
    },
    // Localize a known effort token; show the raw token for anything new so a
    // node can introduce a tier without a web release.
    effortLabel(token: string): string {
      const keys: Record<string, string> = {
        '': 'codingBridge.session.effortDefault',
        low: 'codingBridge.session.effortLow',
        medium: 'codingBridge.session.effortMedium',
        high: 'codingBridge.session.effortHigh',
        max: 'codingBridge.session.effortMax'
      };
      const key = keys[token];
      return key ? (this.$t(key) as string) : token;
    },
    permissionModeLabel(token: string): string {
      const keys: Record<string, string> = {
        default: 'codingBridge.session.permissionModeDefault',
        acceptEdits: 'codingBridge.session.permissionModeAcceptEdits',
        plan: 'codingBridge.session.permissionModePlan',
        bypassPermissions: 'codingBridge.session.permissionModeBypass'
      };
      const key = keys[token];
      return key ? (this.$t(key) as string) : token;
    },
    providerName(provider: string): string {
      const cap = this.providerCaps.find((item) => item.name === provider);
      if (cap) {
        return cap.label;
      }
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
      const attachments = this.attachments;
      this.$store.dispatch('codingBridge/sendPrompt', {
        prompt: this.prompt,
        cwd: this.cwd,
        model: this.model,
        permissionMode: this.permissionMode,
        provider: this.provider,
        effort: this.effort,
        attachments: attachments.length ? attachments : undefined
      });
      this.prompt = '';
      this.clearAttachments();
    },
    beforeAttachmentUpload(file: File): boolean {
      if (this.attachmentFileList.length >= MAX_ATTACHMENTS) {
        ElMessage.warning(this.$t('codingBridge.session.attachmentLimit', { count: MAX_ATTACHMENTS }) as string);
        return false;
      }
      if (file.size > MAX_ATTACHMENT_BYTES) {
        ElMessage.warning(this.$t('codingBridge.session.attachmentTooLarge') as string);
        return false;
      }
      return true;
    },
    onAttachmentChange(file: UploadFile) {
      if (!file.url && file.raw && this.isImageAttachment(file)) {
        try {
          file.url = URL.createObjectURL(file.raw);
        } catch {
          // ignore preview failures
        }
      }
    },
    onAttachmentSuccess(response: { file_url?: string } | undefined, file: UploadFile) {
      if (response?.file_url) {
        this.revokeBlobUrl(file);
        file.url = response.file_url;
        file.response = response;
      }
    },
    onAttachmentError() {
      ElMessage.error(this.$t('codingBridge.session.attachmentUploadError') as string);
    },
    onAttachmentExceed() {
      ElMessage.warning(this.$t('codingBridge.session.attachmentLimit', { count: MAX_ATTACHMENTS }) as string);
    },
    onTriggerAttachmentUpload() {
      // Open the native picker owned by el-upload to avoid trigger-slot edge cases.
      this.$nextTick(() => {
        const root = (this.$refs.uploader as any)?.$el as HTMLElement | undefined;
        const input =
          (root?.querySelector('input.el-upload__input') as HTMLInputElement | null) ||
          (root?.querySelector('input[type="file"]') as HTMLInputElement | null);
        input?.click();
      });
    },
    isAttachmentUploading(file: UploadFile): boolean {
      return file.status === 'ready' || file.status === 'uploading';
    },
    isImageAttachment(file: UploadFile): boolean {
      const raw = file.raw as File | undefined;
      const mime = raw?.type || '';
      if (mime.startsWith('image/')) {
        return true;
      }
      return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(file.name || file.url || '');
    },
    attachmentPreviewUrl(file: UploadFile): string {
      return this.isImageAttachment(file)
        ? file.url || (file.response as { file_url?: string } | undefined)?.file_url || ''
        : '';
    },
    removeAttachment(index: number, file: UploadFile) {
      this.revokeBlobUrl(file);
      this.attachmentFileList.splice(index, 1);
    },
    clearAttachments() {
      for (const file of this.attachmentFileList) {
        this.revokeBlobUrl(file);
      }
      this.attachmentFileList = [];
    },
    revokeBlobUrl(file: UploadFile) {
      if (file.url?.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(file.url);
        } catch {
          // ignore revoke failures
        }
      }
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
      this.settingsVisible = false;
      this.clearAttachments();
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
