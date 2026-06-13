<template>
  <div class="cb-thinking flex items-center gap-2 text-sm text-[var(--app-text-subtle)] py-1">
    <span class="cb-thinking__spinner text-[var(--el-color-primary)]">{{ spinnerFrame }}</span>
    <span class="cb-thinking__word">{{ display }}<span class="cb-thinking__caret">▋</span></span>
    <span class="cb-thinking__elapsed tabular-nums opacity-60">({{ elapsed }}s)</span>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

// Braille spinner frames, same family Claude Code uses in the terminal.
const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

// Playful gerunds cycled while the agent works. Kept in-component (not i18n)
// because there is no fallbackLocale configured, so a missing key in the 16
// non-en/zh locales would render the raw key path. zh covers zh-CN/zh-TW.
const WORDS_EN = [
  'Pondering',
  'Noodling',
  'Conjuring',
  'Brewing',
  'Cooking',
  'Crafting',
  'Churning',
  'Simmering',
  'Percolating',
  'Ruminating',
  'Musing',
  'Marinating',
  'Synthesizing',
  'Computing',
  'Hatching',
  'Forging',
  'Vibing',
  'Working',
  'Thinking',
  'Cogitating',
  'Mulling',
  'Stewing',
  'Tinkering',
  'Wrangling',
  'Spinning',
  'Reticulating',
  'Manifesting',
  'Deliberating'
];

const WORDS_ZH = [
  '思考中',
  '酝酿中',
  '沉思中',
  '推敲中',
  '构思中',
  '计算中',
  '琢磨中',
  '捣鼓中',
  '炼制中',
  '召唤中',
  '编织中',
  '烹饪中',
  '咀嚼中',
  '盘算中',
  '发酵中',
  '运转中',
  '冥想中',
  '鼓捣中',
  '熬制中',
  '神游中',
  '演算中',
  '雕琢中',
  '头脑风暴中',
  '反复斟酌中'
];

const SPINNER_MS = 80;
const TYPE_MS = 60;
const HOLD_MS = 1500;
const DELETE_MS = 28;

export default defineComponent({
  name: 'CodingBridgeThinkingIndicator',
  data() {
    return {
      spinnerIndex: 0,
      display: '',
      elapsed: 0,
      charIndex: 0,
      phase: 'typing' as 'typing' | 'holding' | 'deleting',
      currentWord: '',
      spinnerTimer: 0,
      elapsedTimer: 0,
      typeTimer: 0
    };
  },
  computed: {
    spinnerFrame(): string {
      return SPINNER_FRAMES[this.spinnerIndex];
    },
    words(): string[] {
      return this.$i18n.locale.startsWith('zh') ? WORDS_ZH : WORDS_EN;
    }
  },
  mounted() {
    this.currentWord = this.pickWord();
    this.spinnerTimer = window.setInterval(() => {
      this.spinnerIndex = (this.spinnerIndex + 1) % SPINNER_FRAMES.length;
    }, SPINNER_MS);
    this.elapsedTimer = window.setInterval(() => {
      this.elapsed += 1;
    }, 1000);
    this.scheduleType(TYPE_MS);
  },
  beforeUnmount() {
    window.clearInterval(this.spinnerTimer);
    window.clearInterval(this.elapsedTimer);
    window.clearTimeout(this.typeTimer);
  },
  methods: {
    // Pick a random word different from the one currently shown.
    pickWord(): string {
      const list = this.words;
      if (list.length <= 1) {
        return list[0] ?? '';
      }
      let next = this.currentWord;
      while (next === this.currentWord) {
        next = list[Math.floor(Math.random() * list.length)];
      }
      return next;
    },
    scheduleType(ms: number) {
      this.typeTimer = window.setTimeout(this.advance, ms);
    },
    // Typewriter loop: type the word, hold it, erase it, then move to the next.
    advance() {
      const word = this.currentWord;
      if (this.phase === 'typing') {
        this.charIndex += 1;
        this.display = word.slice(0, this.charIndex);
        if (this.charIndex >= word.length) {
          this.phase = 'holding';
          this.scheduleType(HOLD_MS);
        } else {
          this.scheduleType(TYPE_MS);
        }
      } else if (this.phase === 'holding') {
        this.phase = 'deleting';
        this.scheduleType(DELETE_MS);
      } else {
        this.charIndex -= 1;
        this.display = word.slice(0, Math.max(0, this.charIndex));
        if (this.charIndex <= 0) {
          this.currentWord = this.pickWord();
          this.phase = 'typing';
          this.scheduleType(TYPE_MS);
        } else {
          this.scheduleType(DELETE_MS);
        }
      }
    }
  }
});
</script>

<style scoped lang="scss">
.cb-thinking {
  &__spinner {
    display: inline-block;
    width: 1em;
    font-family: var(--el-font-family-mono, monospace);
  }

  &__caret {
    margin-left: 1px;
    animation: cb-thinking-blink 1s steps(1, end) infinite;
  }
}

@keyframes cb-thinking-blink {
  0%,
  50% {
    opacity: 1;
  }
  50.01%,
  100% {
    opacity: 0;
  }
}
</style>
