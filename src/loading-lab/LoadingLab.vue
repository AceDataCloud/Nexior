<template>
  <main class="loading-lab" :class="{ light }">
    <header>
      <a href="/"
        >AceData <span>{{ system }}</span></a
      >
      <div>
        <button @click="toggleLocale">中文 / EN</button
        ><button @click="toggleTheme">{{ $t('common.loadingLab.theme') }}</button>
      </div>
    </header>
    <div class="heading">
      <div>
        <p class="eyebrow">LOADING / INTEGRATION POC</p>
        <h1>{{ $t('common.loadingLab.title') }}</h1>
      </div>
      <p>{{ $t('common.loadingLab.local') }}</p>
    </div>
    <div class="layout">
      <aside>
        <h2>{{ $t('common.loadingLab.choose') }}</h2>
        <div class="tools">
          <button
            v-for="item in loadingTools"
            :key="item.id"
            :aria-pressed="tool === item.id"
            @click="selectTool(item.id)"
          >
            <loading-indicator
              :options="{ tool: item.id, size: 30, color: light ? '#387c2b' : '#b5ef81', paused }"
            /><span
              >{{ item.name }}<small>{{ item.format }}</small></span
            >
          </button>
        </div>
        <label
          >{{ $t('common.loadingLab.size') }} <output>{{ size }} px</output
          ><input v-model.number="size" type="range" min="24" max="128" step="8" /></label
        ><label
          >{{ $t('common.loadingLab.speed') }} <output>{{ speed }}×</output
          ><input v-model.number="speed" type="range" min="0.5" max="2" step="0.25" /></label
        ><label>{{ $t('common.loadingLab.color') }}<input v-model="color" type="color" /></label
        ><button class="wide" :aria-pressed="paused" @click="paused = !paused">
          {{ $t(paused ? 'common.loadingLab.resume' : 'common.loadingLab.pause') }}
        </button>
      </aside>
      <section class="work">
        <div class="hero">
          <div class="hero-head">
            <span>{{ selected.name }}</span
            ><a :href="selected.source" target="_blank" rel="noopener noreferrer">{{
              $t('common.loadingLab.source')
            }}</a>
          </div>
          <loading-indicator :key="replayKey" :options="options" :stage="stage" />
          <h2>{{ $t(`common.loadingLab.${stage}`) }}</h2>
          <p>{{ $t(`common.loadingLab.note.${tool}`) }}</p>
        </div>
        <section class="integration">
          <div class="integration-head">
            <h2>{{ $t('common.loadingLab.integration') }}</h2>
            <code>{{ componentName }}</code>
          </div>
          <div class="states">
            <button v-for="item in stages" :key="item" :aria-pressed="stage === item" @click="selectStage(item)">
              {{ $t(`common.loadingLab.${item}`) }}
            </button>
          </div>
          <div class="system-preview"><slot :options="{ ...options, size: 28 }" :busy="busy" :stage="stage" /></div>
          <div class="actions">
            <button class="primary" @click="running ? stop() : replay()">
              {{ $t(running ? 'common.loadingLab.stop' : 'common.loadingLab.replay') }}</button
            ><a :href="`/?loading_tool=${tool}`">{{ system }}</a
            ><span>{{ $t('common.loadingLab.noBilling') }}</span>
          </div>
        </section>
        <section class="steps">
          <h2>{{ $t('common.loadingLab.test') }}</h2>
          <ol>
            <li>{{ $t('common.loadingLab.testSelect') }}</li>
            <li>{{ $t('common.loadingLab.testStates') }}</li>
            <li>{{ $t('common.loadingLab.testPause') }}</li>
          </ol>
          <code>&lt;loading-indicator :options="{ tool: '{{ tool }}', size: 28 }" /&gt;</code>
        </section>
      </section>
    </div>
    <footer>
      {{ $t('common.loadingLab.boundary') }}<span>{{ selected.format }}</span>
    </footer>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import { setI18nLanguage, getLocale } from '@/i18n';
