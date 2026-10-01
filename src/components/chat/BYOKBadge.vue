<template>
  <el-tooltip
    v-if="show && providerLabel"
    :content="`${$t('byok.badge.tooltip', { provider: providerLabel })} — ${$t('byok.badge.manage')}`"
    placement="bottom"
  >
    <action-chip class="byok-badge" :aria-label="$t('byok.badge.manage')" @click="onClickManage">
      <key-icon class="badge-icon" :size="'1em' as any" aria-hidden="true" focusable="false" />
      <span class="badge-text">{{ $t('byok.badge.active', { provider: providerLabel }) }}</span>
    </action-chip>
  </el-tooltip>
</template>

<script lang="ts">
import { ActionChip } from '@acedatacloud/core/components';
import { KeyIcon } from '@acedatacloud/core/icons/components';
import { defineComponent } from 'vue';
import { ElTooltip } from 'element-plus';
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
    ActionChip,
    KeyIcon,
    ElTooltip
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
@media (max-width: 640px) {
  .byok-badge .badge-text {
    display: none;
  }
}
</style>
