<template>
  <div v-loading="loading" class="preview-root">
    <!-- Toolbar -->
    <div class="toolbar">
      <span class="path-display">{{ path || '—' }}</span>
      <span v-if="size" class="size-display">{{ humanSize(size) }}</span>

      <span class="toolbar-spacer" />

      <!-- Save button — only meaningful when editable and dirty.
           Lives outside the tabs because both views share one buffer. -->
      <el-button
        v-if="editable"
        type="primary"
        size="small"
        :disabled="!dirty || saving"
        :loading="saving"
        @click="onSave"
      >
        <save-icon class="mr-1" :size="16" aria-hidden="true" focusable="false" />
        {{ $t('skill.button.save') }}
      </el-button>

      <el-tooltip
        :visible="copied"
        :content="copied ? $t('skill.preview.copied') : $t('skill.preview.copy')"
        placement="top-start"
      >
        <el-button
          size="small"
          circle
          :disabled="!textContent"
          :aria-label="copied ? $t('skill.preview.copied') : $t('skill.preview.copy')"
          :title="copied ? $t('skill.preview.copied') : $t('skill.preview.copy')"
          @click="onCopy"
        >
          <success-icon v-if="copied" :size="16" aria-hidden="true" focusable="false" />
          <copy-icon v-else :size="16" aria-hidden="true" focusable="false" />
        </el-button>
      </el-tooltip>
    </div>

    <!-- Tab strip — only shown for files that have BOTH a rendered AND a source view.
         For binary / image / plain code we hide it (one view is all there is). -->
    <el-tabs v-if="canRender" v-model="viewMode" class="view-tabs">
      <el-tab-pane name="rendered">
        <template #label>
          <view-icon class="mr-1" :size="16" aria-hidden="true" focusable="false" />
          {{ $t('skill.preview.viewRendered') }}
        </template>
      </el-tab-pane>
      <el-tab-pane name="source">
        <template #label>
          <code-icon class="mr-1" :size="16" aria-hidden="true" focusable="false" />
          {{ $t('skill.preview.viewSource') }}
        </template>
      </el-tab-pane>
    </el-tabs>

    <!-- Body -->
    <div class="body">
      <div v-if="error" class="error">
        <warning-icon class="mr-2" :size="16" aria-hidden="true" focusable="false" />
        {{ error }}
      </div>

      <!-- Markdown rendered -->
      <vue-markdown
        v-else-if="kind === 'markdown' && viewMode === 'rendered'"
        class="markdown-rendered"
        :source="textContent"
        sanitize
      />

      <!-- HTML iframe sandbox (no JS) -->
      <iframe
        v-else-if="kind === 'html' && viewMode === 'rendered'"
        ref="htmlFrame"
        class="html-frame"
        sandbox=""
        :srcdoc="textContent"
      />

      <!-- Image -->
      <div v-else-if="kind === 'image'" class="image-pane">
        <img :src="imageUrl" :alt="path" class="image-content" />
      </div>

      <!-- Binary fallback -->
      <div v-else-if="kind === 'binary'" class="binary">
        <file-icon class="binary-icon" size="1em" aria-hidden="true" focusable="false" />
        <p>{{ $t('skill.preview.binary', { type: contentType }) }}</p>
      </div>

      <!-- Editable source: textarea bound to textContent (the mutation
           re-renders the markdown preview live the moment the user
           switches back to the rendered tab). -->
      <textarea
        v-else-if="editable"
        v-model="textContent"
        class="source-editor"
        spellcheck="false"
        :placeholder="$t('skill.placeholder.content')"
        @input="dirty = true"
      />

      <!-- Read-only source / code: monospace, syntax-highlighted -->
      <pre v-else class="source-pane"><code ref="codeEl" :class="hljsLang">{{ truncatedText }}</code></pre>

      <p v-if="truncated" class="truncated-warning">
        {{ $t('skill.preview.truncated', { size: humanSize(MAX_PREVIEW_BYTES) }) }}
      </p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { ElButton, ElTooltip, ElTabs, ElTabPane, ElMessage, vLoading } from 'element-plus';