import LoadingIndicator from '@/components/loading/LoadingIndicator.vue';
import { loadingTools, isLoadingTool, type LoadingTool, type LoadingOptions } from '@/components/loading/catalog';
defineProps({ system: { type: String, required: true }, componentName: { type: String, required: true } });
defineSlots<{ default(props: { options: LoadingOptions; busy: boolean; stage: string }): unknown }>();
const initial = new URLSearchParams(location.search).get('tool');
const tool = ref<LoadingTool>(isLoadingTool(initial) ? initial : 'dot-matrix');
const size = ref(80);
const speed = ref(1);
const color = ref('#b5ef81');
const paused = ref(false);
const light = ref(false);
const replayKey = ref(0);
const running = ref(false);
const stages = ['waiting', 'reasoning', 'replying', 'complete', 'failed'] as const;
const stage = ref<(typeof stages)[number]>('waiting');
const selected = computed(() => loadingTools.find((item) => item.id === tool.value)!);
const options = computed<LoadingOptions>(() => ({
  tool: tool.value,
  size: size.value,
  speed: speed.value,
  color: color.value,
  paused: paused.value
}));
const busy = computed(() => !['complete', 'failed'].includes(stage.value));
let timer: ReturnType<typeof setInterval> | undefined;
function stop() {
  clearInterval(timer);
  timer = undefined;
  running.value = false;
}
function selectTool(next: LoadingTool) {
  stop();
  tool.value = next;
  const url = new URL(location.href);
  url.searchParams.set('tool', next);
  history.replaceState(null, '', url);
  replayKey.value++;
}
function selectStage(next: (typeof stages)[number]) {
  stop();
  stage.value = next;
  replayKey.value++;
}
function replay() {
  stop();
  stage.value = 'waiting';
  running.value = true;
  const sequence = ['reasoning', 'replying', 'complete'] as const;
  let index = 0;
  timer = setInterval(() => {
    stage.value = sequence[index++];
    replayKey.value++;
    if (index === sequence.length) stop();
  }, 1800);
}
function toggleTheme() {
  light.value = !light.value;
  if (light.value && color.value === '#b5ef81') color.value = '#387c2b';
  else if (!light.value && color.value === '#387c2b') color.value = '#b5ef81';
}
async function toggleLocale() {
  const next = getLocale() === 'zh-CN' ? 'en' : 'zh-CN';
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
  font-family:
    Inter,
    -apple-system,
    BlinkMacSystemFont,
    'PingFang SC',
    sans-serif;
}
.loading-lab {
  --lab-bg: #0d1418;
  --lab-panel: #172128;
  --lab-border: #35434d;
  --lab-text: #edf4f5;
  --lab-muted: #a8b7c0;
  background: var(--lab-bg);
  color: var(--lab-text);
  min-height: 100vh;
  padding: 28px 5vw 36px;
}
.loading-lab.light {
  --lab-bg: #f3f6f8;
  --lab-panel: #fff;
  --lab-border: #d2dde2;
  --lab-text: #17262f;
  --lab-muted: #526975;
}
.loading-lab header,
.loading-lab .heading,
.loading-lab footer {
  max-width: 1150px;
  margin: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}
