<template>
  <main class="motion-lab" :class="{ light }">
    <header>
      <a class="brand" href="/">N<span>nexior</span></a>
      <div class="header-actions">
        <button @click="toggleLocale">{{ $i18n.locale === 'en' ? '中文' : 'English' }}</button>
        <button :aria-pressed="light" @click="light = !light">{{ $t('chat.motion.theme') }}</button>
        <a href="https://github.com/AceDataCloud/Nexior" target="_blank" rel="noopener noreferrer">GitHub ↗</a>
      </div>
    </header>
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">NEXIOR / MOTION LAB</p>
        <h1>{{ $t('chat.motion.title') }}</h1>
        <p class="subtitle">{{ $t('chat.motion.subtitle') }}</p>
        <div class="hero-actions">
          <button class="primary" @click="replay">{{ $t('chat.motion.replay') }} <span>↗</span></button>
          <button :aria-pressed="animated" @click="animated = !animated">
            {{ $t(animated ? 'chat.motion.pause' : 'chat.motion.resume') }}
          </button>
        </div>
        <p class="demo-note">{{ $t('chat.motion.demoNote') }}</p>
      </div>
      <div class="hero-orb">
        <motion-orb :size="280" :animated="animated" /><span class="orb-caption">01 / {{ $t('chat.motion.orb') }}</span>
      </div>
    </section>
    <section class="workspace">
      <article class="conversation-card">
        <div class="card-heading">
          <span>{{ $t('chat.motion.conversation') }}</span
          ><span class="live-dot">{{ $t('chat.motion.preview') }}</span>
        </div>
        <div class="state-tabs" :aria-label="$t('chat.motion.states')">
          <button v-for="stage in stages" :key="stage" :aria-pressed="current === stage" @click="select(stage)">
            {{ $t(`chat.motion.${stage}`) }}
          </button>
        </div>
        <div class="transcript">
          <div class="question">{{ $t('chat.motion.question') }}</div>
          <div class="assistant-heading"><span class="avatar-n">N</span><span>Nexior</span></div>
          <message
            :message="demoMessage"
            :application="{}"
            :readonly="true"
            :answering="current === 'waiting' || current === 'reasoning' || current === 'replying'"
          />
        </div>
        <div class="composer">
          <span>{{ $t('chat.motion.composer') }}</span
          ><span class="send">↑</span>
        </div>
      </article>
      <aside class="side-cards">
        <article class="progress-card">
          <p class="eyebrow">02 / {{ $t('chat.motion.progress') }}</p>
          <div class="progress-value">{{ progress }}<span>%</span></div>
          <div
            class="progress-track"
            role="progressbar"
            :aria-label="$t('chat.motion.progress')"
            :aria-valuenow="progress"
            aria-valuemin="0"
            aria-valuemax="100"
          >
            <div :style="{ width: `${progress}%` }" />
          </div>
          <input v-model.number="progress" type="range" min="0" max="100" :aria-label="$t('chat.motion.progress')" />
          <p>{{ $t('chat.motion.progressNote') }}</p>
        </article>
        <article class="ambient-card">
          <p class="eyebrow">03 / {{ $t('chat.motion.ambient') }}</p>
          <h2>{{ $t('chat.motion.ambientTitle') }}</h2>
          <p>{{ $t('chat.motion.ambientNote') }}</p>
        </article>
      </aside>
    </section>
    <footer>
      <span>{{ $t('chat.motion.source') }}</span
      ><a href="https://metalforge.xyz/" target="_blank" rel="noopener noreferrer"
        >{{ $t('chat.motion.inspiration') }} ↗</a
      >
    </footer>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, provide, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import MotionOrb from '@/components/common/MotionOrb.vue';
import Message from '@/components/chat/Message.vue';
import { IChatMessageState, type IChatMessage } from '@/models';
import { setI18nLanguage } from '@/i18n';

const { t, locale } = useI18n();
const stages = ['waiting', 'reasoning', 'replying', 'complete', 'failed'] as const;
type Stage = (typeof stages)[number];
const current = ref<Stage>('waiting');
const light = ref(false);
const animated = ref(true);
const progress = ref(58);
provide('nexior-motion-enabled', animated);
let timer: ReturnType<typeof setInterval> | undefined;
const demoMessage = computed<IChatMessage>(() => ({
  role: 'assistant',
  content:
    current.value === 'replying'
      ? t('chat.motion.reply').slice(0, Math.ceil(t('chat.motion.reply').length / 2))
      : current.value === 'complete'
        ? t('chat.motion.reply')
        : '',
  thinking: current.value === 'reasoning' || current.value === 'complete' ? t('chat.motion.reasoningText') : undefined,
  state:
    current.value === 'waiting'
      ? IChatMessageState.PENDING
      : current.value === 'replying' || current.value === 'reasoning'
        ? IChatMessageState.ANSWERING
        : current.value === 'failed'
          ? IChatMessageState.FAILED
          : IChatMessageState.FINISHED,
  error: current.value === 'failed' ? { code: 'stream_interrupted', message: t('chat.motion.error') } : undefined
}));
function stop() {
  clearInterval(timer);
  timer = undefined;
}
function select(stage: Stage) {
  stop();
  current.value = stage;
}
function replay() {
  stop();
  current.value = 'waiting';
  const sequence: Stage[] = ['reasoning', 'replying', 'complete'];
  timer = setInterval(() => {
    const next = sequence.shift();
    if (next) current.value = next;
    if (!sequence.length) stop();
  }, 2200);
}
async function toggleLocale() {
  const next = locale.value === 'en' ? 'zh-CN' : 'en';
  await setI18nLanguage(next);
  const url = new URL(location.href);
  url.searchParams.set('lang', next);
  history.replaceState(null, '', url);
}
onBeforeUnmount(stop);
</script>

