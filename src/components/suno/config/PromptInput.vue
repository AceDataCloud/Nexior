<template>
  <prompt-textarea
    v-model="prompt"
    :title="$t('suno.name.songDescription')"
    :info="$t('suno.description.prompt')"
    :placeholder="$t('suno.placeholder.prompt')"
    :min-rows="5"
    :max-rows="14"
  >
    <template #after>
      <!-- Inspiration Tags -->
      <div class="inspo-tags">
        <button v-for="tag in visibleTags" :key="tag.key" class="inspo-tag" @click="onTagClick(tag)">
          {{ tag.label }}
        </button>
        <button class="inspo-tag inspo-tag-refresh" @click="onRefreshTags">
          <font-awesome-icon icon="fa-solid fa-arrows-rotate" />
        </button>
      </div>
    </template>
  </prompt-textarea>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import PromptTextarea from '@/components/common/PromptTextarea.vue';

export const DEFAULT_PROMPT = '';

interface InspoTag {
  key: string;
  label: string;
  prompt: string;
}

const ALL_INSPO_TAGS: InspoTag[] = [
  { key: 'lofi', label: '🎧 Lo-fi Chill', prompt: 'a relaxing lo-fi hip hop beat for studying' },
  { key: 'pop-love', label: '💕 Pop Love Song', prompt: 'a catchy pop love song with sweet melodies' },
  { key: 'rock-anthem', label: '🎸 Rock Anthem', prompt: 'an energetic rock anthem with electric guitars' },
  { key: 'jazz-night', label: '🎷 Jazz Night', prompt: 'a smooth late-night jazz piece with saxophone' },
  { key: 'edm-drop', label: '⚡ EDM Drop', prompt: 'an intense EDM track with a massive drop' },
  { key: 'folk-story', label: '🪕 Folk Story', prompt: 'a warm folk song telling a story about traveling' },
  { key: 'rnb-groove', label: '🎤 R&B Groove', prompt: 'a smooth R&B groove with soulful vocals' },
  { key: 'classical', label: '🎻 Classical', prompt: 'an elegant classical piece for orchestra' },
  { key: 'hip-hop', label: '🎤 Hip Hop', prompt: 'a hard-hitting hip hop beat with bass' },
  { key: 'country', label: '🤠 Country', prompt: 'an upbeat country song with acoustic guitar and banjo' },
  { key: 'reggae', label: '🌴 Reggae', prompt: 'a laid-back reggae tune with island vibes' },
  { key: 'latin', label: '💃 Latin', prompt: 'a vibrant Latin dance track with percussion' },
  { key: 'ambient', label: '🌊 Ambient', prompt: 'a dreamy ambient soundscape for relaxation' },
  { key: 'metal', label: '🤘 Metal', prompt: 'a powerful metal song with heavy riffs and double bass drums' },
  { key: 'soul', label: '🎵 Soul', prompt: 'a heartfelt soul ballad with gospel harmonies' },
  { key: 'synthwave', label: '🌃 Synthwave', prompt: 'a retro synthwave track with 80s vibes' },
  { key: 'kpop', label: '🇰🇷 K-Pop', prompt: 'a catchy K-pop dance track with hook' },
  { key: 'lullaby', label: '🌙 Lullaby', prompt: 'a gentle lullaby for bedtime with soft piano' },
  { key: 'cinematic', label: '🎬 Cinematic', prompt: 'an epic cinematic orchestral score for a movie trailer' },
  { key: 'blues', label: '🎸 Blues', prompt: 'a soulful blues song with electric guitar bends' },
  { key: 'disco', label: '🕺 Disco', prompt: 'a funky disco track with groovy bassline' },
  { key: 'punk', label: '🔥 Punk Rock', prompt: 'a fast punk rock song with raw energy' },
  { key: 'gospel', label: '⛪ Gospel', prompt: 'an uplifting gospel choir song with piano' },
  { key: 'trap', label: '🔊 Trap', prompt: 'a dark trap beat with 808s and hi-hats' },
  { key: 'bossa', label: '☕ Bossa Nova', prompt: 'a gentle bossa nova with nylon guitar' },
  { key: 'indie', label: '🎶 Indie', prompt: 'a dreamy indie track with ethereal vocals' },
  { key: 'cpop', label: '🇨🇳 C-Pop', prompt: 'a beautiful Chinese pop ballad with emotional vocals' },
  { key: 'jpop', label: '🇯🇵 J-Pop', prompt: 'a cheerful J-pop song with anime vibes' },
  { key: 'afrobeat', label: '🥁 Afrobeat', prompt: 'a groovy Afrobeat track with layered percussion' },
  { key: 'game', label: '🎮 Game BGM', prompt: 'an adventurous video game background music' }
];

const TAGS_PER_PAGE = 8;

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default defineComponent({
  name: 'PromptInput',
  components: {
    FontAwesomeIcon,
    PromptTextarea
  },
  data() {
    return {
      shuffledTags: shuffleArray(ALL_INSPO_TAGS)
    };
  },
  computed: {
    prompt: {
      get() {
        return this.$store.state.suno?.config?.prompt;
      },
      set(val: string) {
        this.$store.commit('suno/setConfig', {
          ...this.$store.state.suno?.config,
          prompt: val
        });
      }
    },
    visibleTags(): InspoTag[] {
      return this.shuffledTags.slice(0, TAGS_PER_PAGE);
    }
  },
  mounted() {
    if (!this.prompt) {
      this.prompt = DEFAULT_PROMPT;
    }
  },
  methods: {
    onTagClick(tag: InspoTag) {
      this.prompt = tag.prompt;
    },
    onRefreshTags() {
      this.shuffledTags = shuffleArray(ALL_INSPO_TAGS);
    }
  }
});
</script>

<style lang="scss" scoped>
.inspo-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.inspo-tag {
  padding: 4px 10px;
  border: 1px solid var(--el-border-color);
  border-radius: 14px;
  background: var(--el-bg-color);
  color: var(--el-text-color-regular);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;

  &:hover {
    border-color: var(--el-color-primary);
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }
}

.inspo-tag-refresh {
  border-style: dashed;
  color: var(--el-text-color-placeholder);
  padding: 4px 8px;

  &:hover {
    border-color: var(--el-color-primary);
    color: var(--el-color-primary);
  }
}
</style>