.loading-lab header {
  padding-bottom: 24px;
  border-bottom: 1px solid var(--lab-border);
}
.loading-lab header > a {
  font-size: 21px;
  font-weight: 650;
}
.loading-lab header span {
  font-size: 14px;
  color: var(--lab-muted);
  margin-left: 10px;
}
.loading-lab header > div {
  display: flex;
  gap: 8px;
}
.loading-lab a {
  color: inherit;
  text-decoration: none;
}
.loading-lab button {
  cursor: pointer;
  font: inherit;
  font-size: 14px;
  padding: 9px 12px;
  border: 1px solid var(--lab-border);
  background: transparent;
  color: inherit;
  border-radius: 8px;
}
.loading-lab button:focus-visible,
.loading-lab a:focus-visible,
.loading-lab input:focus-visible {
  outline: 2px solid #79bb50;
  outline-offset: 3px;
}
.loading-lab .heading {
  align-items: flex-end;
  margin: 28px auto;
}
.loading-lab .heading p {
  color: var(--lab-muted);
  font-size: 14px;
  max-width: 320px;
  line-height: 1.6;
}
.loading-lab .eyebrow {
  font-size: 12px !important;
  letter-spacing: 2px;
  color: #82be5a !important;
  margin: 0 0 9px;
}
.loading-lab h1 {
  font-size: 30px;
  margin: 0;
  line-height: 1.3;
}
.loading-lab h2 {
  font-size: 17px;
  margin: 0 0 16px;
  font-weight: 600;
}
.loading-lab .layout {
  max-width: 1150px;
  margin: auto;
  display: grid;
  grid-template-columns: 290px minmax(0, 1fr);
  gap: 22px;
}
.loading-lab aside,
.loading-lab .hero,
.loading-lab .integration,
.loading-lab .steps {
  border: 1px solid var(--lab-border);
  background: var(--lab-panel);
  border-radius: 14px;
  padding: 22px;
}
.loading-lab aside {
  align-self: start;
}
.loading-lab .tools {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.loading-lab .tools button {
  display: flex;
  gap: 12px;
  align-items: center;
  text-align: left;
  padding: 12px;
}
.loading-lab .tools button[aria-pressed='true'] {
  border-color: #83bd5d;
  background: #83bd5d15;
}
.loading-lab .tools small {
  display: block;
  color: var(--lab-muted);
  font-size: 12px;
  margin-top: 4px;
}
.loading-lab label {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin: 22px 0;
  font-size: 14px;
}
.loading-lab output {
  color: var(--lab-muted);
  font-family: monospace;
}
.loading-lab input[type='range'] {
  width: 100%;
  accent-color: #83bd5d;
}
.loading-lab input[type='color'] {
  width: 40px;
  height: 30px;
  border: 0;
  background: transparent;
}
.loading-lab .wide {
  width: 100%;
}
.loading-lab .work {
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-width: 0;
}
.loading-lab .hero {
  display: flex;
  align-items: center;
  flex-direction: column;
  min-height: 300px;
}
.loading-lab .hero-head {
  width: 100%;
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: var(--lab-muted);
}
.loading-lab .hero > .loading-indicator {
  margin: 35px 0 25px;
}
.loading-lab .hero h2 {
  font-size: 22px;
  margin-bottom: 10px;
}
.loading-lab .hero p {
  font-size: 14px;
  color: var(--lab-muted);
  line-height: 1.7;
  margin: 0;
  text-align: center;
  max-width: 560px;
}
.loading-lab .integration-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
.loading-lab .integration-head code {
  font-size: 12px;
  color: var(--lab-muted);
}
.loading-lab .states {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 20px;
}
.loading-lab .states button[aria-pressed='true'] {
  background: #83bd5d24;
  border-color: #83bd5d;
}
.loading-lab .system-preview {
  padding: 16px;
  border-radius: 10px;
  border: 1px solid var(--lab-border);
  min-height: 160px;
  background: color-mix(in srgb, var(--lab-bg) 65%, transparent);
  --el-text-color-primary: var(--lab-text);
  --el-text-color-regular: var(--lab-text);
  --el-text-color-secondary: var(--lab-muted);
  --el-fill-color-blank: var(--lab-panel);
  --el-bg-color: var(--lab-panel);
  --el-border-color-light: var(--lab-border);
  --el-fill-color: var(--lab-border);
}
.loading-lab .actions {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 18px;
}
.loading-lab .primary {
  background: #a8dc7d;
  color: #192511;
  border-color: #a8dc7d;
  white-space: nowrap;
}
.loading-lab .actions span {
  font-size: 13px;
  color: var(--lab-muted);
  line-height: 1.6;
}
.loading-lab .steps ol {
  padding-left: 20px;
  font-size: 15px;
  line-height: 1.9;
  color: var(--lab-muted);
}
.loading-lab .steps code {
  display: block;
  background: var(--lab-bg);
  border-radius: 8px;
  padding: 14px;
  font-size: 12px;
  overflow-wrap: anywhere;
  line-height: 1.7;
}
.loading-lab footer {
  margin-top: 25px;
  font-size: 12px;
  color: var(--lab-muted);
  line-height: 1.7;
}
.loading-lab footer span {
  white-space: nowrap;
}
.loading-lab .message .main {
  margin: 0 !important;
  max-width: 100%;
}
.loading-lab .message .author {
  display: none !important;
}
.loading-lab .message .content {
  padding: 0 !important;
}
.loading-lab .message .message-content {
  font-size: 16px;
}
.loading-lab .fixture-title {
  font-size: 14px;
  color: var(--lab-muted);
  margin: 0 0 12px;
}
@media (max-width: 800px) {
  .loading-lab {
    padding: 20px;
  }
  .loading-lab .layout {
    grid-template-columns: 230px minmax(0, 1fr);
    gap: 16px;
  }
  .loading-lab aside,
  .loading-lab .hero,
  .loading-lab .integration,
  .loading-lab .steps {
    padding: 18px;
  }
  .loading-lab .heading > p {
    display: none;
  }
  .loading-lab .integration-head {
    align-items: flex-start;
    flex-direction: column;
    margin-bottom: 15px;
  }
  .loading-lab .actions {
    align-items: flex-start;
    flex-direction: column;
  }
  .loading-lab header span {
    display: none;
  }
}
@media (max-width: 570px) {
  .loading-lab {
    padding: 18px 14px;
  }
  .loading-lab .layout {
    grid-template-columns: 1fr;
  }
  .loading-lab .tools {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
  .loading-lab .tools button {
    padding: 10px;
    gap: 8px;
  }
  .loading-lab .tools button > span:nth-child(2) {
    font-size: 12px;
    overflow-wrap: anywhere;
  }
  .loading-lab .tools small {
    font-size: 12px;
  }
  .loading-lab .heading {
    margin: 24px auto;
  }
  .loading-lab h1 {
    font-size: 26px;
  }
  .loading-lab label {
    margin: 15px 0;
  }
  .loading-lab footer {
    flex-direction: column;
    align-items: flex-start;
  }
  .loading-lab .states button {
    font-size: 13px;
    padding: 8px 9px;
  }
}
</style>
