<template>
  <el-dialog
    :model-value="visible"
    :title="$t('common.title.apiCode')"
    width="760"
    :close-on-click-modal="true"
    class="api-code-dialog"
    @close="$emit('update:visible', false)"
  >
    <p class="intro">{{ $t('common.message.apiCodeIntro') }}</p>

    <div class="languages mb-2">
      <button
        v-for="opt in languages"
        :key="opt.name"
        type="button"
        :class="{ language: true, active: lang === opt.name }"
        @click="onSelectLang(opt.name)"
      >
        <el-image :src="opt.icon" class="icon" />
        <span class="name">{{ opt.name }}</span>
      </button>
    </div>

    <div v-if="currentVariants.length > 1" class="variants mb-2">
      <button
        v-for="v in currentVariants"
        :key="v.key"
        type="button"
        :class="{ variant: true, active: variant === v.key }"
        @click="variant = v.key"
      >
        {{ v.label }}
      </button>
    </div>

    <div v-if="code" class="code">
      <div class="code-toolbar">
        <div class="code-tabs">
          <button
            type="button"
            :class="{ 'code-tab': true, active: activeTab === 'request' }"
            @click="activeTab = 'request'"
          >
            <font-awesome-icon icon="fa-solid fa-code" class="mr-1" />
            {{ $t('common.tab.apiRequest') }}
          </button>
          <button
            type="button"
            :class="{ 'code-tab': true, active: activeTab === 'response' }"
            @click="activeTab = 'response'"
          >
            <font-awesome-icon icon="fa-solid fa-terminal" class="mr-1" />
            {{ $t('common.tab.apiResponse') }}
          </button>
        </div>
        <button v-if="!running" type="button" class="code-run" :disabled="!canRun" @click="onRun">
          <font-awesome-icon icon="fa-solid fa-play" />
          <span>{{ $t('common.button.apiRun') }}</span>
        </button>
        <button v-else type="button" class="code-run code-run--running" disabled>
          <font-awesome-icon icon="fa-solid fa-spinner" spin />
          <span>{{ $t('common.button.apiRunning') }}</span>
        </button>
      </div>

      <div v-show="activeTab === 'request'">
        <code-snippet :key="`${lang}-${variant}-${code.length}`" :code="code" :lang="lang" />
      </div>
      <div v-show="activeTab === 'response'">
        <div v-if="!response && !running" class="code-empty">
          <font-awesome-icon icon="fa-solid fa-play" class="code-empty__icon" />
          <p>{{ $t('common.message.apiClickRun') }}</p>
        </div>
        <code-snippet v-else :key="`resp-${response.length}`" :code="response || '...'" lang="json" />
      </div>
    </div>

    <template #footer>
      <div class="footer">
        <el-button class="platform-btn" type="primary" plain @click="onOpenPlatform">
          <img :src="platformIcon" class="platform-icon" alt="" />
          {{ $t('common.button.apiPlatform') }}
          <font-awesome-icon icon="fa-solid fa-up-right-from-square" class="ml-2 ext-icon" />
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import { ElDialog, ElButton, ElImage } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { VARIANTS, renderApiCode, type Lang, type CodeVariant } from '@acedatacloud/core/code-snippet';
import CodeSnippet from '@/components/common/CodeSnippet.vue';
import { BASE_URL_API } from '@/constants/endpoint';
import shellLogo from '@/assets/images/logos/shell.png';
import pythonLogo from 'programming-languages-logos/src/python/python.svg';
import javascriptLogo from 'programming-languages-logos/src/javascript/javascript.svg';
import javaLogo from 'programming-languages-logos/src/java/java.svg';
import goLogo from 'programming-languages-logos/src/go/go.svg';
import phpLogo from 'programming-languages-logos/src/php/php.svg';

// Language list keeps the app-specific icons; the variant matrix + render logic
// (templates, per-language coercion) come from @acedatacloud/core/code-snippet.
const LANGUAGES: { name: Lang; icon: string }[] = [
  { name: 'Shell', icon: shellLogo },
  { name: 'Python', icon: pythonLogo },
  { name: 'JavaScript', icon: javascriptLogo },
  { name: 'Java', icon: javaLogo },
  { name: 'Go', icon: goLogo },
  { name: 'PHP', icon: phpLogo }
];

const PLATFORM_URL = 'https://platform.acedata.cloud/';

const PLATFORM_FAVICON = 'https://platform.acedata.cloud/favicon.ico';
interface IRenderHeader {
  key: string;
  value: string;
  last?: boolean;
}

interface IRenderBody {
  key: string;
  value: unknown;
  last?: boolean;
}

