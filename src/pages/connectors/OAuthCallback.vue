<template>
  <div class="oauth-callback">
    <div v-if="status === 'processing'" class="status">
      <el-icon class="is-loading" :size="32"><loading /></el-icon>
      <p>{{ $t('connector.common.processing') }}</p>
    </div>
    <div v-else-if="status === 'success'" class="status success">
      <font-awesome-icon icon="fa-solid fa-check-circle" class="icon" />
      <p>{{ $t('connector.common.authSuccess') }}</p>
      <p class="hint">{{ $t('connector.common.closeWindow') }}</p>
    </div>
    <div v-else class="status error">
      <font-awesome-icon icon="fa-solid fa-circle-exclamation" class="icon" />
      <p>{{ errorMessage || $t('connector.common.authFailed') }}</p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { Loading } from '@element-plus/icons-vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

export default defineComponent({
  name: 'ConnectorsOAuthCallback',
  components: { Loading, FontAwesomeIcon },
  data() {
    return {
      status: 'processing' as 'processing' | 'success' | 'error',
      errorMessage: ''
    };
  },
  mounted() {
    this.handleCallback();
  },
  methods: {
    handleCallback() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const state = params.get('state');
      const error = params.get('error');

      if (error) {
        this.status = 'error';
        this.errorMessage = params.get('error_description') || error;
        return;
      }
      if (!code) {
        this.status = 'error';
        this.errorMessage = 'Missing authorization code';
        return;
      }

      // MCP OAuth uses PKCE (no state); connector OAuth always returns state.
      // Forward whatever we received back to the opener.
      if (window.opener) {
        const payload: { type: 'oauth-callback'; code: string; state?: string } = {
          type: 'oauth-callback',
          code
        };
        if (state) payload.state = state;
        window.opener.postMessage(payload, window.location.origin);
        this.status = 'success';
        setTimeout(() => window.close(), 2000);
      } else {
        this.status = 'error';
        this.errorMessage = 'No parent window found. Please try again.';
      }
    }
  }
});
</script>

<style scoped lang="scss">
.oauth-callback {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: var(--el-bg-color);
}

.status {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;

  .icon {
    font-size: 48px;
  }

  &.success .icon {
    color: var(--el-color-success);
  }

  &.error .icon {
    color: var(--el-color-danger);
  }

  .hint {
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }
}
</style>
