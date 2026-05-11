<template>
  <el-tooltip class="box-item" effect="dark" :content="$t('common.message.viewCodeHint')" placement="top-start">
    <el-button
      :type="buttonType"
      :size="buttonSize"
      :class="['btn-action', 'btn-api-code', buttonClass]"
      @click.stop="onOpen"
    >
      <font-awesome-icon icon="fa-solid fa-code" class="mr-1" />
      {{ $t('common.button.viewCode') }}
    </el-button>
  </el-tooltip>
  <api-code-dialog
    v-model:visible="dialogVisible"
    method="POST"
    :path="path"
    :body="cleanedBody"
    :token="resolvedToken"
  />
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import { ElButton, ElTooltip } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import ApiCodeDialog from '@/components/common/ApiCodeDialog.vue';

type ButtonType = '' | 'default' | 'text' | 'primary' | 'success' | 'warning' | 'info' | 'danger';
type ButtonSize = '' | 'small' | 'default' | 'large';

const NOISE_KEYS = new Set(['application_id', 'callback_url']);

// Map the first path segment of a Nexior API path to the Vuex store module
// that owns the matching credential. We derive the token from this so call
// sites do NOT need to pass it manually.
const PATH_TO_STORE: Record<string, string> = {
  midjourney: 'midjourney',
  luma: 'luma',
  sora: 'sora',
  veo: 'veo',
  kling: 'kling',
  hailuo: 'hailuo',
  'nano-banana': 'nanobanana',
  flux: 'flux',
  qrart: 'qrart',
  headshots: 'headshots',
  pika: 'pika',
  pixverse: 'pixverse',
  seedance: 'seedance',
  seedream: 'seedream',
  wan: 'wan',
  fish: 'fish',
  // OpenAI image generation paths live under /openai/images/...
  openai: 'openaiimage',
  suno: 'suno',
  producer: 'producer',
  serp: 'serp'
};

export default defineComponent({
  name: 'ApiCodeButton',
  components: {
    ElButton,
    ElTooltip,
    FontAwesomeIcon,
    ApiCodeDialog
  },
  props: {
    path: {
      type: String,
      required: true
    },
    body: {
      type: Object as PropType<object | null | undefined>,
      default: () => ({})
    },
    /**
     * Optional override. When omitted, the store key is derived from the
     * first segment of `path` (e.g. `/midjourney/imagine` -> `midjourney`).
     */
    tokenKey: {
      type: String,
      default: ''
    },
    buttonType: {
      type: String as PropType<ButtonType>,
      default: 'info'
    },
    buttonSize: {
      type: String as PropType<ButtonSize>,
      default: 'small'
    },
    buttonClass: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      dialogVisible: false
    };
  },
  computed: {
    cleanedBody(): Record<string, unknown> {
      const src = (this.body || {}) as Record<string, unknown>;
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(src)) {
        if (NOISE_KEYS.has(k)) continue;
        if (v === null || v === undefined) continue;
        if (typeof v === 'string' && v === '') continue;
        if (Array.isArray(v) && v.length === 0) continue;
        out[k] = v;
      }
      return out;
    },
    resolvedTokenKey(): string {
      if (this.tokenKey) return this.tokenKey;
      const first = (this.path || '').split('/').filter(Boolean)[0] || '';
      return PATH_TO_STORE[first] || '';
    },
    resolvedToken(): string {
      const key = this.resolvedTokenKey;
      if (!key) return '';
      const state = (this.$store?.state ?? {}) as unknown as Record<
        string,
        { credential?: { token?: string } } | undefined
      >;
      return state[key]?.credential?.token || '';
    }
  },
  methods: {
    onOpen() {
      this.dialogVisible = true;
    }
  }
});
</script>

<style lang="scss" scoped>
.btn-api-code {
  // Match the visual footprint of sibling icon-style action buttons so the
  // flex `gap` in the action row reads as uniform.
  min-width: 0;

  // The parent `.operations` flex container uses `align-items: baseline`.
  // Element Plus's `<el-button>` is an inline-flex box, so its baseline is
  // the text baseline of its last line. Sibling buttons (Edit, V1-V4 …) are
  // text-only and have a clean text baseline. This button mixes a
  // `<font-awesome-icon>` SVG with text, which shifts the synthesized
  // baseline and makes the button visually float a few pixels lower than
  // its peers.
  //
  // `align-self: center` was tried first but still produced a visible
  // vertical offset on production (the synthesized baseline of the
  // siblings already sits below their box midpoint, so centering this
  // button puts its midpoint above theirs). Pinning to `flex-start` makes
  // the top edges line up, which is what reviewers expect when comparing a
  // row of equal-height chips.
  align-self: flex-start;
}
</style>
