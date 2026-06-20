<template>
  <div class="rtc" :class="{ 'is-captions': captionsOn, 'is-live': running }">
    <!-- top bar: minimal utility icons (mirrors the ChatGPT voice screen) -->
    <header class="rtc-top">
      <button class="ic" :title="$t('realtime.title')" @click="goBack">
        <font-awesome-icon icon="fa-solid fa-chevron-down" />
      </button>
      <div class="rtc-top-right">
        <button class="ic" :class="{ on: showInfo }" :title="$t('realtime.title')" @click="showInfo = !showInfo">
          <font-awesome-icon icon="fa-solid fa-circle-info" />
        </button>
        <button class="ic" :class="{ on: captionsOn }" :title="$t('realtime.captions')" @click="toggleCaptions">
          <font-awesome-icon icon="fa-solid fa-closed-captioning" />
        </button>
      </div>
    </header>

    <!-- stage: the audio-reactive orb -->
    <main class="rtc-stage">
      <div class="orb-stage" @click="onOrbTap">
        <div class="orb-halo" :style="haloStyle"></div>
        <div class="orb-breathe" :class="{ paused: !running }">
          <div class="orb" :class="orbClass" :style="{ transform: `scale(${orbScale})` }">
            <span class="cloud c1"></span>
            <span class="cloud c2"></span>
            <span class="cloud c3"></span>
            <span class="sheen"></span>
          </div>
        </div>
      </div>

      <transition name="fade">
        <p v-if="showInfo && !captionsOn" class="rtc-info">{{ modelName }}</p>
      </transition>

      <!-- captions: large transcript, dark theme (ChatGPT CC mode) -->
      <div v-if="captionsOn" class="rtc-captions">
        <p v-if="userText" class="cap user">{{ userText }}</p>
        <p class="cap ai">{{ captionText }}</p>
      </div>
      <p v-else class="rtc-status" :class="{ err: !!errorMsg }">{{ stageText }}</p>
    </main>

    <!-- bottom control bar: circular buttons -->
    <footer class="rtc-controls">
      <button
        class="ctl"
        :class="{ active: muted }"
        :title="muted ? $t('realtime.unmute') : $t('realtime.mute')"
        @click="toggleMute"
      >
        <font-awesome-icon :icon="muted ? 'fa-solid fa-microphone-slash' : 'fa-solid fa-microphone'" />
      </button>
      <button class="ctl" :class="{ active: captionsOn }" :title="$t('realtime.captions')" @click="toggleCaptions">
        <font-awesome-icon icon="fa-solid fa-closed-captioning" />
      </button>
      <button class="ctl end" :title="$t('realtime.end')" @click="endCall">
        <font-awesome-icon icon="fa-solid fa-xmark" />
      </button>
    </footer>
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
      errorMsg: '',
      level: 0,
      muted: false,
      captionsOn: false,
      showInfo: false
    };
  },
  computed: {
    token(): string | undefined {
      return this.$store.state.realtime?.credential?.token;
    },
    canCall(): boolean {
      return !!this.token;
    },
    modelName(): string {
      return REALTIME_DEFAULT_MODEL;
    },
    orbScale(): number {
      // gentle audio-reactive swell; idle orb just breathes (handled in CSS)
      return 1 + this.level * 0.16;
    },
    haloStyle(): Record<string, string> {
      const lvl = this.running ? this.level : 0;
      return {
        transform: `scale(${1 + lvl * 0.7})`,
        opacity: `${0.16 + lvl * 0.5}`
      };
    },
    orbClass(): Record<string, boolean> {
      return { speaking: this.aiSpeaking, live: this.running, idle: !this.running };
    },
    captionText(): string {
      if (this.aiText) return this.aiText;
      if (this.running && !this.userText) return this.$t('realtime.listening');
      return '';
    },
    stageText(): string {
      if (this.errorMsg) return this.errorMsg;
      if (this.provisioning || this.connecting) return this.$t('realtime.status.connecting');
      if (this.running) return this.aiSpeaking ? this.$t('realtime.speaking') : this.$t('realtime.listening');
      return this.$t('realtime.start');
    }
  },
  async mounted() {
    this.provisioning = true;
    try {
      await this.$store.dispatch('realtime/init');
    } finally {
      this.provisioning = false;
    }
    // Enter the call like ChatGPT voice: connect immediately once provisioned.
    if (this.canCall) this.startCall();
  },
  beforeUnmount() {
    this.client?.stop();
  },
  methods: {
    async startCall() {
      if (!this.token || this.connecting || this.running) return;
      this.errorMsg = '';
      this.userText = '';
      this.aiText = '';
      this.connecting = true;
      this.client = new RealtimeClient(this.token, REALTIME_DEFAULT_MODEL, {
        onStatus: (s: RealtimeStatus) => {
          this.status = s;
          this.running = s === 'connecting' || s === 'connected';
          if (s === 'connected' || s === 'disconnected' || s === 'error') this.connecting = false;
          if (!this.running) this.level = 0;
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
        onAudioLevel: (lvl: number) => {
          this.level = lvl;
        },
        onError: (m: string) => {
          this.errorMsg = m;
        }
      });
      // a fresh call should honour the current mute state
      try {
        await this.client.start();
        this.client.setMuted(this.muted);
      } catch (e: any) {
        this.connecting = false;
        this.running = false;
        this.errorMsg = e?.message || this.$t('realtime.startFailed');
        this.client?.stop();
      }
    },
    toggleMute() {
      this.muted = !this.muted;
      this.client?.setMuted(this.muted);
    },
    toggleCaptions() {
      this.captionsOn = !this.captionsOn;
    },
    onOrbTap() {
      if (!this.running && !this.connecting) this.startCall();
    },
    endCall() {
      this.client?.stop();
      this.running = false;
      this.aiSpeaking = false;
      this.level = 0;
      this.goBack();
    },
    goBack() {
      this.client?.stop();
      this.$router.push({ name: ROUTE_CHATGPT_CONVERSATION_NEW });
    }
  }
});
</script>