import {
  CodeIcon,
  CopyIcon,
  FileIcon,
  SaveIcon,
  SuccessIcon,
  ViewIcon,
  WarningIcon
} from '@acedatacloud/core/icons/components';
import VueMarkdown from '@/components/common/VueMarkdown.vue';
import hljs from 'highlight.js/lib/core';
import bash from 'highlight.js/lib/languages/bash';
import css from 'highlight.js/lib/languages/css';
import go from 'highlight.js/lib/languages/go';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import markdown from 'highlight.js/lib/languages/markdown';
import python from 'highlight.js/lib/languages/python';
import rust from 'highlight.js/lib/languages/rust';
import shell from 'highlight.js/lib/languages/shell';
import sql from 'highlight.js/lib/languages/sql';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml'; // covers HTML
import yaml from 'highlight.js/lib/languages/yaml';
import { skillOperator } from '@/operators/skill';
import 'highlight.js/styles/github.css';

// Register a curated subset of languages — enough for the file types skills
// commonly ship. Extra ~30 KB gzip; acceptable for a developer-facing page.
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('css', css);
hljs.registerLanguage('go', go);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('json', json);
hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('python', python);
hljs.registerLanguage('rust', rust);
hljs.registerLanguage('shell', shell);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('yaml', yaml);
hljs.registerAliases(['yml'], { languageName: 'yaml' });
hljs.registerAliases(['ts', 'tsx'], { languageName: 'typescript' });
hljs.registerAliases(['js', 'jsx'], { languageName: 'javascript' });
hljs.registerAliases(['py'], { languageName: 'python' });
hljs.registerAliases(['rs'], { languageName: 'rust' });
hljs.registerAliases(['sh', 'zsh'], { languageName: 'bash' });

type PreviewKind = 'markdown' | 'html' | 'image' | 'code' | 'text' | 'binary';

const MAX_PREVIEW_BYTES = 1_000_000; // 1 MB — anything larger gets truncated client-side

function detectKind(path: string, contentType: string): PreviewKind {
  const ext = (path.split('.').pop() || '').toLowerCase();
  if (ext === 'md' || contentType.startsWith('text/markdown')) return 'markdown';
  if (ext === 'html' || ext === 'htm' || contentType.startsWith('text/html')) return 'html';
  if (contentType.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) {
    return 'image';
  }
  if (contentType.startsWith('text/') || ['json', 'application/json'].includes(contentType.split(';')[0])) {
    return ext ? 'code' : 'text';
  }
  return 'binary';
}

function detectLanguage(path: string): string {
  const ext = (path.split('.').pop() || '').toLowerCase();
  // Map common extensions hljs already knows.
  return hljs.getLanguage(ext) ? ext : 'plain';
}

