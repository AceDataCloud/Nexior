<template>
  <div class="session-view flex flex-col h-full bg-[var(--app-content-bg)]">
    <!-- Empty: no device selected -->
    <div
      v-if="!currentNode"
      class="flex-1 flex flex-col items-center justify-center text-center p-8 text-[var(--app-text-subtle)]"
    >
      <font-awesome-icon icon="fa-solid fa-laptop-code" class="text-4xl mb-3" />
      <p class="text-sm">{{ $t('codingBridge.session.noDevice') }}</p>
      <!-- Mobile: the device list is in a drawer, so offer a way to open it. -->
      <el-button class="md:hidden mt-4" round @click="$emit('devices')">
        <font-awesome-icon icon="fa-solid fa-laptop-code" class="mr-1" />
        {{ $t('codingBridge.nodeList.title') }}
      </el-button>
    </div>

    <template v-else>
      <!-- Header -->
      <div class="flex items-center justify-between gap-3 px-5 py-3 border-b border-[var(--app-border-subtle)]">
        <div class="flex items-center gap-2 min-w-0">
          <!-- Devices entry (mobile only): opens the device drawer. Lives in the
               header instead of floating over the content. -->
          <button
            type="button"
            class="cb-devices-btn md:hidden"
            :title="$t('codingBridge.nodeList.title')"
            :aria-label="$t('codingBridge.nodeList.title')"
            @click="$emit('devices')"
          >
            <font-awesome-icon icon="fa-solid fa-laptop-code" />
          </button>
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

      <!-- Diagnostic ids: copyable identifiers for issue reports / log lookups. -->
      <div
        v-if="diagnostics.length"
        class="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-1.5 text-[11px] text-[var(--app-text-subtle)] border-b border-[var(--app-border-subtle)]"
      >
        <span v-for="item in diagnostics" :key="item.label" class="inline-flex items-center gap-1 min-w-0">
          <span class="opacity-70 flex-none">{{ item.label }}:</span>
          <span class="font-mono break-all" :title="item.value">{{ item.value }}</span>
          <copy-to-clipboard :content="item.value" class="inline-block flex-none" />
        </span>
      </div>

      <!-- Transcript -->
      <div ref="transcript" class="flex-1 min-h-0 overflow-y-auto px-5 py-4 flex flex-col gap-3">
        <!-- Restoring a conversation: show a skeleton until its transcript lands,
             but only when we don't already hold (live) events to render. -->
        <div v-if="historyLoading && !events.length" class="cb-skeleton">
          <el-skeleton animated>
            <template #template>
              <div class="flex flex-col gap-4">
                <div class="flex justify-end">
                  <el-skeleton-item variant="rect" class="cb-sk cb-sk--user" />
                </div>
                <div class="flex flex-col gap-1.5">
                  <el-skeleton-item variant="text" style="width: 55%" />
                  <el-skeleton-item variant="text" style="width: 88%" />
                  <el-skeleton-item variant="text" style="width: 70%" />
                </div>
                <el-skeleton-item variant="rect" class="cb-sk cb-sk--tool" />
                <div class="flex justify-end">
                  <el-skeleton-item variant="rect" class="cb-sk cb-sk--user-sm" />
                </div>
                <div class="flex flex-col gap-1.5">
                  <el-skeleton-item variant="text" style="width: 80%" />
                  <el-skeleton-item variant="text" style="width: 45%" />
                </div>
              </div>
            </template>
          </el-skeleton>
        </div>
        <div v-else-if="!events.length" class="m-auto text-center text-sm text-[var(--app-text-subtle)]">
          {{ $t('codingBridge.session.startHint') }}
        </div>
        <button
          v-if="hiddenEventCount > 0"
          type="button"
          class="cb-load-earlier mx-auto mb-1 flex items-center gap-1.5 rounded-full border border-[var(--app-border-subtle)] bg-[var(--app-content-bg)] px-3 py-1 text-xs text-[var(--app-text-subtle)] hover:text-[var(--el-color-primary)]"
          :title="`+${hiddenEventCount}`"
          @click="loadEarlier"
        >
          <font-awesome-icon icon="fa-solid fa-arrow-up" />
          {{ hiddenEventCount }}
        </button>
        <transcript-item
          v-for="event in visibleEvents"
          :key="event.id"
          :event="event"
          :editable="canEdit"
          @edit="onEditPrompt"
        />
        <!-- Live "thinking" status while the agent works between/before outputs. -->
        <thinking-indicator v-if="thinking" />
        <!-- Retry: re-run the last prompt after a turn ends in error. -->
        <div v-if="canRetry" class="flex justify-center pt-1">
          <el-button size="small" round @click="onRetry">
            <font-awesome-icon icon="fa-solid fa-rotate-right" class="mr-1" />
            {{ $t('codingBridge.session.retry') }}
          </el-button>
        </div>
      </div>

      <!-- Pending question: docked between the transcript and the composer
           (NOT inside the scrolling transcript) so its options scroll inside
           the card and the Back / Next / Submit bar is always on screen and
           tappable on mobile. Capped via `--auq-max-height` so the dock +
           composer + header always fit the viewport. -->
      <div v-if="pendingQuestion" class="cb-question-dock flex-none px-5">
        <ask-user-question-card
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
          <!-- Editing a past prompt: sending rewinds the conversation to here. -->
          <div
            v-if="editingActive"
            class="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg bg-[var(--el-color-primary-light-9)] px-3 py-2 text-xs text-[var(--app-text)]"
          >
            <span class="inline-flex items-center gap-1.5">
              <font-awesome-icon icon="fa-solid fa-pen" class="text-[var(--el-color-primary)]" />
              {{ $t('codingBridge.session.editingBanner') }}
            </span>
            <el-checkbox v-if="canRestoreCode" v-model="restoreCode" size="small" class="cb-restore-code">
              {{ $t('codingBridge.session.editRestoreCode') }}
            </el-checkbox>
            <button type="button" class="ml-auto cb-edit-cancel" @click="cancelEdit">
              {{ $t('codingBridge.session.editCancel') }}
            </button>
          </div>
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

            <ul v-if="slashMenuVisible" class="cb-slash-menu">
              <li
                v-for="(command, index) in slashMatches"
                :key="command.name"
                class="cb-slash-menu__item"
                :class="{ 'cb-slash-menu__item--active': index === slashActiveIndex }"
                @mousedown.prevent="applySlash(command)"
                @mouseenter="slashActiveIndex = index"
              >
                <span class="cb-slash-menu__name">/{{ command.name }}</span>
                <span v-if="command.argument_hint" class="cb-slash-menu__hint">{{ command.argument_hint }}</span>
                <span v-if="command.description" class="cb-slash-menu__desc">{{ command.description }}</span>
              </li>
            </ul>

            <el-input
              v-model="prompt"
              type="textarea"
              :autosize="{ minRows: 2, maxRows: 12 }"
              resize="none"
              class="cb-composer__input"
              :placeholder="$t('codingBridge.session.promptPlaceholder')"
              @keydown="onComposerKeydown"
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

                <!-- Effort and permission/edit mode stay editable every turn: the
                     node applies whatever the composer carries on each send, so a
                     resumed conversation can change them per query. -->
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

                <!-- Working directory: editable for a new or resumed-but-not-yet
                     -continued session (its first send is a fresh start that
                     applies the cwd); read-only once a live turn pins it. -->
                <el-popover v-if="canPickCwd" trigger="click" placement="top-start" :width="320">
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
                    class="cb-cwd-input"
                    :placeholder="$t('codingBridge.session.cwdPlaceholder')"
                  >
                    <template #suffix>
                      <span
                        class="cb-cwd-browse"
                        role="button"
                        tabindex="0"
                        :title="$t('codingBridge.directory.title')"
                        :aria-label="$t('codingBridge.directory.title')"
                        @click="openDirectory"
                        @keydown.enter.prevent="openDirectory"
                        @keydown.space.prevent="openDirectory"
                      >
                        <font-awesome-icon icon="fa-solid fa-folder-open" />
                      </span>
                    </template>
                  </el-input>
                </el-popover>
                <span v-else-if="currentSession?.cwd" class="cb-pill cb-pill--static">
                  <font-awesome-icon icon="fa-solid fa-folder-open" class="cb-pill__icon" />
                  <span class="truncate">{{ currentSession?.cwd }}</span>
                </span>
              </div>

              <el-button v-if="running" circle @click="onInterrupt">
                <font-awesome-icon icon="fa-solid fa-stop" />
              </el-button>
              <el-button type="primary" round :disabled="!canSend" @click="onSend">
                {{ editingActive ? $t('codingBridge.session.editSubmit') : $t('codingBridge.session.send') }}
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
  ElCheckbox,
  ElSkeleton,
  ElSkeletonItem,
  UploadFile,
  UploadFiles
} from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import TranscriptItem from './TranscriptItem.vue';
import ThinkingIndicator from './ThinkingIndicator.vue';
import DirectoryDialog from './DirectoryDialog.vue';
import AskUserQuestionCard from '@/components/chat/AskUserQuestionCard.vue';
import { isAskUserQuestionRequest, questionPayload } from './askUserQuestion';
import { getBaseUrlPlatform, pasteUploadMixin } from '@/utils';
import CopyToClipboard from '@/components/common/CopyToClipboard.vue';
import {
  Status,
  IAskUserQuestionPayload,
  ICodingBridgeAttachment,
  ICodingBridgeCapabilities,
  ICodingBridgeComposerPrefs,
  ICodingBridgeEvent,
  ICodingBridgeNode,
  ICodingBridgeProviderCapability,
  ICodingBridgeSession,
  ICodingBridgeSlashCommand
} from '@/models';
import claudeIcon from '@/assets/images/logos/claude.svg';
import openaiIcon from '@/assets/images/logos/openai.svg';