export default defineComponent({
  name: 'ApiCodeDialog',
  components: {
    ElDialog,
    ElButton,
    ElImage,
    FontAwesomeIcon,
    CodeSnippet
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    method: {
      type: String,
      default: 'POST'
    },
    path: {
      type: String,
      required: true
    },
    body: {
      type: Object as PropType<Record<string, unknown> | undefined>,
      default: () => ({})
    },
    token: {
      type: String,
      default: ''
    }
  },
  emits: ['update:visible'],
  data() {
    return {
      lang: 'Shell' as Lang,
      variant: 'curl',
      platformIcon: PLATFORM_FAVICON,
      activeTab: 'request' as 'request' | 'response',
      running: false,
      response: ''
    };
  },
  computed: {
    languages(): { name: Lang; icon: string }[] {
      return LANGUAGES;
    },
    currentVariants(): CodeVariant[] {
      return VARIANTS[this.lang] || [];
    },
    url(): string {
      const base = BASE_URL_API.replace(/\/$/, '');
      const p = this.path.startsWith('/') ? this.path : `/${this.path}`;
      return `${base}${p}`;
    },
    bearer(): string {
      return this.token ? this.token : '<YOUR_API_KEY>';
    },
    rawHeaders(): IRenderHeader[] {
      const out: IRenderHeader[] = [
        { key: 'authorization', value: `Bearer ${this.bearer}` },
        { key: 'content-type', value: 'application/json' }
      ];
      out[out.length - 1].last = true;
      return out;
    },
    rawBody(): IRenderBody[] {
      const src = (this.body || {}) as Record<string, unknown>;
      const entries: IRenderBody[] = [];
      for (const [k, v] of Object.entries(src)) {
        entries.push({ key: k, value: v });
      }
      if (entries.length > 0) {
        entries[entries.length - 1].last = true;
      }
      return entries;
    },
    code(): string {
      const selected = this.currentVariants.find((v) => v.key === this.variant) || this.currentVariants[0];
      if (!selected) return '';
      return renderApiCode({
        lang: this.lang,
        templateKey: selected.templateKey,
        method: this.method,
        url: this.url,
        headers: this.rawHeaders,
        body: this.rawBody
      });
    },
    // Run is only possible with a real key — without it the snippet shows the
    // <YOUR_API_KEY> placeholder and the call would 401.
    canRun(): boolean {
      return !!this.token;
    }
  },
  watch: {
    // Reset the live response when the dialog reopens or targets a different
    // request, so the Response tab never shows stale data from a prior result.
    visible(val: boolean) {
      if (val) {
        this.response = '';
        this.activeTab = 'request';
      }
    },
    url() {
      this.response = '';
      this.activeTab = 'request';
    }
  },
  methods: {
    onSelectLang(name: Lang) {
      this.lang = name;
      this.variant = VARIANTS[name][0]?.key || '';
    },
    // Re-fires the same request live against the API. This is a real, billable
    // generation — same as the user calling the endpoint themselves.
    async onRun() {
      if (!this.canRun || this.running) return;
      this.running = true;
      this.response = '';
      this.activeTab = 'response';
      try {
        const res = await fetch(this.url, {
          method: (this.method || 'POST').toUpperCase(),
          headers: {
            authorization: `Bearer ${this.token}`,
            'content-type': 'application/json'
          },
          body: JSON.stringify(this.body || {})
        });
        const json = await res.json();
        this.response = JSON.stringify(json, null, 2);
      } catch (err: unknown) {
        this.response = `Error: ${err instanceof Error ? err.message : 'Request failed'}`;
      } finally {
        this.running = false;
      }
    },
    onOpenPlatform() {
      window.open(PLATFORM_URL, '_blank', 'noopener');
    }
  }
});
</script>

<style lang="scss" scoped>
.api-code-dialog {
  .intro {
    font-size: 13px;
    color: var(--el-text-color-regular);
    margin: 0 0 12px;
  }

  .languages {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
  }

  .language {
    appearance: none;
    background: var(--el-fill-color-blank);
    border: 1px solid transparent;
    border-radius: 10px;
    padding: 10px;
    width: 70px;
    height: 78px;
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.15s ease;

    .icon {
      width: 30px;
      height: 30px;
      margin-bottom: 6px;
    }
    .name {
      color: var(--el-text-color-secondary);
      font-size: 11px;
      font-weight: 600;
      line-height: 1.2;
    }

    &:hover {
      border-color: var(--el-border-color);
    }

    &.active {
      border-color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
      .name {
        color: var(--el-color-primary);
      }
    }
  }

  .variants {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    justify-content: center;
  }

  .variant {
    appearance: none;
    border: 1px solid transparent;
    background: var(--el-fill-color);
    color: var(--el-text-color-regular);
    border-radius: 4px;
    padding: 2px 10px;
    font-size: 11.5px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    cursor: pointer;
    transition: all 0.15s ease;

    &:hover {
      background: var(--el-fill-color-dark);
    }

    &.active {
      background: var(--el-color-primary-light-9);
      border-color: var(--el-color-primary);
      color: var(--el-color-primary);
    }
  }

  .code {
    margin-top: 4px;
  }

  .code-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 8px;
  }

  .code-tabs {
    display: flex;
    gap: 2px;
  }

  .code-tab {
    appearance: none;
    border: none;
    background: transparent;
    color: var(--el-text-color-secondary);
    padding: 5px 12px;
    border-radius: 6px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.15s ease;

    &:hover {
      color: var(--el-text-color-primary);
      background: var(--el-fill-color);
    }

    &.active {
      color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
    }
  }

  .code-run {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    appearance: none;
    border: none;
    border-radius: 8px;
    padding: 6px 16px;
    background: var(--el-color-primary);
    color: #fff;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;

    &:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18);
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    &--running {
      opacity: 0.8;
    }
  }

  .code-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 140px;
    border-radius: 6px;
    background: #011627;
    color: rgba(255, 255, 255, 0.45);

    &__icon {
      font-size: 30px;
      margin-bottom: 12px;
      opacity: 0.4;
    }

    p {
      font-size: 13px;
      margin: 0;
      padding: 0 16px;
      text-align: center;
    }
  }

  .footer {
    display: flex;
    align-items: center;
    justify-content: flex-start;
  }

  .platform-btn {
    display: inline-flex;
    align-items: center;
    font-weight: 500;

    // el-button wraps slot content in <span class="el-button__text">, so a
    // `gap` on the button has no effect between siblings — use an explicit
    // inline-end margin (RTL-safe) on the leading logo instead.
    .platform-icon {
      width: 16px;
      height: 16px;
      object-fit: contain;
      margin-inline-end: 10px;
    }

    .ext-icon {
      font-size: 11px;
      opacity: 0.7;
    }
  }
}
</style>
