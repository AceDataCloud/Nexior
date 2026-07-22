<template>
  <div class="composer">
    <!-- Hidden el-upload: only used for its file-picker + upload pipeline.
         The file list is rendered separately above the textarea (see
         .file-previews below) and the trigger is fired programmatically
         from the + popover. -->
    <el-upload
      ref="uploader"
      v-model:file-list="fileList"
      class="upload-hidden"
      :accept="extensions"
      :disabled="(!isFileSupported && !isImageSupported) || answering"
      name="file"
      :limit="10"
      :multiple="true"
      :action="uploadUrl"
      :show-file-list="false"
      :on-exceed="onExceed"
      :on-error="onError"
      :on-progress="onProgress"
      :headers="headers"
    >
      <span ref="uploadTrigger" class="upload-trigger" aria-hidden="true"></span>
    </el-upload>
    <div v-if="fileList.length > 0" class="file-previews">
      <template v-for="file in fileList" :key="file.uid">
        <image-preview
          v-if="isImageUrl(file.name)"
          :url="file.url || (file.response as any)?.file_url"
          :name="file.name"
          :percentage="file.percentage"
          @remove="fileList.splice(fileList.indexOf(file), 1)"
        />
        <file-preview
          v-else
          :name="file.name"
          :percentage="file.percentage"
          @remove="fileList.splice(fileList.indexOf(file), 1)"
        />
      </template>
    </div>
    <textarea
      ref="textarea"
      v-model="questionValue"
      :disabled="answering"
      class="input"
      :placeholder="$t('chat.message.newMessagePlaceholder')"
      :style="{ height: inputHeight }"
      @keydown.enter="onEnterKey"
      @input="adjustTextareaHeight"
    ></textarea>
    <div class="tools">
      <el-dropdown trigger="click" placement="top-start" :hide-on-click="true" popper-class="composer-plus-popper">
        <!--
          NOTE: el-dropdown and el-tooltip both rely on el-popper internally,
          and each needs its OWN single-element trigger reference. Nesting
          el-tooltip directly inside el-dropdown causes the inner popper to
          steal the ref and the dropdown click handler never fires. We give
          el-dropdown a dedicated <span> wrapper, and el-tooltip its own.
        -->
        <span class="btn-plus-trigger">
          <el-tooltip class="box-item" effect="dark" :content="$t('chat.composer.addAction')" placement="top">
            <button
              type="button"
              :class="{ btn: true, 'btn-plus': true, disabled: answering }"
              :disabled="answering"
              :aria-label="$t('chat.composer.addAction')"
              :title="$t('chat.composer.addAction')"
            >
              <add-icon class="icon icon-plus" :size="'1em' as any" aria-hidden="true" focusable="false" />
            </button>
          </el-tooltip>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item :disabled="(!isFileSupported && !isImageSupported) || answering" @click="onTriggerUpload">
              <file-text-icon class="menu-icon" :size="'1em' as any" aria-hidden="true" focusable="false" />
              <span>{{ $t('chat.composer.addFiles') }}</span>
            </el-dropdown-item>
            <el-dropdown-item @click="onOpenSkills">
              <magic-icon class="menu-icon" :size="'1em' as any" aria-hidden="true" focusable="false" />
              <span>{{ $t('chat.composer.skills') }}</span>
              <external-link-icon class="menu-external" :size="'1em' as any" aria-hidden="true" focusable="false" />
            </el-dropdown-item>
            <el-dropdown-item @click="onOpenConnections">
              <connection-icon class="menu-icon" :size="'1em' as any" aria-hidden="true" focusable="false" />
              <span>{{ $t('chat.composer.connections') }}</span>
              <external-link-icon class="menu-external" :size="'1em' as any" aria-hidden="true" focusable="false" />
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <el-tooltip
        v-if="isVoiceCallSupported"
        class="box-item"
        effect="dark"
        :content="$t('realtime.callTooltip')"
        placement="top"
      >
        <span
          :class="{ btn: true, 'btn-voice': true }"
          role="button"
          tabindex="0"
          :aria-label="$t('realtime.callTooltip')"
          :title="$t('realtime.callTooltip')"
          @click="onStartCall"
          @keydown.enter.prevent="onStartCall"
          @keydown.space.prevent="onStartCall"
        >
          <microphone-icon class="icon icon-voice" :size="'1em' as any" aria-hidden="true" focusable="false" />
        </span>
      </el-tooltip>
    </div>
    <el-button
      :disabled="answering || !questionValue || uploading || !ready"
      type="primary"
      :aria-label="$t('common.button.send')"
      :title="$t('common.button.send')"
      :class="{
        btn: true,
        'btn-send': true
      }"
      @click="onSubmit"
    >
      <up-icon class="icon icon-send" :size="'1em' as any" aria-hidden="true" focusable="false" />
    </el-button>
    <el-button
      v-show="answering"
      :disabled="!answering"
      type="primary"
      :aria-label="$t('common.button.stop')"
      :title="$t('common.button.stop')"
      :class="{
        btn: true,
        'btn-stop': true
      }"
      @click="onStop"
    >
      <stop-icon class="icon icon-stop" :size="'1em' as any" aria-hidden="true" focusable="false" />
    </el-button>
  </div>
