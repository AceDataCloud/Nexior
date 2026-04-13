<template>
  <div class="oauth-callback">
    <div v-if="status === 'processing'" class="status">
      <el-icon class="is-loading" :size="32"><loading /></el-icon>
      <p>{{ $t('chat.connector.processing') }}</p>
    </div>
    <div v-else-if="status === 'success'" class="status success">
      <font-awesome-icon icon="fa-solid fa-check-circle" class="icon" />
      <p>{{ $t('chat.connector.authSuccess') }}</p>
      <p class="hint">{{ $t('chat.connector.closeWindow') }}</p>
    </div>
    <div v-else class="status error">
      <font-awesome-icon icon="fa-solid fa-circle-exclamation" class="icon" />
      <p>{{ errorMessage || $t('chat.connector.authFailed') }}</p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { Loading } from '@element-plus/icons-vue';

export default defineComponent({
  name: 'OAuthCallback',
  components: { Loading },
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

      if (!code || !state) {
        this.status = 'error';
        this.errorMessage = 'Missing authorization code or state';
        return;
      }

      // Send code and state to the parent window (ConnectorManager)
      if (window.opener) {
        window.opener.postMessage({ type: 'oauth-callback', code, state }, window.location.origin);
        this.status = 'success';
        // Auto-close after 2 seconds
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
  padding: 40px;

  p {
    margin-top: 16px;
    font-size: 16px;
    color: var(--el-text-color-primary);
  }

  .hint {
    font-size: 13px;
    color: var(--el-text-color-secondary);
    margin-top: 8px;
  }

  .icon {
    font-size: 48px;
  }

  &.success .icon {
    color: var(--el-color-success);
  }

  &.error .icon {
    color: var(--el-color-danger);
  }
}
</style>
