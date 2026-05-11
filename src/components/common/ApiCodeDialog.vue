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
      <code-snippet :key="`${lang}-${variant}-${code.length}`" :code="code" :lang="lang" />
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
import Mustache from 'mustache';
import CodeSnippet from '@/components/common/CodeSnippet.vue';
import { BASE_URL_API } from '@/constants/endpoint';
import shellLogo from '@/assets/images/logos/shell.png';
import pythonLogo from 'programming-languages-logos/src/python/python.svg';
import javascriptLogo from 'programming-languages-logos/src/javascript/javascript.svg';
import javaLogo from 'programming-languages-logos/src/java/java.svg';
import goLogo from 'programming-languages-logos/src/go/go.svg';
import phpLogo from 'programming-languages-logos/src/php/php.svg';
import shellTpl from '@/assets/templates/shell.tpl?raw';
import shellHttpieTpl from '@/assets/templates/shell-httpie.tpl?raw';
import shellWgetTpl from '@/assets/templates/shell-wget.tpl?raw';
import pythonTpl from '@/assets/templates/python.tpl?raw';
import pythonHttpxTpl from '@/assets/templates/python-httpx.tpl?raw';
import pythonAiohttpTpl from '@/assets/templates/python-aiohttp.tpl?raw';
import pythonUrllibTpl from '@/assets/templates/python-urllib.tpl?raw';
import javascriptTpl from '@/assets/templates/javascript.tpl?raw';
import javascriptAxiosTpl from '@/assets/templates/javascript-axios.tpl?raw';
import javascriptXhrTpl from '@/assets/templates/javascript-xhr.tpl?raw';
import javaTpl from '@/assets/templates/java.tpl?raw';
import javaHttpClientTpl from '@/assets/templates/java-httpclient.tpl?raw';
import goTpl from '@/assets/templates/go.tpl?raw';
import phpTpl from '@/assets/templates/php.tpl?raw';
import phpCurlTpl from '@/assets/templates/php-curl.tpl?raw';

const LANG_SHELL = 'Shell';
const LANG_PYTHON = 'Python';
const LANG_JAVASCRIPT = 'JavaScript';
const LANG_JAVA = 'Java';
const LANG_GO = 'Go';
const LANG_PHP = 'PHP';

type Lang =
  | typeof LANG_SHELL
  | typeof LANG_PYTHON
  | typeof LANG_JAVASCRIPT
  | typeof LANG_JAVA
  | typeof LANG_GO
  | typeof LANG_PHP;

interface IVariant {
  key: string;
  label: string;
  template: string;
}

const VARIANTS: Record<Lang, IVariant[]> = {
  Shell: [
    { key: 'curl', label: 'cURL', template: shellTpl },
    { key: 'httpie', label: 'HTTPie', template: shellHttpieTpl },
    { key: 'wget', label: 'wget', template: shellWgetTpl }
  ],
  Python: [
    { key: 'requests', label: 'requests', template: pythonTpl },
    { key: 'httpx', label: 'httpx', template: pythonHttpxTpl },
    { key: 'aiohttp', label: 'aiohttp', template: pythonAiohttpTpl },
    { key: 'urllib', label: 'urllib', template: pythonUrllibTpl }
  ],
  JavaScript: [
    { key: 'fetch', label: 'fetch', template: javascriptTpl },
    { key: 'axios', label: 'axios', template: javascriptAxiosTpl },
    { key: 'xhr', label: 'XHR', template: javascriptXhrTpl }
  ],
  Java: [
    { key: 'okhttp', label: 'OkHttp', template: javaTpl },
    { key: 'httpclient', label: 'HttpClient', template: javaHttpClientTpl }
  ],
  Go: [{ key: 'nethttp', label: 'net/http', template: goTpl }],
  PHP: [
    { key: 'guzzle', label: 'Guzzle', template: phpTpl },
    { key: 'curl', label: 'cURL', template: phpCurlTpl }
  ]
};

const LANGUAGES: { name: Lang; icon: string }[] = [
  { name: LANG_SHELL, icon: shellLogo },
  { name: LANG_PYTHON, icon: pythonLogo },
  { name: LANG_JAVASCRIPT, icon: javascriptLogo },
  { name: LANG_JAVA, icon: javaLogo },
  { name: LANG_GO, icon: goLogo },
  { name: LANG_PHP, icon: phpLogo }
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
      lang: LANG_SHELL as Lang,
      variant: 'curl',
      platformIcon: PLATFORM_FAVICON
    };
  },
  computed: {
    languages(): { name: Lang; icon: string }[] {
      return LANGUAGES;
    },
    currentVariants(): IVariant[] {
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
      const template = selected.template;

      // Deep clone so per-language value coercion does not leak across tabs.
      const headers: IRenderHeader[] = this.rawHeaders.map((h) => ({ ...h }));
      const body: IRenderBody[] = this.rawBody.map((b) => ({ ...b }));
      let methodLower = String(this.method || 'POST').toLowerCase();
      let methodUpper = String(this.method || 'POST').toUpperCase();
      let renderMethod: string = methodUpper;

      const jsonStringifyValue = (v: unknown) => JSON.stringify(v);

      if (this.lang === LANG_PYTHON) {
        for (const h of headers) {
          h.value = jsonStringifyValue(h.value) as unknown as string;
        }
        for (const item of body) {
          const v = item.value;
          if (v === true || v === false) {
            item.value = v ? 'True' : 'False';
          } else if (v === null) {
            item.value = 'None';
          } else {
            item.value = jsonStringifyValue(v);
          }
        }
        renderMethod = methodLower;
      } else if (this.lang === LANG_JAVASCRIPT) {
        for (const h of headers) {
          h.value = jsonStringifyValue(h.value) as unknown as string;
        }
        for (const item of body) {
          item.value = jsonStringifyValue(item.value);
        }
        renderMethod = methodUpper;
      } else if (this.lang === LANG_PHP || this.lang === LANG_JAVA || this.lang === LANG_GO) {
        for (const h of headers) {
          h.value = jsonStringifyValue(h.value) as unknown as string;
        }
        for (const item of body) {
          item.value = jsonStringifyValue(item.value);
        }
        renderMethod = methodUpper;
      } else if (this.lang === LANG_SHELL) {
        // Shell: keep header values raw (single-quoted by template), body values JSON.
        for (const item of body) {
          item.value = jsonStringifyValue(item.value);
        }
        renderMethod = methodUpper;
      }

      return Mustache.render(template, {
        url: this.url,
        method: renderMethod,
        methodUpper,
        headers,
        body
      });
    }
  },
  methods: {
    onSelectLang(name: Lang) {
      this.lang = name;
      this.variant = VARIANTS[name][0]?.key || '';
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
    width: fit-content;
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

  .footer {
    display: flex;
    align-items: center;
    justify-content: flex-start;
  }

  .platform-btn {
    display: inline-flex;
    align-items: center;
    gap: 14px;
    font-weight: 500;

    .platform-icon {
      width: 16px;
      height: 16px;
      object-fit: contain;
    }

    .ext-icon {
      font-size: 11px;
      opacity: 0.7;
    }
  }
}
</style>
