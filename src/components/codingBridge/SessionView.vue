<template>
  <div class="session-view flex flex-col h-full bg-[var(--app-content-bg)]">
    <!-- Empty: no device selected -->
    <div
      v-if="!currentNode"
      class="flex-1 flex flex-col items-center justify-center text-center p-8 text-[var(--app-text-subtle)]"
    >
      <font-awesome-icon icon="fa-solid fa-laptop-code" class="text-4xl mb-3" />
      <p class="text-sm">{{ $t('codingBridge.session.noDevice') }}</p>
    </div>

    <template v-else>
      <!-- Header -->
      <div class="flex items-center justify-between gap-3 px-5 py-3 border-b border-[var(--app-border-subtle)]">
        <div class="min-w-0">
          <div class="flex items-center gap-2 font-medium">
            <span class="truncate">{{ currentNode.name }}</span>
            <span
              class="inline-block w-2 h-2 rounded-full flex-none"
              :class="nodeOnline ? 'bg-[var(--el-color-success)]' : 'bg-[var(--app-text-subtle)]'"
            />
          </div>
          <div v-if="currentSession" class="text-xs text-[var(--app-text-subtle)] truncate">
            <span v-if="currentSession.cwd">{{ currentSession.cwd }}</span>
            <span v-if="currentSession.model"> · {{ currentSession.model }}</span>
          </div>
        </div>
        <el-button v-if="currentSessionId" size="small" round @click="onNewSession">
          <font-awesome-icon icon="fa-solid fa-plus" class="mr-1" />
          {{ $t('codingBridge.session.newSession') }}
        </el-button>
      </div>

      <!-- Offline warning -->
      <div
        v-if="!nodeOnline"
        class="px-5 py-2 text-xs bg-[var(--el-color-warning-light-9)] text-[var(--el-color-warning)] border-b border-[var(--app-border-subtle)]"
      >
        {{ $t('codingBridge.session.deviceOffline') }}
      </div>

      <!-- Transcript -->
      <div ref="transcript" class="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
        <div v-if="!events.length" class="m-auto text-center text-sm text-[var(--app-text-subtle)]">
          {{ $t('codingBridge.session.startHint') }}
        </div>
        <transcript-item v-for="event in events" :key="event.id" :event="event" />
      </div>

      <!-- Composer -->
      <div class="border-t border-[var(--app-border-subtle)] p-3">
        <div v-if="isNewSession" class="flex gap-2 mb-2">
          <el-input v-model="cwd" size="small" :placeholder="$t('codingBridge.session.cwdPlaceholder')" clearable />
          <el-input v-model="model" size="small" :placeholder="$t('codingBridge.session.modelPlaceholder')" clearable />
        </div>
        <div class="flex items-end gap-2">
          <el-input
            v-model="prompt"
            type="textarea"
            :autosize="{ minRows: 1, maxRows: 6 }"
            resize="none"
            class="flex-1"
            :placeholder="$t('codingBridge.session.promptPlaceholder')"
            @keydown.enter.exact.prevent="onSend"
          />
          <el-button v-if="running" round @click="onInterrupt">
            <font-awesome-icon icon="fa-solid fa-stop" />
          </el-button>
          <el-button type="primary" round :disabled="!canSend" @click="onSend">
            {{ $t('codingBridge.session.send') }}
          </el-button>
        </div>
        <p class="text-[11px] text-[var(--app-text-subtle)] mt-1 px-1">
          {{ $t('codingBridge.session.enterHint') }}
        </p>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElInput, ElButton } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import TranscriptItem from './TranscriptItem.vue';
import { ICodingBridgeEvent, ICodingBridgeNode, ICodingBridgeSession } from '@/models';

export default defineComponent({
  name: 'CodingBridgeSessionView',
  components: {
    ElInput,
    ElButton,
    FontAwesomeIcon,
    TranscriptItem
  },
  data() {
    return {
      prompt: '',
      cwd: '',
      model: ''
    };
  },
  computed: {
    currentNodeId(): string | undefined {
      return this.$store.state.codingBridge?.currentNodeId;
    },
    currentNode(): ICodingBridgeNode | undefined {
      return this.$store.state.codingBridge?.nodes?.find((node) => node.node_id === this.currentNodeId);
    },
    nodeOnline(): boolean {
      return this.currentNode?.status === 'online';
    },
    currentSessionId(): string | undefined {
      return this.$store.state.codingBridge?.currentSessionId;
    },
    currentSession(): ICodingBridgeSession | undefined {
      const id = this.currentSessionId;
      return id ? this.$store.state.codingBridge?.sessions?.[id] : undefined;
    },
    events(): ICodingBridgeEvent[] {
      const id = this.currentSessionId;
      return id ? (this.$store.state.codingBridge?.events?.[id] ?? []) : [];
    },
    isNewSession(): boolean {
      return !this.currentSessionId;
    },
    running(): boolean {
      const status = this.currentSession?.status;
      return status === 'running' || status === 'starting';
    },
    connected(): boolean {
      return this.$store.state.codingBridge?.connection === 'connected';
    },
    canSend(): boolean {
      return !!this.prompt.trim() && this.connected && this.nodeOnline;
    }
  },
  watch: {
    events() {
      this.scrollToBottom();
    },
    currentSessionId() {
      this.scrollToBottom();
    }
  },
  methods: {
    onSend() {
      if (!this.canSend) {
        return;
      }
      this.$store.dispatch('codingBridge/sendPrompt', {
        prompt: this.prompt,
        cwd: this.cwd,
        model: this.model
      });
      this.prompt = '';
    },
    onInterrupt() {
      this.$store.dispatch('codingBridge/interruptSession');
    },
    onNewSession() {
      this.$store.dispatch('codingBridge/newSession');
      this.cwd = '';
      this.model = '';
      this.prompt = '';
    },
    scrollToBottom() {
      this.$nextTick(() => {
        const el = this.$refs.transcript as HTMLElement | undefined;
        if (el) {
          el.scrollTop = el.scrollHeight;
        }
      });
    }
  }
});
</script>