const MAX_ATTACHMENT_BYTES = 50 * 1024 * 1024;
const MAX_ATTACHMENTS = 10;

// Render only a window of the most recent events so a long coding-agent
// transcript can't put thousands of markdown/highlight DOM subtrees on the page
// at once (mobile Safari OOM-kills the tab past its ~2GB limit). Older turns
// load in pages via the "earlier" control. Paired with per-item content caps in
// TranscriptItem, this bounds rendered memory regardless of conversation size.
const RENDER_WINDOW = 60;
const RENDER_PAGE = 60;

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
    ElCheckbox,
    ElSkeleton,
    ElSkeletonItem,
    FontAwesomeIcon,
    TranscriptItem,
    ThinkingIndicator,
    DirectoryDialog,
    AskUserQuestionCard,
    CopyToClipboard
  },
  mixins: [pasteUploadMixin],
  emits: ['history', 'devices'],
  data() {
    return {
      prompt: '',
      cwd: '',
      model: '',
      customModelDraft: '',
      // Default to bypass: this is the user's own paired machine, so the agent
      // runs without per-tool approval prompts unless a stricter mode is picked
      // (which then persists per device via lastComposer).
      permissionMode: 'bypassPermissions',
      provider: 'claude',
      effort: '',
      directoryVisible: false,
      slashMenuOpen: false,
      slashActiveIndex: 0,
      // Id of the prompt event being edited; when set, sending rewinds the
      // conversation to that turn instead of appending a new one.
      editingEventId: '' as string,
      restoreCode: false,
      attachmentFileList: [] as UploadFiles,
      uploadUrl: getBaseUrlPlatform() + '/api/v1/files/',
      maxAttachments: MAX_ATTACHMENTS,
      // How many of the most recent events to render; grows by RENDER_PAGE when
      // the user loads earlier turns. Reset on session switch.
      visibleCount: RENDER_WINDOW
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
    // Last composer setup used on this device, restored from localStorage.
    lastComposer(): ICodingBridgeComposerPrefs {
      const id = this.currentNodeId;
      return (id ? this.$store.state.codingBridge?.lastComposer?.[id] : undefined) ?? {};
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
    // Only the most recent `visibleCount` events are rendered; the rest stay
    // behind the "load earlier" control so a huge transcript never mounts at once.
    visibleEvents(): ICodingBridgeEvent[] {
      const all = this.events;
      return all.length > this.visibleCount ? all.slice(-this.visibleCount) : all;
    },
    hiddenEventCount(): number {
      return Math.max(0, this.events.length - this.visibleCount);
    },
    // A history transcript is being fetched (restore / drawer open). Drives the
    // transcript skeleton; the `!events.length` guard keeps a live resync silent.
    historyLoading(): boolean {
      return this.$store.state.codingBridge?.status?.getHistoryDetail === Status.Request;
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
    // The working directory can be picked for a brand-new session and for a
    // resumed conversation that hasn't continued yet (its first send is a fresh
    // `session.start` that applies the cwd). Once a live turn is running the
    // agent's directory is fixed, so it's shown read-only — model / effort /
    // permission stay editable because the node applies those on every turn.
    canPickCwd(): boolean {
      return this.isNewSession || !this.currentSession?.started;
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
    // Show the animated "thinking" status whenever the agent is working — but
    // not while it's blocked on a user question (then we're waiting on them).
    thinking(): boolean {
      return this.running && !this.pendingQuestion;
    },
    connected(): boolean {
      return this.$store.state.codingBridge?.connection === 'connected';
    },
    // Offer a retry once a turn has failed, provided we can actually reach the
    // device and there is a prior prompt to re-run.
    canRetry(): boolean {
      return (
        this.currentSession?.status === 'error' &&
        !this.readonly &&
        this.connected &&
        this.nodeOnline &&
        this.events.some((event) => event.kind === 'prompt')
      );
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
      // Intentionally NOT gated on `currentProviderAvailable`: that flag comes
      // from the node's CLI probe, which false-negatives when the daemon's PATH
      // can't see an installed CLI (nvm/launchd). Blocking send there locked the
      // user out of a working node. We surface a warning in `composerHint`
      // instead and let the node return a clear error if the CLI is truly absent.
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
    // Editing rewinds the conversation, so it's gated on the running session's
    // backend (Claude supports it; Codex doesn't) and disabled for read-only
    // replays. Unknown until capabilities load → don't offer it yet.
    canEdit(): boolean {
      if (this.readonly) {
        return false;
      }
      const cap = this.providerCaps.find((item) => item.name === this.activeProviderName);
      return !!cap?.supports_edit;
    },
    canRestoreCode(): boolean {
      const cap = this.providerCaps.find((item) => item.name === this.activeProviderName);
      return !!cap?.supports_code_restore;
    },
    editingActive(): boolean {
      return !!this.editingEventId;
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
    },
    // The backend whose slash commands the composer should suggest: a running
    // session keeps its own backend; a new session uses the picked provider.
    activeProviderName(): string {
      return this.currentSession?.provider || this.provider;
    },
    slashCommands(): ICodingBridgeSlashCommand[] {
      const name = this.activeProviderName;
      const cap = this.providerCaps.find((item) => item.name === name);
      return cap?.commands ?? [];
    },
    // Matches while the user is still typing the command token (no space yet).
    slashMatches(): ICodingBridgeSlashCommand[] {
      const match = this.prompt.match(/^\/(\S*)$/);
      if (!match) {
        return [];
      }
      const query = match[1].toLowerCase();
      return this.slashCommands.filter((command) => {
        const names = [command.name, ...(command.aliases ?? [])];
        return names.some((name) => name.toLowerCase().startsWith(query));
      });
    },
    slashMenuVisible(): boolean {
      return this.slashMenuOpen && this.slashMatches.length > 0;
    },
    // Copyable identifiers for issue reports and CLS log lookups.
    diagnostics(): { label: string; value: string }[] {
      const items: { label: string; value: string }[] = [];
      if (this.currentNodeId) {
        items.push({ label: this.$t('codingBridge.session.nodeId') as string, value: this.currentNodeId });
      }
      if (this.currentSessionId) {
        items.push({ label: this.$t('codingBridge.session.sessionId') as string, value: this.currentSessionId });
      }
      if (this.currentSession?.trace_id) {
        items.push({
          label: this.$t('codingBridge.session.traceId') as string,
          value: this.currentSession.trace_id
        });
      }
      return items;
    }
  },
  watch: {
    events() {
      this.scrollToBottom();
    },
    pendingQuestion() {
      this.scrollToBottom();
    },
    thinking() {
      this.scrollToBottom();
    },
    currentSessionId() {
      this.scrollToBottom();
      // A different conversation starts capped to the most recent window again.
      this.visibleCount = RENDER_WINDOW;
      // Switching conversations cancels any in-progress edit.
      this.editingEventId = '';
      this.restoreCode = false;
      // Seed the composer (provider/model/cwd) from the session we switched to.
      this.syncSessionSettings();
    },
    currentNodeId() {
      // Refresh capabilities when switching devices.
      this.requestCapabilities();
      // On a new session, swap the composer to the new device's last setup —
      // a folder / model from the previous device is meaningless here.
      if (this.isNewSession) {
        this.restoreComposerPrefs();
      }
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
    },
    prompt(value: string) {
      // Open the slash menu only while a leading command token is being typed.
      this.slashMenuOpen = /^\/\S*$/.test(value);
      if (this.slashActiveIndex >= this.slashMatches.length) {
        this.slashActiveIndex = 0;
      }
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
        // New session: restore the last setup used on this device so the user
        // doesn't have to re-pick folder / model / mode every time.
        this.restoreComposerPrefs();
        return;
      }
      // Resuming a session (e.g. reopened from history after a reload): seed the
      // composer from the session, falling back to this device's last setup for
      // anything the replayed transcript can't carry (effort / permission mode
      // aren't recorded on disk; cwd may be absent). Without the fallback these
      // reset to defaults on every reload. Provider already exists → the
      // `provider` watcher won't wipe model/effort here.
      const prefs = this.lastComposer;
      if (session.provider) {
        this.provider = session.provider;
      }
      this.model = session.model ?? '';
      this.customModelDraft = '';
      this.cwd = session.cwd ?? prefs.cwd ?? '';
      this.effort = session.effort ?? prefs.effort ?? '';
      this.permissionMode = session.permission_mode ?? prefs.permissionMode ?? 'bypassPermissions';
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
    // Route keys to the slash-command menu when it is open; otherwise fall back
    // to the normal Enter-to-send behaviour.
    onComposerKeydown(event: KeyboardEvent | Event) {
      const e = event as KeyboardEvent;
      if (this.slashMenuVisible && !e.isComposing && e.keyCode !== 229) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          this.moveSlash(1);
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          this.moveSlash(-1);
          return;
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          this.slashMenuOpen = false;
          return;
        }
        const accept = e.key === 'Tab' || (e.key === 'Enter' && !e.shiftKey);
        if (accept) {
          e.preventDefault();
          this.applySlash(this.slashMatches[this.slashActiveIndex]);
          return;
        }
      }
      if (e.key === 'Enter') {
        this.onComposerEnter(e);
      }
    },
    moveSlash(delta: number) {
      const count = this.slashMatches.length;
      if (!count) {
        return;
      }
      this.slashActiveIndex = (this.slashActiveIndex + delta + count) % count;
      // Keep the highlighted command visible as the list scrolls.
      this.$nextTick(() => {
        const active = this.$el?.querySelector?.('.cb-slash-menu__item--active');
        (active as HTMLElement | null)?.scrollIntoView({ block: 'nearest' });
      });
    },
    applySlash(command?: ICodingBridgeSlashCommand) {
      if (!command) {
        return;
      }
      this.prompt = `/${command.name} `;
      this.slashMenuOpen = false;
      this.slashActiveIndex = 0;
    },
    onSend() {
      if (!this.canSend) {
        return;
      }
      const attachments = this.attachments;
      // Editing a past prompt rewinds the conversation to that turn instead of
      // appending — so the original prompt and everything after leave context.
      if (this.editingEventId) {
        this.$store.dispatch('codingBridge/editPrompt', {
          eventId: this.editingEventId,
          prompt: this.prompt,
          model: this.model,
          permissionMode: this.permissionMode,
          effort: this.effort,
          attachments: attachments.length ? attachments : undefined,
          restoreCode: this.restoreCode
        });
        this.resetComposer();
        return;
      }
      // Remember this device's setup so the next new session pre-fills it.
      if (this.currentNodeId) {
        this.$store.commit('codingBridge/setLastComposer', {
          node_id: this.currentNodeId,
          prefs: {
            cwd: this.cwd,
            provider: this.provider,
            model: this.model,
            permissionMode: this.permissionMode,
            effort: this.effort
          }
        });
      }
      this.$store.dispatch('codingBridge/sendPrompt', {
        prompt: this.prompt,
        cwd: this.cwd,
        model: this.model,
        permissionMode: this.permissionMode,
        provider: this.provider,
        effort: this.effort,
        attachments: attachments.length ? attachments : undefined
      });
      this.resetComposer();
    },
    // Clear the input, slash menu, attachments and any active edit state.
    resetComposer() {
      this.prompt = '';
      this.slashMenuOpen = false;
      this.slashActiveIndex = 0;
      this.editingEventId = '';
      this.restoreCode = false;
      this.clearAttachments();
    },
    cancelEdit() {
      this.resetComposer();
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
    onRetry() {
      this.$store.dispatch('codingBridge/retryLastPrompt');
    },
    // Enter edit mode for a past prompt: reload its text/attachments into the
    // composer so the user can tweak it (and switch the model). On send the
    // conversation is rewound to this turn — the original prompt and everything
    // after it are dropped from the agent's context (see editPrompt).
    onEditPrompt(event: ICodingBridgeEvent) {
      if (!this.canEdit) {
        return;
      }
      this.editingEventId = event.id;
      this.restoreCode = false;
      this.prompt = event.text ?? '';
      this.slashMenuOpen = false;
      this.slashActiveIndex = 0;
      this.clearAttachments();
      this.attachmentFileList = (event.attachments ?? []).map((attachment, index) => {
        return {
          name: attachment.name || attachment.url,
          url: attachment.url,
          status: 'success',
          percentage: 100,
          uid: Date.now() + index,
          response: { file_url: attachment.url },
          mime_type: attachment.mime_type
        } as unknown as UploadFile;
      });
      this.$nextTick(() => {
        const textarea = this.$el?.querySelector?.('.cb-composer__input textarea') as HTMLTextAreaElement | null;
        textarea?.focus();
      });
    },
    openDirectory() {
      this.directoryVisible = true;
    },
    onDirectorySelect(path: string) {
      this.cwd = path;
    },
    onNewSession() {
      this.$store.dispatch('codingBridge/newSession');
      // Restore the last setup used on this device instead of resetting it all.
      this.restoreComposerPrefs();
      this.resetComposer();
    },
    // Pre-fill the composer from the last setup used on the current device.
    // Falls back to defaults for anything not recorded yet. Model and effort
    // are applied after the `provider` watcher's reset runs, so a restored
    // provider doesn't wipe them.
    restoreComposerPrefs() {
      const prefs = this.lastComposer;
      this.cwd = prefs.cwd ?? '';
      this.provider = prefs.provider ?? 'claude';
      this.permissionMode = prefs.permissionMode ?? 'bypassPermissions';
      this.customModelDraft = '';
      this.$nextTick(() => {
        this.model = prefs.model ?? '';
        this.effort = prefs.effort ?? '';
      });
    },
    scrollToBottom() {
      this.$nextTick(() => {
        const el = this.$refs.transcript as HTMLElement | undefined;
        if (el) {
          el.scrollTop = el.scrollHeight;
        }
      });
    },
    // Reveal an older page of the transcript, keeping the current scroll anchor.
    loadEarlier() {
      const el = this.$refs.transcript as HTMLElement | undefined;
      const prevHeight = el?.scrollHeight ?? 0;
      this.visibleCount += RENDER_PAGE;
      this.$nextTick(() => {
        if (el) {
          el.scrollTop = el.scrollHeight - prevHeight + el.scrollTop;
        }
      });
    }
  }
});
</script>

<style scoped lang="scss">
// Mobile-only devices entry in the header (replaces the old floating button).
.cb-devices-btn {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 1px solid var(--app-border-subtle);
  background: var(--app-content-bg);
  color: var(--app-text-subtle);
  font-size: 14px;
  cursor: pointer;
  transition:
    color 0.15s ease,
    border-color 0.15s ease;

  &:hover {
    color: var(--el-color-primary);
    border-color: var(--el-color-primary-light-5);
  }
}

// Restore skeleton: bubble/tool placeholders shaped like the real transcript.
.cb-skeleton {
  .cb-sk {
    border-radius: 8px;
  }
  .cb-sk--user {
    width: 55%;
    height: 38px;
  }
  .cb-sk--user-sm {
    width: 35%;
    height: 30px;
  }
  .cb-sk--tool {
    width: 100%;
    height: 64px;
  }
  // el-skeleton-item is inline-block by default; let the rect variants size.
  :deep(.el-skeleton__item) {
    display: block;
  }
}

// Docked pending-question panel. It shares the column with the transcript
// (which is `flex-1` and shrinks first); the card caps its own height via
// `--auq-max-height` and scrolls its options internally, so the action bar
// stays visible above the composer even on a short phone screen. `dvh` tracks
// the mobile browser's dynamic chrome.
.cb-question-dock {
  display: flex;
  flex-direction: column;
  min-height: 0;
  --auq-max-height: min(52dvh, 560px);
}

.cb-composer {
  position: relative;

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

    // iOS Safari auto-zooms a focused field whose font-size is below 16px and
    // ignores `maximum-scale` / `user-scalable=0`, so tapping into the composer
    // (or hitting Send, which keeps it focused) would zoom the whole page in.
    // Keep the mobile text at >=16px to suppress that — same fix as the chat
    // composer (#732).
    @media (max-width: 767px) {
      :deep(.el-textarea__inner) {
        font-size: 16px;
      }
    }
  }
}

// Working-directory picker: the folder-browse trigger lives inside the input
// as a suffix icon so it reads as one control instead of a detached button.
.cb-cwd-input {
  :deep(.el-input__wrapper) {
    border-radius: 9999px;
  }
}

.cb-cwd-browse {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--app-text-subtle);
  cursor: pointer;
  transition: color 0.15s ease;

  &:hover,
  &:focus-visible {
    color: var(--el-color-primary);
    outline: none;
  }
}

