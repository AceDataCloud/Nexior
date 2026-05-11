<template>
  <div class="h-full overflow-y-auto p-6">
    <!-- Loading skeleton -->
    <div v-if="running" class="max-w-4xl mx-auto py-4">
      <div class="flex items-center gap-2 mb-3 text-[var(--el-color-primary)] text-sm">
        <font-awesome-icon icon="fa-solid fa-circle-notch" spin />
        <span>{{ $t('webextrator.message.running') }}</span>
      </div>
      <div class="mb-6 animate-pulse">
        <div class="h-5 w-3/5 rounded bg-[var(--el-fill-color-dark)] mb-2" />
        <div class="h-3 w-2/5 rounded bg-[var(--el-fill-color)] mb-4" />
        <div class="h-64 w-full rounded bg-[var(--el-fill-color)] mb-3" />
        <div class="h-3 w-full rounded bg-[var(--el-fill-color)] mb-1" />
        <div class="h-3 w-5/6 rounded bg-[var(--el-fill-color)] mb-1" />
        <div class="h-3 w-4/6 rounded bg-[var(--el-fill-color)]" />
      </div>
    </div>

    <!-- Empty / initial state -->
    <div
      v-else-if="!response && !errorMessage"
      class="flex flex-col items-center justify-center py-24 text-[var(--el-text-color-disabled)]"
    >
      <font-awesome-icon icon="fa-solid fa-globe" class="text-6xl mb-4 opacity-30" />
      <p class="text-base mb-1">{{ $t('webextrator.description.intro') }}</p>
      <p class="text-xs opacity-70">{{ $t('webextrator.description.introHint') }}</p>
    </div>

    <!-- Error state -->
    <div v-else-if="errorMessage" class="max-w-4xl mx-auto py-4">
      <el-alert type="error" :closable="false" show-icon :title="$t('webextrator.message.failed')">
        <pre class="text-xs whitespace-pre-wrap break-words">{{ errorMessage }}</pre>
      </el-alert>
    </div>

    <!-- Success result -->
    <div v-else-if="data" class="max-w-4xl mx-auto">
      <!-- Header: title, final URL, status, elapsed -->
      <header class="mb-4">
        <h1 class="text-xl font-semibold leading-snug mb-1 break-words text-[var(--el-text-color-primary)]">
          {{ data.title || $t('webextrator.message.untitled') }}
        </h1>
        <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--el-text-color-secondary)]">
          <a
            v-if="finalUrl"
            :href="finalUrl"
            target="_blank"
            rel="noopener"
            class="hover:underline truncate max-w-[60%]"
          >
            <font-awesome-icon icon="fa-solid fa-up-right-from-square" class="mr-1" />{{ finalUrl }}
          </a>
          <span v-if="renderData?.status">
            <font-awesome-icon icon="fa-solid fa-signal" class="mr-1" />{{ renderData.status }}
          </span>
          <span v-if="response?.elapsed">
            <font-awesome-icon icon="fa-solid fa-clock" class="mr-1" />{{ response.elapsed.toFixed(2) }}s
          </span>
          <span v-if="contentTypeLabel">
            <font-awesome-icon icon="fa-solid fa-tag" class="mr-1" />{{ contentTypeLabel }}
          </span>
        </div>
        <p
          v-if="extractData?.description"
          class="mt-2 text-sm text-[var(--el-text-color-regular)] leading-relaxed line-clamp-3"
        >
          {{ extractData.description }}
        </p>
      </header>

      <!-- Screenshot if available -->
      <figure v-if="screenshotSrc" class="mb-5">
        <el-image
          :src="screenshotSrc"
          fit="contain"
          :preview-src-list="[screenshotSrc]"
          preview-teleported
          hide-on-click-modal
          class="w-full max-h-[480px] rounded border border-[var(--app-border-subtle)] bg-[var(--el-fill-color-light)]"
        />
      </figure>

      <!-- Tabs -->
      <el-tabs v-model="activeTab" class="result-tabs">
        <el-tab-pane v-if="markdown" :label="$t('webextrator.tab.markdown')" name="markdown">
          <div class="tab-toolbar">
            <copy-to-clipboard :content="markdown" />
          </div>
          <pre class="content-block">{{ markdown }}</pre>
        </el-tab-pane>
        <el-tab-pane v-if="plainText" :label="$t('webextrator.tab.text')" name="text">
          <div class="tab-toolbar">
            <copy-to-clipboard :content="plainText" />
          </div>
          <pre class="content-block">{{ plainText }}</pre>
        </el-tab-pane>
        <el-tab-pane v-if="extractData?.structured" :label="$t('webextrator.tab.structured')" name="structured">
          <div class="tab-toolbar">
            <copy-to-clipboard :content="structuredPretty" />
          </div>
          <pre class="content-block code">{{ structuredPretty }}</pre>
        </el-tab-pane>
        <el-tab-pane v-if="links.length" :label="`${$t('webextrator.tab.links')} (${links.length})`" name="links">
          <div class="tab-toolbar">
            <copy-to-clipboard :content="linksPlain" />
          </div>
          <ul class="links-list">
            <li v-for="(href, i) in links" :key="i" class="truncate">
              <a :href="href" target="_blank" rel="noopener">{{ href }}</a>
            </li>
          </ul>
        </el-tab-pane>
        <el-tab-pane v-if="images.length" :label="`${$t('webextrator.tab.images')} (${images.length})`" name="images">
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            <el-image
              v-for="(src, i) in images"
              :key="i"
              :src="src"
              fit="cover"
              loading="lazy"
              :preview-src-list="images"
              :initial-index="i"
              preview-teleported
              hide-on-click-modal
              class="aspect-square w-full rounded bg-[var(--el-fill-color-light)]"
            />
          </div>
        </el-tab-pane>
        <el-tab-pane v-if="html" :label="$t('webextrator.tab.html')" name="html">
          <div class="tab-toolbar">
            <copy-to-clipboard :content="html" />
          </div>
          <pre class="content-block code">{{ html }}</pre>
        </el-tab-pane>
        <el-tab-pane :label="$t('webextrator.tab.raw')" name="raw">
          <div class="tab-toolbar">
            <copy-to-clipboard :content="rawPretty" />
          </div>
          <pre class="content-block code">{{ rawPretty }}</pre>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElAlert, ElImage, ElTabs, ElTabPane } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import CopyToClipboard from '@/components/common/CopyToClipboard.vue';
