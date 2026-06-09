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
        <ask-user-question-card
          v-if="pendingQuestion"
          :key="pendingQuestion.request_id"
          :tool-use-id="pendingQuestion.request_id"
          :payload="pendingQuestion.payload"
          @submit="onAnswerQuestion"
          @skip="onSkipQuestion"
        />
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
          <div
            class="cb-composer rounded-2xl border border-[var(--app-border-subtle)] bg-[var(--app-content-bg)] px-3 py-2.5 transition-colors focus-within:border-[var(--el-color-primary-light-5)]"
          >
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

            <el-input
              v-model="prompt"
              type="textarea"
              :autosize="{ minRows: 2, maxRows: 12 }"
              resize="none"
              class="cb-composer__input"
              :placeholder="$t('codingBridge.session.promptPlaceholder')"
              @keydown.enter="onComposerEnter"
            />

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

            <div class="mt-1.5 flex items-center gap-1.5">
              <button
                type="button"
                class="cb-icon-btn"
                :title="$t('codingBridge.session.attachFile')"
                @click="onTriggerAttachmentUpload"
              >
                <font-awesome-icon icon="fa-solid fa-paperclip" />
              </button>

              <div class="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                <!-- Provider is chosen at start and locked once a session is running. -->
                <el-dropdown v-if="isNewSession" trigger="click" @command="provider = $event">
                  <button type="button" class="cb-pill">
                    <img
                      v-if="providerIcon(provider)"
                      :src="providerIcon(provider)!.src"
                      class="cb-pill__brand"
                      :class="{ 'cb-pill__brand--invert': providerIcon(provider)!.invertOnDark }"
                      alt=""
                    />
                    <font-awesome-icon v-else icon="fa-solid fa-code" class="cb-pill__icon" />
                    <span class="truncate">{{ providerName(provider) }}</span>
                    <font-awesome-icon icon="fa-solid fa-chevron-down" class="cb-pill__caret" />
                  </button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item
                        v-for="opt in providerOptions"
                        :key="opt.value"
                        :command="opt.value"
                        :disabled="!opt.available"
                      >
                        <font-awesome-icon
                          icon="fa-solid fa-check"
                          class="mr-2"
                          :class="opt.value === provider ? 'opacity-100' : 'opacity-0'"
                        />
                        <img
                          v-if="providerIcon(opt.value)"
                          :src="providerIcon(opt.value)!.src"
                          class="cb-pill__brand mr-1.5"
                          :class="{ 'cb-pill__brand--invert': providerIcon(opt.value)!.invertOnDark }"
                          alt=""
                        />
                        {{ opt.label }}
                        <span v-if="!opt.available" class="ml-1 text-xs opacity-60">
                          {{ $t('codingBridge.session.providerUnavailable') }}
                        </span>
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
                <span v-else class="cb-pill cb-pill--static">
                  <img
                    v-if="providerIcon(currentSession?.provider || 'claude')"
                    :src="providerIcon(currentSession?.provider || 'claude')!.src"
                    class="cb-pill__brand"
                    :class="{
                      'cb-pill__brand--invert': providerIcon(currentSession?.provider || 'claude')!.invertOnDark
                    }"
                    alt=""
                  />
                  <font-awesome-icon v-else icon="fa-solid fa-code" class="cb-pill__icon" />
                  <span class="truncate">{{ providerName(currentSession?.provider || 'claude') }}</span>
                </span>

                <!-- Model can be switched any time, including mid-session. -->
                <el-popover ref="modelPopover" trigger="click" placement="top-start" :width="260">
                  <template #reference>
                    <button type="button" class="cb-pill">
                      <font-awesome-icon icon="fa-solid fa-brain" class="cb-pill__icon" />
                      <span class="truncate">{{ model || $t('codingBridge.session.modelDefault') }}</span>
                      <font-awesome-icon icon="fa-solid fa-chevron-down" class="cb-pill__caret" />
                    </button>
                  </template>
                  <div class="cb-model-menu">
                    <button type="button" class="cb-model-option" @click="selectModel('')">
                      <font-awesome-icon
                        icon="fa-solid fa-check"
                        class="cb-model-option__check"
                        :class="!model ? 'opacity-100' : 'opacity-0'"
                      />
                      <span class="truncate">{{ $t('codingBridge.session.modelDefault') }}</span>
                    </button>
                    <button
                      v-for="opt in modelOptions"
                      :key="opt.value"
                      type="button"
                      class="cb-model-option"
                      @click="selectModel(opt.value)"
                    >
                      <font-awesome-icon
                        icon="fa-solid fa-check"
                        class="cb-model-option__check"
                        :class="opt.value === model ? 'opacity-100' : 'opacity-0'"
                      />
                      <span class="truncate">{{ opt.label }}</span>
                    </button>
                    <div v-if="allowCustomModel" class="cb-model-custom">
                      <el-input
                        v-model="customModelDraft"
                        size="small"
                        :placeholder="$t('codingBridge.session.modelPlaceholder')"
                        @keyup.enter="applyCustomModel"
                      >
                        <template #append>
                          <el-button :disabled="!customModelDraft.trim()" @click="applyCustomModel">
                            <font-awesome-icon icon="fa-solid fa-check" />
                          </el-button>
                        </template>
                      </el-input>
                    </div>
                  </div>
                </el-popover>

                <!-- Effort, permission and working directory are chosen at start. -->
                <template v-if="isNewSession">
                  <el-dropdown v-if="effortOptions.length > 1" trigger="click" @command="effort = $event">
                    <button type="button" class="cb-pill">
                      <font-awesome-icon icon="fa-solid fa-gauge-high" class="cb-pill__icon" />
                      <span class="truncate">{{ effortLabel(effort) }}</span>
                      <font-awesome-icon icon="fa-solid fa-chevron-down" class="cb-pill__caret" />
                    </button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item v-for="opt in effortOptions" :key="opt.value" :command="opt.value">
                          <font-awesome-icon
                            icon="fa-solid fa-check"
                            class="mr-2"
                            :class="opt.value === effort ? 'opacity-100' : 'opacity-0'"
                          />
                          {{ opt.label }}
                        </el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>

                  <el-dropdown trigger="click" @command="permissionMode = $event">
                    <button type="button" class="cb-pill">
                      <font-awesome-icon icon="fa-solid fa-shield-halved" class="cb-pill__icon" />
                      <span class="truncate">{{ permissionModeLabel(permissionMode) }}</span>
                      <font-awesome-icon icon="fa-solid fa-chevron-down" class="cb-pill__caret" />
                    </button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item v-for="opt in permissionModeOptions" :key="opt.value" :command="opt.value">
                          <font-awesome-icon
                            icon="fa-solid fa-check"
                            class="mr-2"
                            :class="opt.value === permissionMode ? 'opacity-100' : 'opacity-0'"
                          />
                          {{ opt.label }}
                        </el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>

                  <el-popover trigger="click" placement="top-start" :width="320">
                    <template #reference>
                      <button type="button" class="cb-pill">
                        <font-awesome-icon icon="fa-solid fa-folder-open" class="cb-pill__icon" />
                        <span class="truncate">{{ cwd || $t('codingBridge.session.cwdDefault') }}</span>
                        <font-awesome-icon icon="fa-solid fa-chevron-down" class="cb-pill__caret" />
                      </button>
                    </template>
                    <el-input
                      v-model="cwd"
                      size="small"
                      clearable
                      :placeholder="$t('codingBridge.session.cwdPlaceholder')"
                    >
                      <template #append>
                        <el-button :title="$t('codingBridge.directory.title')" @click="openDirectory">
                          <font-awesome-icon icon="fa-solid fa-folder-open" />
                        </el-button>
                      </template>
                    </el-input>
                  </el-popover>
                </template>

                <!-- Working directory is fixed once a session is running. -->
                <span v-if="!isNewSession && currentSession?.cwd" class="cb-pill cb-pill--static">
                  <font-awesome-icon icon="fa-solid fa-folder-open" class="cb-pill__icon" />
                  <span class="truncate">{{ currentSession?.cwd }}</span>
                </span>
              </div>

              <el-button v-if="running" circle @click="onInterrupt">
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
  ElMessage,
  ElPopover,
  ElDropdown,
  ElDropdownMenu,
  ElDropdownItem,
  ElUpload,
  UploadFile,
  UploadFiles
} from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import TranscriptItem from './TranscriptItem.vue';
import DirectoryDialog from './DirectoryDialog.vue';
import AskUserQuestionCard from '@/components/chat/AskUserQuestionCard.vue';
import { isAskUserQuestionRequest, questionPayload } from './askUserQuestion';
import { getBaseUrlPlatform, pasteUploadMixin } from '@/utils';
import {
  IAskUserQuestionPayload,
  ICodingBridgeAttachment,
  ICodingBridgeCapabilities,
  ICodingBridgeEvent,
  ICodingBridgeNode,
  ICodingBridgeProviderCapability,
  ICodingBridgeSession
} from '@/models';
import claudeIcon from '@/assets/images/logos/claude.svg';
import openaiIcon from '@/assets/images/logos/openai.svg';