<style lang="scss" scoped>
.rtc {
  --bg: #ffffff;
  --fg: #1c1c1e;
  --muted: #9aa0a6;
  --chip: #f1f2f4;
  --chip-fg: #3c4043;
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background: var(--bg);
  color: var(--fg);
  overflow: hidden;
  transition:
    background 0.45s ease,
    color 0.45s ease;
}
// CC mode flips to the dark “captions” look from ChatGPT voice.
.rtc.is-captions {
  --bg: #0a0a0b;
  --fg: #ffffff;
  --muted: #8e8e93;
  --chip: rgba(255, 255, 255, 0.12);
  --chip-fg: #ffffff;
}

/* ---------- top bar ---------- */
.rtc-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  z-index: 2;
}
.rtc-top-right {
  display: flex;
  gap: 6px;
}
.ic {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--muted);
  font-size: 17px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background 0.2s ease,
    color 0.2s ease;
  &:hover {
    background: var(--chip);
    color: var(--chip-fg);
  }
  &.on {
    color: #2f86f6;
  }
}

/* ---------- stage / orb ---------- */
.rtc-stage {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 26px;
  padding: 0 24px;
  transition: justify-content 0.4s ease;
}
.rtc.is-captions .rtc-stage {
  justify-content: flex-start;
  padding-top: 8px;
}
.orb-stage {
  position: relative;
  width: 200px;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.4s ease;
}
.rtc.is-captions .orb-stage {
  width: 96px;
  height: 96px;
}
.orb-halo {
  position: absolute;
  inset: -16%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(79, 150, 255, 0.55), rgba(79, 150, 255, 0) 62%);
  filter: blur(14px);
  transition:
    transform 0.12s ease-out,
    opacity 0.2s ease;
  pointer-events: none;
}
.orb-breathe {
  width: 100%;
  height: 100%;
  animation: breathe 6.5s ease-in-out infinite;
  &.paused {
    animation-duration: 9s;
  }
}
@keyframes breathe {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.04);
  }
}
.orb {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
  background: radial-gradient(120% 120% at 34% 24%, #ffffff 0%, #eaf4ff 16%, #c2deff 40%, #79b3ff 70%, #2f86f6 100%);
  box-shadow:
    0 20px 55px rgba(47, 134, 246, 0.4),
    inset 0 -16px 36px rgba(18, 86, 188, 0.5),
    inset 0 14px 30px rgba(255, 255, 255, 0.6);
  transition:
    transform 0.1s ease-out,
    filter 0.3s ease;
  will-change: transform;
}
.orb.idle {
  filter: saturate(0.9) brightness(1.02);
}
.orb.speaking {
  box-shadow:
    0 22px 60px rgba(47, 134, 246, 0.55),
    inset 0 -16px 36px rgba(18, 86, 188, 0.5),
    inset 0 14px 30px rgba(255, 255, 255, 0.65);
}
.cloud {
  position: absolute;
  border-radius: 50%;
  filter: blur(13px);
  mix-blend-mode: screen;
  pointer-events: none;
}
.cloud.c1 {
  top: -28%;
  left: -22%;
  width: 92%;
  height: 82%;
  background: radial-gradient(circle at 50% 50%, #ffffff, rgba(255, 255, 255, 0) 70%);
  animation: drift-a 13s ease-in-out infinite;
}
.cloud.c2 {
  bottom: -26%;
  right: -18%;
  width: 84%;
  height: 74%;
  background: radial-gradient(circle at 50% 50%, #dcefff, rgba(220, 239, 255, 0) 70%);
  animation: drift-b 17s ease-in-out infinite;
}
.cloud.c3 {
  top: 30%;
  left: 28%;
  width: 60%;
  height: 52%;
  background: radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0) 68%);
  animation: drift-a 21s ease-in-out infinite reverse;
}
.sheen {
  position: absolute;
  top: 10%;
  left: 18%;
  width: 42%;
  height: 30%;
  border-radius: 50%;
  background: radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0) 70%);
  filter: blur(4px);
  pointer-events: none;
}
@keyframes drift-a {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(10%, 8%) scale(1.12);
  }
}
@keyframes drift-b {
  0%,
  100% {
    transform: translate(0, 0) scale(1.05);
  }
  50% {
    transform: translate(-12%, -8%) scale(0.92);
  }
}

