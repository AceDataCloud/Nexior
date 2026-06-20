<template>
  <div class="realtime-call">
    <div class="call-card">
      <div class="call-header">
        <el-button text class="back-btn" @click="goBack">
          <font-awesome-icon icon="fa-solid fa-arrow-left" />
        </el-button>
        <span class="title">{{ $t('realtime.title') }}</span>
        <span class="status" :class="status">{{ statusText }}</span>
      </div>

      <div class="orb" :class="{ active: running, speaking: aiSpeaking }">
        <font-awesome-icon icon="fa-solid fa-microphone" />
      </div>

      <div class="transcript">
        <p v-if="userText" class="line user">
          <span class="who">{{ $t('realtime.you') }}</span
          >{{ userText }}
        </p>
        <p v-if="aiText" class="line ai">
          <span class="who">{{ $t('realtime.assistant') }}</span
          >{{ aiText }}
        </p>
        <p v-if="!userText && !aiText && running" class="hint">{{ $t('realtime.listening') }}</p>
      </div>

      <p v-if="errorMsg" class="error">{{ errorMsg }}</p>

      <div class="actions">
        <el-button
          v-if="!running"
          type="primary"
          round
          size="large"
          :loading="connecting"
          :disabled="!canCall"
          @click="startCall"
        >
          <font-awesome-icon icon="fa-solid fa-phone" class="btn-icon" />
          {{ $t('realtime.start') }}
        </el-button>
        <el-button v-else type="danger" round size="large" @click="endCall">
          <font-awesome-icon icon="fa-solid fa-phone-slash" class="btn-icon" />
          {{ $t('realtime.end') }}
        </el-button>
      </div>

      <p v-if="!canCall && !provisioning" class="hint small">{{ $t('realtime.needService') }}</p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { RealtimeClient, RealtimeStatus } from '@/utils/realtimeClient';
import { REALTIME_DEFAULT_MODEL } from '@/constants';
import { ROUTE_CHATGPT_CONVERSATION_NEW } from '@/router/constants';

export default defineComponent({
  name: 'RealtimeCall',
  data() {
    return {
      client: undefined as RealtimeClient | undefined,
      status: 'disconnected' as RealtimeStatus,
      connecting: false,
      provisioning: true,
      running: false,
      aiSpeaking: false,
      userText: '',
      aiText: '',
      errorMsg: ''
    };
  },
  computed: {
    token(): string | undefined {
      return this.$store.state.realtime?.credential?.token;
    },
    canCall(): boolean {
      return !!this.token;
    },
    statusText(): string {
      return this.$t(`realtime.status.${this.status}`);
    }
  },
  async mounted() {
    this.provisioning = true;
    try {
      await this.$store.dispatch('realtime/init');
    } finally {
      this.provisioning = false;
    }
  },
  beforeUnmount() {
    this.client?.stop();
  },
  methods: {
    async startCall() {
      if (!this.token) return;
      this.errorMsg = '';
      this.userText = '';
      this.aiText = '';
      this.connecting = true;
      this.client = new RealtimeClient(this.token, REALTIME_DEFAULT_MODEL, {
        onStatus: (s: RealtimeStatus) => {
          this.status = s;
          this.running = s === 'connecting' || s === 'connected';
          if (s === 'connected' || s === 'disconnected' || s === 'error') this.connecting = false;
        },
        onUserSpeechStarted: () => {
          this.aiSpeaking = false;
        },
        onUserTranscript: (t: string) => {
          this.userText = t;
        },
        onAiResponseStart: () => {
          this.aiText = '';
          this.aiSpeaking = true;
        },
        onAiTranscriptDelta: (d: string) => {
          this.aiText += d;
        },
        onError: (m: string) => {
          this.errorMsg = m;
        }
      });
      try {
        await this.client.start();
      } catch (e: any) {
        this.connecting = false;
        this.running = false;
        this.errorMsg = e?.message || this.$t('realtime.startFailed');
        this.client?.stop();
      }
    },
    endCall() {
      this.client?.stop();
      this.running = false;
      this.aiSpeaking = false;
    },
    goBack() {
      this.client?.stop();
      this.$router.push({ name: ROUTE_CHATGPT_CONVERSATION_NEW });
    }
  }
});
</script>

<style lang="scss" scoped>
.realtime-call {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  padding: 20px;
}
.call-card {
  width: 100%;
  max-width: 480px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}
.call-header {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 10px;
  .title {
    flex: 1;
    font-weight: 600;
  }
  .status {
    font-size: 12px;
    color: #999;
    &.connected {
      color: #34c759;
    }
    &.error {
      color: #ff3b30;
    }
  }
}
.orb {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  color: #fff;
  background: #c8c9cc;
  transition: all 0.3s ease;
  &.active {
    background: #409eff;
  }
  &.speaking {
    background: #34c759;
    box-shadow: 0 0 0 12px rgba(52, 199, 89, 0.18);
  }
}
.transcript {
  min-height: 80px;
  width: 100%;
  .line {
    margin: 6px 0;
    text-align: left;
    .who {
      font-weight: 600;
      margin-right: 6px;
      opacity: 0.7;
    }
  }
  .hint {
    color: #999;
  }
  .hint.small {
    font-size: 12px;
  }
}
.error {
  color: #ff3b30;
  font-size: 13px;
}
.btn-icon {
  margin-right: 6px;
}
.hint.small {
  font-size: 12px;
  color: #999;
}
</style>