const MAX_ATTACHMENT_BYTES = 50 * 1024 * 1024;
const MAX_ATTACHMENTS = 10;

// Brand marks for each coding backend. `invertOnDark` flips the black OpenAI
// glyph to white in dark mode; Claude's orange already reads on both themes.
const PROVIDER_BRANDS: Record<string, { src: string; invertOnDark: boolean }> = {
  claude: { src: claudeIcon, invertOnDark: false },
  codex: { src: openaiIcon, invertOnDark: true }
};

export default defineComponent({
  name: 'CodingBridgeSessionView',
  components: {
    ElInput,
    ElButton,
    ElPopover,
    ElDropdown,
    ElDropdownMenu,
    ElDropdownItem,
    ElUpload,
    FontAwesomeIcon,
    TranscriptItem,
    DirectoryDialog,
    AskUserQuestionCard
  },
  mixins: [pasteUploadMixin],
  emits: ['history'],
  data() {
    return {
      prompt: '',
      cwd: '',
      model: '',
      customModelDraft: '',
      permissionMode: 'default',
      provider: 'claude',
      effort: '',
      directoryVisible: false,
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
    // The agent's pending AskUserQuestion for this session, if any. Rendered as
    // an inline question card instead of the generic allow/deny modal.
    pendingQuestion(): { request_id: string; payload: IAskUserQuestionPayload } | undefined {
      const sessionId = this.currentSessionId;
      if (!sessionId) {
        return undefined;
      }
      const permissions = this.$store.state.codingBridge?.permissions ?? [];
      const request = permissions.find((item) => item.session_id === sessionId && isAskUserQuestionRequest(item));
      return request ? { request_id: request.request_id, payload: questionPayload(request) } : undefined;
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
        this.nodeOnline &&
        this.currentProviderAvailable
      );
    },
    composerHint(): string {
      if (this.uploadingAttachments) {
        return this.$t('codingBridge.session.uploadingAttachment') as string;
      }
      if (this.providerCaps.length && !this.currentProviderAvailable) {
        return this.$t('codingBridge.session.providerUnavailableHint', {
          name: this.providerName(this.provider)
        }) as string;
      }
      return this.resumeHint
        ? (this.$t('codingBridge.history.resumeHint') as string)
        : (this.$t('codingBridge.session.enterHint') as string);
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
    // Unknown until capabilities load → treat as available so the composer is
    // never blocked before the node has reported anything.
    currentProviderAvailable(): boolean {
      if (!this.providerCaps.length) {
        return true;
      }
      return this.currentProviderCap?.available !== false;
    },
    providerOptions(): { label: string; value: string; available: boolean }[] {
      if (this.providerCaps.length) {
        return this.providerCaps.map((cap) => ({
          value: cap.name,
          label: cap.label,
          available: cap.available !== false
        }));
      }
      return [
        { label: this.$t('codingBridge.session.providerClaude') as string, value: 'claude', available: true },
        { label: this.$t('codingBridge.session.providerCodex') as string, value: 'codex', available: true }
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
    pendingQuestion() {
      this.scrollToBottom();
    },
    currentSessionId() {
      this.scrollToBottom();
      // Seed the composer (provider/model/cwd) from the session we switched to.
      this.syncSessionSettings();
    },
    currentNodeId() {
      // Refresh capabilities when switching devices.
      this.requestCapabilities();
    },
    providerCaps() {
      // Prefer a backend the node actually has installed. Fall back to the
      // first available provider when the current pick is missing or its CLI
      // isn't installed, so the model list and send button always match.
      // Only do this for a new session — a running session's provider is fixed.
      if (!this.isNewSession || !this.providerCaps.length) {
        return;
      }
      const current = this.providerCaps.find((cap) => cap.name === this.provider);
      if (!current || current.available === false) {
        const firstAvailable = this.providerCaps.find((cap) => cap.available !== false);
        if (firstAvailable) {
          this.provider = firstAvailable.name;
        }
      }
    },
    provider() {
      // Model lists and effort tiers differ per backend, so reset both — but
      // never while a session is running (its provider can't change anyway).
      if (!this.isNewSession) {
        return;
      }
      this.model = '';
      this.effort = '';
    }
  },
  mounted() {
    this.requestCapabilities();
    this.syncSessionSettings();
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
    // Brand mark for a backend, or null to fall back to a generic icon.
    providerIcon(provider: string): { src: string; invertOnDark: boolean } | null {
      return PROVIDER_BRANDS[provider] ?? null;
    },
    // Seed the composer from the active session so the pills (provider, model,
    // cwd) reflect what's actually running — e.g. after resuming from history.
    syncSessionSettings() {
      const session = this.currentSession;
      if (!session) {
        return;
      }
      if (session.provider) {
        this.provider = session.provider;
      }
      this.model = session.model ?? '';
      this.customModelDraft = '';
      if (session.cwd) {
        this.cwd = session.cwd;
      }
    },
    // Pick a listed model (or the empty default) and close the popover.
    selectModel(value: string) {
      this.model = value;
      this.customModelDraft = '';
      this.closeModelPopover();
    },
    // Apply a free-typed model name from the custom input.
    applyCustomModel() {
      const value = this.customModelDraft.trim();
      if (!value) {
        return;
      }
      this.model = value;
      this.customModelDraft = '';
      this.closeModelPopover();
    },
    closeModelPopover() {
      (this.$refs.modelPopover as { hide?: () => void } | undefined)?.hide?.();
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
    onAnswerQuestion(payload: { tool_use_id: string; output: string }) {
      this.$store.dispatch('codingBridge/answerQuestion', {
        request_id: payload.tool_use_id,
        output: payload.output
      });
    },
    onSkipQuestion(payload: { tool_use_id: string }) {
      this.$store.dispatch('codingBridge/resolvePermission', {
        request_id: payload.tool_use_id,
        decision: 'deny'
      });
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
      this.customModelDraft = '';
      this.permissionMode = 'default';
      this.provider = 'claude';
      this.effort = '';
      this.prompt = '';
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

<style scoped lang="scss">
.cb-composer {
  &__input {
    :deep(.el-textarea__inner) {
      border: none;
      box-shadow: none;
      background: transparent;
      padding: 6px 4px;
      min-height: unset;
      font-size: 14px;
      line-height: 1.5;
    }
  }
}

.cb-icon-btn {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 9999px;
  border: 1px solid var(--app-border-subtle);
  background: transparent;
  color: var(--app-text-subtle);
  font-size: 13px;
  cursor: pointer;
  transition:
    color 0.15s ease,
    border-color 0.15s ease;

  &:hover {
    color: var(--el-color-primary);
    border-color: var(--el-color-primary-light-5);
  }
}

.cb-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 240px;
  height: 28px;
  padding: 0 10px;
  border-radius: 9999px;
  border: 1px solid var(--app-border-subtle);
  background: transparent;
  color: var(--app-text-subtle);
  font-size: 12px;
  line-height: 1.2;
  cursor: pointer;
  transition:
    color 0.15s ease,
    border-color 0.15s ease;

  &:hover {
    color: var(--el-color-primary);
    border-color: var(--el-color-primary-light-5);
  }

  &__icon {
    flex: none;
    font-size: 12px;
  }

  &__brand {
    flex: none;
    width: 14px;
    height: 14px;
    object-fit: contain;
    vertical-align: middle;
  }

  &__caret {
    flex: none;
    margin-left: 2px;
    font-size: 9px;
    opacity: 0.55;
  }

  &--static {
    cursor: default;

    &:hover {
      color: var(--app-text-subtle);
      border-color: var(--app-border-subtle);
    }
  }
}

// The OpenAI glyph ships black; flip it to white so it stays visible on the
// dark composer background.
html.dark .cb-pill__brand--invert {
  filter: invert(1);
}

.cb-model-menu {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 240px;
  overflow-y: auto;
}

.cb-model-option {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 6px 8px;
  border: none;
  border-radius: 6px;
  background: transparent;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  color: inherit;

  &__check {
    flex: none;
    margin-right: 6px;
    font-size: 11px;
  }

  &:hover {
    background: var(--app-content-hover-bg);
  }
}

.cb-model-custom {
  margin-top: 4px;
  padding-top: 6px;
  border-top: 1px solid var(--app-border-color, rgba(0, 0, 0, 0.08));
}
</style>