.cb-slash-menu {
  position: absolute;
  left: 0;
  right: 0;
  bottom: calc(100% + 6px);
  z-index: 20;
  max-height: 260px;
  overflow-y: auto;
  margin: 0;
  padding: 4px;
  list-style: none;
  border-radius: 12px;
  border: 1px solid var(--app-border-subtle);
  background: var(--app-content-bg);
  box-shadow: 0 8px 24px rgb(0 0 0 / 12%);

  &__item {
    display: flex;
    align-items: baseline;
    gap: 8px;
    padding: 6px 10px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 13px;
    color: var(--app-text);

    &--active {
      background: var(--app-content-hover-bg);
    }
  }

  &__name {
    flex: none;
    font-family: var(--el-font-family-mono, monospace);
    color: var(--el-color-primary);
  }

  &__hint {
    flex: none;
    font-size: 11px;
    color: var(--app-text-subtle);
  }

  &__desc {
    min-width: 0;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 12px;
    color: var(--app-text-subtle);
  }
}

.cb-edit-cancel {
  flex: none;
  color: var(--app-text-subtle);
  cursor: pointer;
  transition: color 0.15s ease;

  &:hover {
    color: var(--el-color-primary);
  }
}

.cb-restore-code {
  height: auto;

  :deep(.el-checkbox__label) {
    font-size: 12px;
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