import { IWebextratorExtractData, IWebextratorRenderData, IWebextratorResponse, Status } from '@/models';

const isExtractData = (d: any): d is IWebextratorExtractData => !!d && d.kind !== 'render';

export default defineComponent({
  name: 'WebextratorResultPanel',
  components: {
    ElAlert,
    ElImage,
    ElTabs,
    ElTabPane,
    FontAwesomeIcon,
    CopyToClipboard
  },
  data() {
    return {
      activeTab: 'markdown'
    };
  },
  computed: {
    response(): IWebextratorResponse | undefined {
      return this.$store.state.webextrator?.response;
    },
    running(): boolean {
      return this.$store.state.webextrator?.status?.run === Status.Request;
    },
    data() {
      return this.response?.data;
    },
    renderData(): IWebextratorRenderData | undefined {
      return this.data && (this.data as IWebextratorRenderData).kind === 'render'
        ? (this.data as IWebextratorRenderData)
        : undefined;
    },
    extractData(): IWebextratorExtractData | undefined {
      return isExtractData(this.data) ? (this.data as IWebextratorExtractData) : undefined;
    },
    finalUrl(): string | undefined {
      const d: any = this.data;
      return d?.finalUrl || d?.final_url || d?.url;
    },
    contentTypeLabel(): string | undefined {
      const d: any = this.data;
      return d?.contentType || d?.content_type || d?.expected_type;
    },
    screenshotSrc(): string | undefined {
      const src: string | undefined = (this.data as any)?.screenshot;
      if (!src) return undefined;
      // Accept both bare base64 and data: URLs.
      if (src.startsWith('data:') || src.startsWith('http')) return src;
      return `data:image/png;base64,${src}`;
    },
    markdown(): string {
      const d: any = this.data;
      return d?.markdown || d?.content || '';
    },
    plainText(): string {
      const d: any = this.data;
      return d?.text || '';
    },
    html(): string {
      return (this.data as any)?.html || '';
    },
    links(): string[] {
      return Array.isArray((this.data as any)?.links) ? ((this.data as any).links as string[]) : [];
    },
    linksPlain(): string {
      return this.links.join('\n');
    },
    images(): string[] {
      return Array.isArray((this.data as any)?.images) ? ((this.data as any).images as string[]) : [];
    },
    structuredPretty(): string {
      return this.extractData?.structured ? JSON.stringify(this.extractData.structured, null, 2) : '';
    },
    rawPretty(): string {
      return this.response ? JSON.stringify(this.response, null, 2) : '';
    },
    errorMessage(): string | undefined {
      if (this.response?.success === false) {
        const err = this.response?.error;
        return err?.message || err?.code || this.$t('webextrator.message.failed');
      }
      return undefined;
    }
  },
  watch: {
    response: {
      handler() {
        this.resetTab();
      },
      immediate: true
    }
  },
  methods: {
    resetTab() {
      // Pick the most useful tab automatically based on what came back.
      if (this.markdown) {
        this.activeTab = 'markdown';
      } else if (this.extractData?.structured) {
        this.activeTab = 'structured';
      } else if (this.plainText) {
        this.activeTab = 'text';
      } else if (this.html) {
        this.activeTab = 'html';
      } else {
        this.activeTab = 'raw';
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.result-tabs {
  :deep(.el-tabs__content) {
    overflow: visible;
  }
}
.tab-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 6px;
  color: var(--el-text-color-secondary);
}
.content-block {
  background-color: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
  border: 1px solid var(--app-border-subtle);
  border-radius: 6px;
  padding: 12px 14px;
  max-height: 520px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 13px;
  line-height: 1.55;
  &.code {
    font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
    font-size: 12px;
    white-space: pre;
    word-break: normal;
  }
}
.links-list {
  background-color: var(--el-fill-color-light);
  border: 1px solid var(--app-border-subtle);
  border-radius: 6px;
  padding: 8px 12px;
  max-height: 520px;
  overflow: auto;
  font-size: 13px;
  li {
    padding: 2px 0;
    a {
      color: var(--el-color-primary);
      &:hover {
        text-decoration: underline;
      }
    }
  }
}
</style>
