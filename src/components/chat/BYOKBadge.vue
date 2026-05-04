<template>
  <el-tooltip
    v-if="show && providerLabel"
    :content="`${$t('byok.badge.tooltip', { provider: providerLabel })} — ${$t('byok.badge.manage')}`"
    placement="bottom"
  >
    <button type="button" class="byok-badge" @click="onClickManage">
      <font-awesome-icon icon="fa-solid fa-key" class="badge-icon" />
      <span class="badge-text">{{ $t('byok.badge.active', { provider: providerLabel }) }}</span>
    </button>
  </el-tooltip>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElTooltip } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { byokCredentialOperator } from '@/operators';
import type { IBYOKCredential, IBYOKProvider, ICredential } from '@/models';

/**
 * In-chat badge that lights up when the user has an active BYOK row
 * matching the currently-selected model's provider. The badge's
 * presence tells the user "this conversation is going to your own
 * upstream account, not the platform's pool" so they're not confused
 * about who's getting billed.
 */

const PROVIDER_FOR_GROUP: Record<string, IBYOKProvider> = {
  chatgpt: 'openai',
  claude: 'anthropic',
  gemini: 'google',
  grok: 'xai',
  deepseek: 'deepseek',
  kimi: 'moonshot',
  glm: 'zhipu'
};

export default defineComponent({
  name: 'BYOKBadge',
  components: {
    ElTooltip,
    FontAwesomeIcon
  },
  data() {
    return {
      credentials: [] as IBYOKCredential[],
      loaded: false
    };
  },
  computed: {
    token(): string | undefined {
      const credential = this.$store?.state?.chat?.credential as ICredential | undefined;
      return credential?.token;
    },
    modelGroup(): string | undefined {
      return this.$store?.state?.chat?.modelGroup?.name;
    },
    expectedProvider(): IBYOKProvider | undefined {
      const group = this.modelGroup;
      if (!group) return undefined;
      return PROVIDER_FOR_GROUP[group];
    },
    activeCredential(): IBYOKCredential | undefined {
      const provider = this.expectedProvider;
      if (!provider) return undefined;
      return this.credentials.find((c) => c.provider === provider && c.is_active);
    },
    providerLabel(): string | undefined {
      return this.activeCredential?.provider_label;
    },
    show(): boolean {
      return !!this.activeCredential;
    }
  },
  watch: {
    token: {
      immediate: true,
      handler(value?: string) {
        if (value && !this.loaded) {
          this.fetch();
        }
      }
    }
  },
  methods: {
    async fetch() {
      if (!this.token) return;
      try {
        const { data } = await byokCredentialOperator.list({ token: this.token });
        this.credentials = data?.items ?? [];
        this.loaded = true;
      } catch (err) {
        // BYOK feature off / endpoint unreachable — silently no badge.
        console.debug('BYOK badge fetch skipped', err);
        this.credentials = [];
      }
    },
    onClickManage() {
      // Hand off to UserCenter (see `src/components/user/Center.vue`),
      // which owns the only mounted instance of `<user-setting>`. We use
      // a window-level CustomEvent to avoid wiring a Vuex flag for a
      // single-purpose UX hook.
      window.dispatchEvent(new CustomEvent('open-user-settings', { detail: { tab: 'apiKey' } }));
    }
  }
});
</script>

<style lang="scss" scoped>
.byok-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border: none;
  border-radius: 999px;
  background-color: var(--el-color-primary-light-9, rgba(64, 158, 255, 0.12));
  color: var(--el-color-primary, #409eff);
  font-size: 12px;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
  font-family: inherit;
  transition: background-color 0.15s ease;

  &:hover {
    background-color: var(--el-color-primary-light-8, rgba(64, 158, 255, 0.18));
  }

  .badge-icon {
    font-size: 10px;
  }
}

@media (max-width: 640px) {
  .byok-badge .badge-text {
    display: none;
  }
  .byok-badge {
    padding: 4px 6px;
  }
}
</style>