<style>
html,
body,
#app {
  margin: 0;
  min-height: 100%;
}
body {
  font-family:
    Inter,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
}
.motion-lab {
  --lab-bg: #09090e;
  --lab-panel: #14131b;
  --lab-text: #f4f0ff;
  --lab-muted: #aaa3b9;
  --lab-border: #302b3b;
  --el-text-color-primary: var(--lab-text);
  --el-text-color-regular: var(--lab-muted);
  --el-color-primary: #bc9ef1;
  --el-fill-color-lighter: var(--lab-panel);
  --el-border-color: var(--lab-border);
  min-height: 100vh;
  color: var(--lab-text);
  background: var(--lab-bg);
  padding: 0 max(24px, calc((100vw - 1200px) / 2));
}
.motion-lab.light {
  --lab-bg: #f8f6fc;
  --lab-panel: #fff;
  --lab-text: #252030;
  --lab-muted: #655d76;
  --lab-border: #dfd8eb;
  --el-color-primary: #7550ad;
}
.motion-lab * {
  box-sizing: border-box;
}
.motion-lab a {
  color: inherit;
  text-decoration: none;
}
.motion-lab button {
  font: inherit;
  color: inherit;
  cursor: pointer;
  background: transparent;
  border: 1px solid var(--lab-border);
  border-radius: 100px;
  padding: 10px 18px;
}
.motion-lab button:focus-visible,
.motion-lab a:focus-visible,
.motion-lab input:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 4px;
}
.motion-lab header {
  height: 86px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--lab-border);
}
.brand {
  font-weight: 800;
  font-size: 25px;
  display: flex;
  gap: 14px;
  align-items: center;
}
.brand > span {
  font-size: 19px;
  font-weight: 550;
  letter-spacing: -0.7px;
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
}
.header-actions a {
  padding: 10px;
}
.hero {
  min-height: 410px;
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  align-items: center;
  gap: 60px;
  padding: 50px 0 40px;
}
.eyebrow {
  font-size: 11px;
  letter-spacing: 2px;
  font-weight: 650;
  color: var(--lab-muted);
  margin: 0 0 20px;
  text-transform: uppercase;
}
.hero h1 {
  font-size: clamp(38px, 4.7vw, 60px);
  line-height: 1.12;
  letter-spacing: -2.5px;
  max-width: 600px;
  text-wrap: balance;
  margin: 0;
  font-weight: 600;
}
.subtitle {
  font-size: 16px;
  color: var(--lab-muted);
  max-width: 480px;
  line-height: 1.7;
  margin: 22px 0 25px;
}
.hero-actions {
  display: flex;
  gap: 10px;
}
.motion-lab .primary {
  background: #c7aaf4;
  color: #231433;
  border-color: #c7aaf4;
  font-weight: 600;
}
.primary span {
  padding-left: 18px;
}
.demo-note {
  font-size: 12px;
  color: var(--lab-muted);
  margin-top: 18px;
}
.hero-orb {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  position: relative;
}
.hero-orb::before {
  content: '';
  position: absolute;
  inset: 12%;
  background: #7951b9;
  opacity: 0.15;
  filter: blur(60px);
  border-radius: 50%;
  pointer-events: none;
}
.orb-caption {
  font-size: 11px;
  color: var(--lab-muted);
  letter-spacing: 2px;
}
.workspace {
  display: grid;
  grid-template-columns: 1.65fr 1fr;
  gap: 20px;
}
.conversation-card,
.progress-card,
.ambient-card {
  border: 1px solid var(--lab-border);
  border-radius: 20px;
  background: var(--lab-panel);
}
.conversation-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 385px;
}
.card-heading {
  display: flex;
  justify-content: space-between;
  padding: 20px 24px;
  font-size: 13px;
  border-bottom: 1px solid var(--lab-border);
}
.live-dot {
  font-size: 11px;
  color: var(--lab-muted);
}
.live-dot::before {
  content: '';
  display: inline-block;
  width: 6px;
  height: 6px;
  background: #a1d2be;
  border-radius: 50%;
  margin-right: 8px;
}
.state-tabs {
  display: flex;
  gap: 6px;
  padding: 16px 24px 4px;
  flex-wrap: wrap;
}
.state-tabs button {
  font-size: 11px;
  padding: 7px 11px;
  border-color: transparent;
  color: var(--lab-muted);
}
.state-tabs button[aria-pressed='true'] {
  color: var(--lab-text);
  background: rgba(144, 114, 190, 0.18);
  border-color: var(--lab-border);
}
.transcript {
  padding: 20px 24px;
  flex: 1;
  min-height: 220px;
}
.question {
  margin-left: auto;
  width: fit-content;
  max-width: 90%;
  padding: 12px 16px;
  background: rgba(144, 114, 190, 0.14);
  border-radius: 14px 14px 4px 14px;
  font-size: 13px;
  line-height: 1.5;
}
.assistant-heading {
  display: flex;
  gap: 8px;
  align-items: center;
  margin: 22px 0 8px;
  font-size: 12px;
  color: var(--lab-muted);
}
.avatar-n {
  display: grid;
  place-items: center;
  height: 22px;
  width: 22px;
  border-radius: 7px;
  background: var(--lab-bg);
  font-weight: 700;
  color: var(--lab-text);
}
.transcript .message {
  padding: 0;
  margin: 0;
  width: 100%;
  font-size: 13px;
}
.transcript .message .author,
.transcript .message .operations {
  display: none;
}
.transcript .message .main {
  width: 100%;
  min-width: 0;
  margin: 0;
}
.transcript .message .content {
  padding: 0;
  background: transparent;
}
.transcript .markdown-body {
  background: transparent !important;
  color: var(--lab-text) !important;
  font-size: 13px !important;
}
.transcript .thinking-content {
  color: var(--lab-muted);
}
.composer {
  margin: 0 20px 20px;
  border: 1px solid var(--lab-border);
  border-radius: 14px;
  padding: 12px 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--lab-muted);
  font-size: 12px;
}
.send {
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--lab-border);
  color: var(--lab-text);
}
.side-cards {
  display: grid;
  gap: 20px;
  grid-template-rows: 1.2fr 1fr;
}
.progress-card,
.ambient-card {
  padding: 23px;
}
.progress-card .eyebrow {
  margin-bottom: 12px;
}
.progress-value {
  font-size: 44px;
  line-height: 1.1;
  letter-spacing: -2px;
}
.progress-value span {
  color: var(--lab-muted);
  font-size: 22px;
  margin-left: 4px;
}
.progress-track {
  margin: 18px 0 12px;
  height: 8px;
  overflow: hidden;
  border-radius: 99px;
  background: var(--lab-border);
}
.progress-track > div {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #6c56a8, #c7aaf4, #e0dcf1);
}
.progress-card input {
  width: 100%;
  accent-color: #bb9aec;
  height: 14px;
}
.progress-card > p:last-child,
.ambient-card > p:last-child {
  font-size: 12px;
  line-height: 1.6;
  color: var(--lab-muted);
  margin: 13px 0 0;
}
.ambient-card {
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(ellipse at 95% 0%, rgba(151, 96, 206, 0.3), transparent 65%),
    radial-gradient(ellipse at 0% 100%, rgba(77, 120, 163, 0.22), transparent 70%), var(--lab-panel);
}
.ambient-card h2 {
  font-size: 23px;
  font-weight: 500;
  letter-spacing: -0.6px;
  margin: 0;
}
.motion-lab footer {
  padding: 26px 0 30px;
  display: flex;
  justify-content: space-between;
  gap: 15px;
  font-size: 11px;
  color: var(--lab-muted);
  line-height: 1.5;
}
@media (max-width: 720px) {
  .motion-lab {
    padding: 0 18px;
  }
  .motion-lab header {
    height: 74px;
  }
  .brand > span {
    font-size: 17px;
  }
  .header-actions {
    gap: 4px;
  }
  .header-actions button {
    padding: 7px 10px;
  }
  .header-actions a {
    display: none;
  }
  .hero {
    grid-template-columns: 1fr;
    gap: 28px;
    padding-top: 34px;
  }
  .hero h1 {
    letter-spacing: -1.5px;
  }
  .hero-orb {
    order: -1;
  }
  .hero-orb .motion-orb {
    width: 200px !important;
    height: 200px !important;
  }
  .workspace {
    grid-template-columns: 1fr;
  }
  .card-heading,
  .state-tabs,
  .transcript {
    padding-left: 18px;
    padding-right: 18px;
  }
  .motion-lab footer {
    flex-direction: column;
  }
}
@media (prefers-reduced-motion: reduce) {
  .motion-lab *,
  .motion-lab *::before {
    animation: none !important;
    transition: none !important;
  }
}
</style>