</template>

<script lang="ts">
import {
  AddIcon,
  ConnectionIcon,
  ExternalLinkIcon,
  FileTextIcon,
  MagicIcon,
  MicrophoneIcon,
  StopIcon,
  UpIcon
} from '@acedatacloud/core/icons/components';
import { defineComponent } from 'vue';
import {
  ElMessage,
  ElTooltip,
  ElUpload,
  UploadFile,
  UploadProgressEvent,
  ElButton,
  ElDropdown,
  ElDropdownMenu,
  ElDropdownItem
} from 'element-plus';
import { IChatModel, IChatReference } from '@/models';
import {
  getBaseUrlPlatform,
  isImageUrl,
  pasteUploadMixin,
  uploadTrackerMixin,
  withCurrentUserIdAndSite
} from '@/utils';
import { getSendShortcut } from '@/utils/composer';
import FilePreview from '@/components/common/FilePreview.vue';
import ImagePreview from '@/components/common/ImagePreview.vue';
import { ROUTE_CHATGPT_CALL } from '@/router/constants';

export default defineComponent({
  name: 'Composer',
  components: {
    AddIcon,
    ConnectionIcon,
    ExternalLinkIcon,
    FileTextIcon,
    MagicIcon,
    MicrophoneIcon,
    StopIcon,
    UpIcon,
    FilePreview,
    ImagePreview,
    ElTooltip,
    ElUpload,
    ElButton,
    ElDropdown,
    ElDropdownMenu,
    ElDropdownItem
  },
  mixins: [pasteUploadMixin, uploadTrackerMixin],
  props: {
    answering: {
      type: Boolean,
      required: false,
      default: false
    },
    ready: {
      type: Boolean,
      required: false,
      default: true
    },
    references: {
      type: Array,
      required: false,
      default: () => []
    },
    question: {
      type: String,
      required: true
    }
  },
  emits: ['update:question', 'update:references', 'submit', 'stop'],
  data() {
    return {
      inputHeight: '35px',
      questionValue: this.question || '',
      fileList: [] as UploadFile[],
      uploadUrl: getBaseUrlPlatform() + '/api/v1/files/'
    };
  },
  computed: {
    model(): IChatModel {
      return this.$store.state.chat.model;
    },
    modelGroup() {
      return this.$store.state.chat.modelGroup;
    },
    isVoiceCallSupported(): boolean {
      // The realtime voice call route + store only exist for ChatGPT, so the
      // mic button stays hidden for other model groups (Grok, Gemini, …).
      return this.modelGroup?.isVoiceCallSupported ?? false;
    },
    isFileSupported() {
      return this.model?.isFileSupported;
    },
    isImageSupported() {
      return this.model?.isImageSupported;
    },
    headers() {
      return {
        Authorization: `Bearer ${this.$store.state.token.access}`
      };
    },
    // Fully-formed `{ url, name }` references derived from the upload
    // pipeline. Emitted as a single value to the parent so it can both
    // POST the URLs to the chat API and render the original filename in
    // the user message bubble (see Message.vue / IChatReference).
    refs(): IChatReference[] {
      const out: IChatReference[] = [];
      for (const file of this.fileList) {
        // @ts-ignore — el-upload types `response` as unknown.
        const url = file?.response?.file_url as string | undefined;
        if (!url) continue;
        const response = file.response as Record<string, unknown>;
        const reference: IChatReference = file?.name ? { url, name: file.name } : { url };
        if (
          typeof response.file_id === 'string' &&
          typeof response.sha256 === 'string' &&
          typeof response.mime === 'string' &&
          typeof response.size === 'number'
        ) {
          Object.assign(reference, {
            file_id: response.file_id,
            sha256: response.sha256,
            mime: response.mime,
            size: response.size
          });
        }
        out.push(reference);
      }
      return out;
    },
    uploading() {
      // Gate on the reliable `status` field, NOT `percentage`. A tiny file (e.g. a
      // .txt) can finish so fast the browser fires no final progress event, so
      // element-plus leaves `percentage` < 100 on a fully-uploaded file — which
      // used to pin `uploading` true and grey the send button forever. Failed
      // uploads are auto-removed by element-plus, so only in-flight files count.
      return this.fileList.some((file) => file.status === 'ready' || file.status === 'uploading');
    },
    extensions() {
      if (this.isFileSupported === false && this.isImageSupported === true) {
        return '.png,.jpg,.jpeg,.gif,.bmp,.webp,.svg,.tiff,.ico,.heic';
      }
      return undefined;
    },
    pasteAccept(): string {
      // Restrict clipboard paste to images (still useful even when other file
      // types are supported). The upload control itself will continue to
      // accept anything via the file picker.
      return '.png,.jpg,.jpeg,.gif,.bmp,.webp,.svg,.tiff,.ico,.heic,image/*';
    }
  },
  watch: {
    refs(val: IChatReference[]) {
      console.debug('References:', val);
      this.$emit('update:references', val);
    },
    questionValue(val: string) {
      this.$emit('update:question', val.trim());
    },
    question(val: string) {
      if (val !== this.questionValue) {
        this.questionValue = val;
      }
    },
    references(val: IChatReference[]) {
      console.debug('References updated:', val);
      if (val.length === 0) {
        this.fileList = [];
      }
    },
    isFileSupported(val, oldVal) {
      if (oldVal && !val) {
        this.fileList = [];
      }
    }
  },
  methods: {
    isImageUrl,
    onStartCall() {
      this.$router.push({ name: ROUTE_CHATGPT_CALL });
    },
    // add textarea method
    adjustTextareaHeight() {
      this.$nextTick(() => {
        const textarea = this.$refs.textarea;
        if (textarea) {
          // @ts-ignore
          textarea.style.height = '35px';
          // @ts-ignore
          textarea.style.height = textarea.scrollHeight + 'px';
        }
      });
    },
    onSubmit() {
      if (!this.question || this.uploading || !this.ready) {
        return;
      }
      this.$emit('submit');
    },
    onEnterKey(e: KeyboardEvent) {
      // Never send while an IME is composing (Enter confirms the candidate).
      if (e.isComposing || e.keyCode === 229) {
        return;
      }
      // Shift+Enter always inserts a newline.
      if (e.shiftKey) {
        return;
      }
      const withMod = e.metaKey || e.ctrlKey;
      const shouldSend =
        getSendShortcut() === 'mod-enter'
          ? // ⌘/Ctrl+Enter sends; plain or Alt+Enter inserts a newline.
            withMod
          : // Plain Enter sends; any modifier (⌘/Ctrl/Alt) inserts a newline,
            // preserving the previous @keydown.enter.exact behaviour.
            !withMod && !e.altKey;
      if (!shouldSend) {
        // Let the keystroke insert a newline instead of sending.
        return;
      }
      e.preventDefault();
      this.onSubmit();
    },
    onStop() {
      this.$emit('stop');
    },
    onProgress(event: UploadProgressEvent, uploadFile: UploadFile) {
      console.debug('File upload progress:', uploadFile.name, event.loaded, event.total, uploadFile.percentage);
    },
    onExceed() {
      ElMessage.warning(this.$t('chat.message.uploadReferencesExceed'));
    },
    onError() {
      ElMessage.error(this.$t('chat.message.uploadReferencesError'));
    },
    onTriggerUpload() {
      if ((!this.isFileSupported && !this.isImageSupported) || this.answering) {
        return;
      }
      // Programmatically open the native file picker that el-upload owns.
      // We hide el-upload's UI and render the file list ourselves above
      // the textarea, so the dropdown menu item has to forward the click
      // to el-upload's <input type="file">.
      this.$nextTick(() => {
        const root = (this.$refs.uploader as any)?.$el as HTMLElement | undefined;
        const input =
          (root?.querySelector('input.el-upload__input') as HTMLInputElement | null) ||
          (root?.querySelector('input[type="file"]') as HTMLInputElement | null);
        input?.click();
      });
    },
    onOpenSkills() {
      // Skills are managed exclusively at auth.acedata.cloud/user/skills.
      // Nexior is a thin entry point - clicking opens the canonical
      // management page in a new tab. Pass `site` so AuthFrontend renders
      // the calling subsite's white-label logo (no-op on the main host).
      window.open(withCurrentUserIdAndSite('https://auth.acedata.cloud/user/skills'), '_blank', 'noopener');
    },
    onOpenConnections() {
      // Connections (MCP + OAuth connectors) are managed exclusively at
      // auth.acedata.cloud/user/connections.
      window.open(withCurrentUserIdAndSite('https://auth.acedata.cloud/user/connections'), '_blank', 'noopener');
    }
  }
});
</script>

