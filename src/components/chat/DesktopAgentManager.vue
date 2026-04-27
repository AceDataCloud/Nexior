<template>
  <el-dialog
    :model-value="modelValue"
    :title="$t('chat.agent.title')"
    width="480px"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div class="agent-manager">
      <p class="description">{{ $t('chat.agent.description') }}</p>

      <div v-if="connected" class="status-card connected">
        <div class="status-header">
          <span class="pulse-dot"></span>
          <span class="status-text">{{ $t('chat.agent.connected') }}</span>
        </div>
        <div class="info-row">
          <span class="label">{{ $t('chat.agent.name') }}:</span>
          <span class="value">{{ agentName }}</span>
        </div>
        <div class="info-row">
          <span class="label">{{ $t('chat.agent.tools') }}:</span>
          <span class="value">{{ toolCount }}</span>
        </div>
        <div class="info-row">
          <span class="label">{{ $t('chat.agent.connectedSince') }}:</span>
          <span class="value">{{ connectedAt }}</span>
        </div>
        <p class="hint">{{ $t('chat.agent.connectedHint') }}</p>
      </div>

      <div v-else class="status-card disconnected">
        <div class="status-header">
          <span class="status-text">{{ $t('chat.agent.notConnected') }}</span>
        </div>
        <div class="install-guide">
          <p class="step-label">{{ $t('chat.agent.installLabel') }}</p>
          <code class="command">npm install -g @acedatacloud/desktop-agent</code>
          <p class="step-label">{{ $t('chat.agent.runLabel') }}</p>
          <code class="command">adc-agent --token YOUR_API_TOKEN</code>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElDialog } from 'element-plus';

export default defineComponent({
  name: 'DesktopAgentManager',
  components: { ElDialog },
  props: {
    modelValue: { type: Boolean, default: false },
    connected: { type: Boolean, default: false },
    agentName: { type: String, default: '' },
    toolCount: { type: Number, default: 0 },
    connectedAt: { type: String, default: '' }
  },
  emits: ['update:modelValue']
});
</script>

<style lang="scss" scoped>
.agent-manager {
  .description {
    color: var(--el-text-color-secondary);
    margin-bottom: 16px;
    font-size: 14px;
  }

  .status-card {
    border: 1px solid var(--el-border-color-light);
    border-radius: 8px;
    padding: 16px;

    &.connected {
      border-color: var(--el-color-success-light-5);
      background: var(--el-color-success-light-9);
    }

    &.disconnected {
      border-color: var(--el-border-color-light);
      background: var(--el-fill-color-light);
    }
  }

  .status-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    font-weight: 600;
  }

  .pulse-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--el-color-success);
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0.4;
    }
    100% {
      opacity: 1;
    }
  }

  .info-row {
    display: flex;
    justify-content: space-between;
    padding: 4px 0;
    font-size: 13px;

    .label {
      color: var(--el-text-color-secondary);
    }
    .value {
      font-weight: 500;
    }
  }

  .hint {
    margin-top: 12px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .install-guide {
    .step-label {
      font-size: 13px;
      margin: 8px 0 4px;
      color: var(--el-text-color-regular);
    }

    .command {
      display: block;
      background: var(--el-fill-color-darker);
      color: var(--el-color-success);
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 13px;
      font-family: 'SF Mono', Monaco, 'Courier New', monospace;
      user-select: all;
    }
  }
}
</style>