/* ---------- status / info / captions ---------- */
.rtc-status {
  font-size: 17px;
  color: var(--muted);
  margin: 0;
  min-height: 24px;
  text-align: center;
  &.err {
    color: #ff3b30;
  }
}
.rtc-info {
  font-size: 13px;
  color: var(--muted);
  margin: -10px 0 0;
}
.rtc-captions {
  width: 100%;
  max-width: 560px;
  margin-top: 22px;
  text-align: left;
  .cap {
    margin: 0 0 14px;
  }
  .cap.user {
    font-size: 15px;
    color: var(--muted);
  }
  .cap.ai {
    font-size: 30px;
    line-height: 1.35;
    font-weight: 500;
    color: var(--fg);
  }
}

/* ---------- bottom controls ---------- */
.rtc-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 26px;
  padding: 22px 16px calc(26px + env(safe-area-inset-bottom, 0px));
  z-index: 2;
}
.ctl {
  width: 60px;
  height: 60px;
  border: none;
  border-radius: 50%;
  background: var(--chip);
  color: var(--chip-fg);
  font-size: 21px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    transform 0.15s ease,
    background 0.2s ease,
    color 0.2s ease;
  &:hover {
    transform: translateY(-2px);
  }
  &:active {
    transform: scale(0.94);
  }
  &.active {
    background: #2f86f6;
    color: #fff;
  }
  &.end {
    background: #2b2b2e;
    color: #fff;
  }
}
.rtc.is-captions .ctl.end {
  background: rgba(255, 255, 255, 0.16);
}

/* ---------- transitions ---------- */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 520px) {
  .orb-stage {
    width: 168px;
    height: 168px;
  }
  .rtc-captions .cap.ai {
    font-size: 26px;
  }
}
</style>