export default defineComponent({
  name: 'SkillFilePreview',
  components: {
    ElButton,
    ElTooltip,
    ElTabs,
    ElTabPane,
    CodeIcon,
    CopyIcon,
    FileIcon,
    SaveIcon,
    SuccessIcon,
    ViewIcon,
    WarningIcon,
    VueMarkdown
  },
  directives: { loading: vLoading },
  props: {
    skillId: {
      type: String,
      required: true
    },
    path: {
      type: String as PropType<string>,
      required: true
    },
    /** When true, SKILL.md becomes editable inline. The component emits
     *  `save` with the buffer contents; the parent is responsible for
     *  PATCH-ing the skill and clearing `dirty` via the `saved` prop
     *  refresh on the next fetch. */
    editable: {
      type: Boolean,
      default: false
    }
  },
  emits: ['save'],
  data() {
    return {
      MAX_PREVIEW_BYTES,
      loading: false,
      error: '',
      contentType: '',
      size: 0,
      textContent: '',
      imageUrl: '',
      truncated: false,
      viewMode: 'rendered' as 'rendered' | 'source',
      dirty: false,
      saving: false,
      copied: false,
      copiedTimer: undefined as number | undefined
    };
  },
  computed: {
    kind(): PreviewKind {
      if (!this.path) return 'text';
      return detectKind(this.path, this.contentType);
    },
    canRender(): boolean {
      return this.kind === 'markdown' || this.kind === 'html';
    },
    hljsLang(): string {
      return `language-${detectLanguage(this.path)}`;
    },
    truncatedText(): string {
      return this.textContent;
    }
  },
  watch: {
    path: {
      handler() {
        this.fetch();
      },
      immediate: true
    }
  },
  beforeUnmount() {
    if (this.imageUrl) URL.revokeObjectURL(this.imageUrl);
    if (this.copiedTimer !== undefined) window.clearTimeout(this.copiedTimer);
  },
  methods: {
    humanSize(bytes: number): string {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
    },
    async fetch() {
      if (!this.path) return;
      this.copied = false;
      if (this.copiedTimer !== undefined) {
        window.clearTimeout(this.copiedTimer);
        this.copiedTimer = undefined;
      }
      this.loading = true;
      this.error = '';
      this.textContent = '';
      this.truncated = false;
      this.dirty = false;
      if (this.imageUrl) {
        URL.revokeObjectURL(this.imageUrl);
        this.imageUrl = '';
      }
      try {
        const { blob, contentType } = await skillOperator.fetchFile(this.skillId, this.path);
        this.contentType = contentType;
        this.size = blob.size;
        const kind = detectKind(this.path, contentType);

        if (kind === 'image') {
          // Object URL — cleaned up in beforeUnmount and on next fetch().
          this.imageUrl = URL.createObjectURL(blob);
        } else if (kind === 'binary') {
          // No content read; just show the placeholder.
        } else {
          // Read as text. Truncate at MAX_PREVIEW_BYTES to keep the renderer snappy.
          let text = await blob.text();
          if (text.length > MAX_PREVIEW_BYTES) {
            text = text.slice(0, MAX_PREVIEW_BYTES);
            this.truncated = true;
          }
          this.textContent = text;
          // Default mode: rendered for md/html, source otherwise.
          this.viewMode = kind === 'markdown' || kind === 'html' ? 'rendered' : 'source';
        }
      } catch (err: unknown) {
        const e = err as { response?: { status?: number; data?: { detail?: string } } };
        const status = e?.response?.status;
        const detail = e?.response?.data?.detail || String(err);
        this.error = status ? `(${status}) ${detail}` : detail;
      } finally {
        this.loading = false;
        this.$nextTick(() => this.applyHighlight());
      }
    },
    applyHighlight() {
      // Apply hljs to the source pane lazily after the DOM updates.
      const el = this.$refs.codeEl as HTMLElement | undefined;
      if (el && this.kind === 'code' && this.viewMode !== 'rendered') {
        // hljs sets dataset.highlighted on first run; clear it so re-highlighting
        // works when the user navigates to another file in the same panel.
        delete el.dataset.highlighted;
        hljs.highlightElement(el);
      }
    },
    async onCopy() {
      if (!this.textContent) return;
      try {
        await navigator.clipboard.writeText(this.textContent);
        this.copied = true;
        if (this.copiedTimer !== undefined) window.clearTimeout(this.copiedTimer);
        this.copiedTimer = window.setTimeout(() => {
          this.copied = false;
          this.copiedTimer = undefined;
        }, 3000);
        ElMessage.success(this.$t('skill.preview.copied'));
      } catch {
        ElMessage.error(this.$t('skill.preview.copyFailed'));
      }
    },
    async onSave() {
      // Hand the buffer up to the parent — saving lives there because the
      // file-fetch endpoint is read-only and the actual PATCH targets
      // `Skill.content` on the row, not the bundle. The parent calls us
      // back via :saving prop or just re-fetches; we clear dirty on
      // success.
      this.saving = true;
      try {
        await new Promise<void>((resolve, reject) => {
          this.$emit('save', this.textContent, { resolve, reject });
        });
        this.dirty = false;
      } catch {
        // Parent already showed the error toast.
      } finally {
        this.saving = false;
      }
    }
  }
});
</script>

<style scoped>
.preview-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-light);
}

