<template>
  <div class="field">
    <div class="flex items-center justify-between mb-1">
      <div class="flex items-center">
        <span class="text-sm font-bold">{{ $t('suno.name.style') }}</span>
        <info-icon :content="$t('suno.description.style')" />
      </div>
      <el-button size="small" :loading="optimizing" round @click="onOptimizeStyle">
        <font-awesome-icon v-if="!optimizing" icon="fa-solid fa-wand-magic-sparkles" class="mr-1" />
        {{ $t('suno.button.optimize_style') }}
      </el-button>
    </div>
    <el-input v-model="style" :rows="2" type="textarea" :placeholder="$t('suno.placeholder.style')" />
    <!-- Style Tag Cloud -->
    <div class="style-tags">
      <button v-for="tag in visibleTags" :key="tag" class="style-tag" @click="onTagClick(tag)">
        {{ tag }}
      </button>
      <button class="style-tag style-tag-refresh" @click="onRefreshTags">
        <font-awesome-icon icon="fa-solid fa-arrows-rotate" />
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElInput, ElButton, ElMessage } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import InfoIcon from '@/components/common/InfoIcon.vue';
import { sunoOperator } from '@/operators';

const ALL_STYLE_TAGS = [
  'Pop',
  'Rock',
  'Jazz',
  'R&B',
  'Hip Hop',
  'Lo-fi',
  'Electronic',
  'Classical',
  'Country',
  'Blues',
  'Folk',
  'Reggae',
  'Metal',
  'Punk',
  'Soul',
  'Funk',
  'Ambient',
  'Indie',
  'Latin',
  'Acoustic',
  'Dance',
  'Disco',
  'Gospel',
  'K-Pop',
  'J-Pop',
  'C-Pop',
  'Bossa Nova',
  'Trap',
  'Drill',
  'House',
  'Techno',
  'Dubstep',
  'Synthwave',
  'Chill',
  'Dreamy',
  'Upbeat',
  'Melancholic',
  'Romantic',
  'Epic',
  'Cinematic',
  'Orchestral',
  'Piano',
  'Guitar',
  'Saxophone',
  'Violin',
  'Tribal',
  'World Music',
  'Afrobeat',
  'Ska',
  'Grunge'
];

const TAGS_PER_PAGE = 12;

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default defineComponent({
  name: 'StyleInput',
  components: {
    ElInput,
    ElButton,
    FontAwesomeIcon,
    InfoIcon
  },
  data() {
    return {
      optimizing: false,
      shuffledTags: shuffleArray(ALL_STYLE_TAGS)
    };
  },
  computed: {
    style: {
      get() {
        return this.$store.state.suno?.config?.style;
      },
      set(val: string) {
        this.$store.commit('suno/setConfig', {
          ...this.$store.state.suno?.config,
          style: val
        });
      }
    },
    credential() {
      return this.$store.state.suno?.credential;
    },
    visibleTags(): string[] {
      return this.shuffledTags.slice(0, TAGS_PER_PAGE);
    }
  },
  methods: {
    onTagClick(tag: string) {
      const current = this.style || '';
      if (current.toLowerCase().includes(tag.toLowerCase())) return;
      this.style = current ? `${current}, ${tag}` : tag;
    },
    onRefreshTags() {
      this.shuffledTags = shuffleArray(ALL_STYLE_TAGS);
    },
    async onOptimizeStyle() {
      const token = this.credential?.token;
      if (!token || !this.style) return;

      this.optimizing = true;
      ElMessage.info(this.$t('suno.message.optimizingStyle'));
      try {
        const response = await sunoOperator.style({ prompt: this.style }, { token });
        const text = response.data?.text || (response.data as any)?.data?.text;
        if (text) {
          this.style = text;
          ElMessage.success(this.$t('suno.message.optimizeStyleSuccess'));
        }
      } catch {
        ElMessage.error(this.$t('suno.message.optimizeStyleFailed'));
      } finally {
        this.optimizing = false;
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.style-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.style-tag {
  padding: 3px 10px;
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

.style-tag-refresh {
  border-style: dashed;
  color: var(--el-text-color-placeholder);
  padding: 3px 8px;

  &:hover {
    border-color: var(--el-color-primary);
    color: var(--el-color-primary);
  }
}
</style>