<style lang="scss">
textarea.input {
  font-size: 14px;
  min-height: 55px;
  max-height: 150px;
  border: none;
  background: none;
  box-shadow: none;
  resize: none;
  line-height: 25px;
  width: calc(100% - 80px);
  font-family: var(--el-font-family);
  padding-top: 6px;
}
/* The composer wrapper shows focus via its own :focus-within border, so the
   native textarea must not also get the shared-adapter :focus-visible outline
   (@acedatacloud/core controls.css). Match html:root body to beat its specificity. */
html:root body textarea.input:focus,
html:root body textarea.input:focus-visible {
  outline: none;
}
.composer {
  position: relative;
  .input {
    textarea {
      max-height: 100px;
      border: none;
      background: none;
      box-shadow: none;
      resize: none;
      line-height: 35px;
    }
  }

  .el-textarea.is-disabled .el-textarea__inner {
    background-color: initial;
  }
}
.composer-plus-popper {
  .menu-icon {
    width: 16px;
    margin-right: 8px;
    color: var(--el-text-color-regular);
  }
  .menu-external {
    margin-left: 8px;
    font-size: 11px;
    color: var(--el-text-color-secondary);
  }
}
</style>

<style lang="scss" scoped>
.composer {
  width: 100%;
  max-width: 800px;
  margin: auto;
  position: relative;
  border-radius: 26px;
  // Plain surface, like ChatGPT's composer — let the page background show
  // through cleanly instead of a tinted color-mix() that blurs the edge.
  background-color: var(--el-bg-color);
  // Thin hairline + a very soft drop shadow. The previous rule used
  // `var(--app-shadow-md)` which is not defined anywhere in the codebase,
  // so the browser was rendering an unintended fallback that looked fuzzy.
  border: 1px solid var(--el-border-color-lighter);
  box-shadow:
    0 2px 6px rgba(0, 0, 0, 0.04),
    0 1px 2px rgba(0, 0, 0, 0.04);
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
  padding: 6px;

  &:focus-within {
    border-color: var(--el-border-color);
    box-shadow:
      0 4px 12px rgba(0, 0, 0, 0.06),
      0 1px 3px rgba(0, 0, 0, 0.05);
  }

  .upload-hidden {
    position: absolute;
    width: 0;
    height: 0;
    overflow: hidden;
    pointer-events: none;
  }
  .upload-trigger {
    display: block;
    width: 0;
    height: 0;
  }
  .file-previews {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    padding: 6px 8px 0;
    margin-bottom: 4px;
  }
  .input {
    border: none;
    width: calc(100% - 16px);
    margin-left: 8px;
    margin-top: 5px;
    font-size: 16px;
    margin-bottom: 50px;
  }
  .tools {
    position: absolute;
    left: 12px;
    bottom: 12px;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 6px;
    .btn-plus-trigger {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      user-select: none;
      &.btn-plus {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background-color: var(--el-fill-color-light);
        color: var(--el-text-color-primary);
        font-size: 16px;
        transition: background-color 0.15s ease;
        &:hover {
          background-color: var(--el-fill-color);
        }
        &.disabled {
          cursor: not-allowed;
          color: var(--el-text-color-disabled) !important;
          background-color: var(--el-fill-color-lighter);
          .icon-plus {
            color: var(--el-text-color-disabled) !important;
          }
        }
        .icon-plus {
          font-size: 16px;
        }
      }
      &.btn-voice {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background-color: var(--el-fill-color-light);
        color: var(--el-text-color-primary);
        font-size: 15px;
        transition: background-color 0.15s ease;
        &:hover {
          background-color: var(--el-fill-color);
        }
      }
    }
  }
  .btn-send,
  .btn-stop {
    --el-button-bg-color: var(--el-color-primary);
    --el-button-border-color: var(--el-color-primary);
    --el-button-outline-color: var(--el-color-primary-dark-2);
    --el-button-active-color: var(--el-color-primary-dark-2);
    --el-button-hover-text-color: var(--el-color-white);
    --el-button-hover-link-text-color: var(--el-color-primary-dark-2);
    --el-button-hover-bg-color: var(--el-color-primary-dark-2);
    --el-button-hover-border-color: var(--el-color-primary-dark-2);
    --el-button-active-bg-color: var(--el-color-primary-dark-2);
    --el-button-active-border-color: var(--el-color-primary-dark-2);
    --el-button-disabled-text-color: var(--el-color-white);
    --el-button-disabled-bg-color: var(--el-color-primary-light-5);
    --el-button-disabled-border-color: var(--el-color-primary-light-5);
    position: absolute;
    bottom: 12px;
    right: 12px;
    border-radius: 50%;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    transition: box-shadow 0.2s ease;
    &:hover:not(:disabled) {
      box-shadow: 0 0 16px rgba(var(--app-brand-rgb), 0.3);
    }
  }
}

@media (max-width: 767px) {
  .composer {
    border-radius: 18px;
    .input {
      margin-bottom: 46px;
      // iOS Safari auto-zooms focused form fields whose font-size is below
      // 16px (and ignores `maximum-scale` / `user-scalable=0` in the viewport
      // meta for accessibility reasons), so tapping the Send button — which
      // keeps the textarea focused — would zoom the whole page in. Keep the
      // mobile composer text at >=16px to suppress that behaviour.
      font-size: 16px;
    }

    .tools {
      left: 10px;
      bottom: 10px;
      .btn.btn-plus {
        width: 32px;
        height: 32px;
        font-size: 14px;
      }
    }

    .btn-send,
    .btn-stop {
      right: 10px;
      bottom: 10px;
      width: 32px;
      height: 32px;
    }
  }
}
</style>