.path-display {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 13px;
  color: var(--el-text-color-primary);
}

.size-display {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.toolbar-spacer {
  flex: 1;
}

/* Tab strip sits between toolbar and body. Strip the default padding so
   it lines up with the toolbar's edges and reserves no body space. */
.view-tabs {
  flex-shrink: 0;
  padding: 0 12px;
  background: var(--el-fill-color-light);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.view-tabs :deep(.el-tabs__header) {
  margin: 0;
}

.view-tabs :deep(.el-tabs__nav-wrap)::after {
  /* Hide the el-tabs default underline; we already have a border-bottom. */
  height: 0;
}

.body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 16px;
  background: var(--el-bg-color);
}

.error {
  color: var(--el-color-danger);
  padding: 16px;
  border: 1px solid var(--el-color-danger-light-7);
  border-radius: 4px;
  background: var(--el-color-danger-light-9);
}

.html-frame {
  width: 100%;
  height: 100%;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  background: white;
}

.image-pane {
  display: flex;
  justify-content: center;
  align-items: center;
}

.image-content {
  max-width: 100%;
  max-height: 600px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
}

.binary {
  text-align: center;
  color: var(--el-text-color-secondary);
  padding: 48px 0;
}

.binary-icon {
  width: 48px;
  height: 48px;
  margin-right: auto;
  margin-bottom: 12px;
  margin-left: auto;
  display: block;
}

.source-pane {
  margin: 0;
  font-size: 12px;
  background: var(--el-fill-color-lighter);
  padding: 12px;
  border-radius: 4px;
  overflow: auto;
  white-space: pre;
}

/* Inline editor for SKILL.md. Same monospace look as the read-only pane
   so toggling between Preview / Source feels seamless. */
.source-editor {
  width: 100%;
  min-height: 60vh;
  margin: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;
  font-size: 13px;
  line-height: 1.5;
  background: var(--el-fill-color-lighter);
  color: var(--el-text-color-primary);
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  resize: vertical;
}

.source-editor:focus {
  outline: none;
  border-color: var(--el-color-primary);
}

.truncated-warning {
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-color-warning);
}

/* Markdown rendered styling — keep it readable, don't try to be flashy. */
.markdown-rendered {
  font-size: 14px;
  line-height: 1.6;
  color: var(--el-text-color-primary);
}

.markdown-rendered :deep(h1),
.markdown-rendered :deep(h2),
.markdown-rendered :deep(h3),
.markdown-rendered :deep(h4) {
  font-weight: 600;
  margin: 1em 0 0.5em;
}

.markdown-rendered :deep(h1) {
  font-size: 1.6em;
}

.markdown-rendered :deep(h2) {
  font-size: 1.3em;
}

.markdown-rendered :deep(h3) {
  font-size: 1.15em;
}

.markdown-rendered :deep(p) {
  margin: 0.5em 0;
}

.markdown-rendered :deep(code) {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.9em;
  background: var(--el-fill-color);
  padding: 1px 4px;
  border-radius: 3px;
}

.markdown-rendered :deep(pre code) {
  display: block;
  background: transparent;
  padding: 0;
}

.markdown-rendered :deep(pre) {
  background: var(--el-fill-color-lighter);
  padding: 12px;
  border-radius: 4px;
  overflow: auto;
}

.markdown-rendered :deep(table) {
  border-collapse: collapse;
  margin: 1em 0;
}

.markdown-rendered :deep(table th),
.markdown-rendered :deep(table td) {
  border: 1px solid var(--el-border-color-lighter);
  padding: 6px 12px;
  text-align: left;
}

.markdown-rendered :deep(table th) {
  background: var(--el-fill-color);
  font-weight: 600;
}

.markdown-rendered :deep(blockquote) {
  border-left: 3px solid var(--el-border-color);
  margin: 1em 0;
  padding: 0 1em;
  color: var(--el-text-color-secondary);
}

.markdown-rendered :deep(ul),
.markdown-rendered :deep(ol) {
  padding-left: 1.5em;
  margin: 0.5em 0;
}
</style>
