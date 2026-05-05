<template>
  <div class="field">
    <div class="flex items-center justify-between mb-1">
      <div class="flex items-center">
        <span class="text-sm font-bold">{{ $t('suno.name.lyrics') }}</span>
        <info-icon :content="$t('suno.description.lyrics')" />
      </div>
      <div class="flex items-center gap-1">
        <el-tooltip v-if="lyricHistory.length > 0" :content="$t('suno.button.undo')" placement="top">
          <el-button size="small" circle @click="onUndo">
            <font-awesome-icon icon="fa-solid fa-rotate-left" />
          </el-button>
        </el-tooltip>
        <el-tooltip v-if="lyric" :content="$t('suno.button.clear_lyrics')" placement="top">
          <el-button size="small" circle @click="onClear">
            <font-awesome-icon icon="fa-solid fa-eraser" />
          </el-button>
        </el-tooltip>
        <el-tooltip :content="$t('suno.button.expand_lyrics')" placement="top">
          <el-button size="small" circle @click="expanded = true">
            <font-awesome-icon icon="fa-solid fa-expand" />
          </el-button>
        </el-tooltip>
        <el-button
          v-if="config?.action !== 'extend'"
          size="small"
          :loading="generatingLyrics"
          round
          @click="onGenerateLyrics"
        >
          <font-awesome-icon v-if="!generatingLyrics" icon="fa-solid fa-wand-magic-sparkles" class="mr-1" />
          {{ $t('suno.button.generate_lyrics') }}
        </el-button>
      </div>
    </div>
    <div class="relative">
      <el-input
        v-if="config?.action !== 'extend'"
        v-model="lyric"
        :rows="5"
        type="textarea"
        class="lyrics"
        :placeholder="$t('suno.placeholder.lyrics')"
      />
      <el-input
        v-else
        v-model="lyric"
        :rows="5"
        type="textarea"
        class="lyrics"
        :placeholder="$t('suno.placeholder.extend.lyrics')"
      />
      <div class="text-xs text-right text-[var(--el-text-color-secondary)] mt-1">{{ lyric?.length || 0 }}/5000</div>
    </div>
    <!-- Enhance lyrics -->
    <div v-if="lyric && config?.action !== 'extend'" class="enhance-bar">
      <el-input
        v-model="enhancePrompt"
        size="small"
        :placeholder="$t('suno.placeholder.enhanceLyrics')"
        class="enhance-input"
        @keyup.enter="onEnhanceLyrics"
      >
        <template #append>
          <el-button :loading="enhancingLyrics" @click="onEnhanceLyrics">
            <font-awesome-icon v-if="!enhancingLyrics" icon="fa-solid fa-wand-magic-sparkles" class="mr-1" />
            {{ $t('suno.button.enhance_lyrics') }}
          </el-button>
        </template>
      </el-input>
    </div>
    <!-- Fullscreen lyrics editor -->
    <el-dialog
      v-model="expanded"
      :title="$t('suno.name.lyrics')"
      width="720px"
      top="5vh"
      :close-on-click-modal="false"
      class="lyrics-expand-dialog"
    >
      <el-input
        v-model="lyric"
        type="textarea"
        :rows="20"
        class="lyrics-expanded"
        :placeholder="$t('suno.placeholder.lyrics')"
        autofocus
      />
      <div v-if="config?.action !== 'extend'" class="enhance-bar mt-3">
        <el-input
          v-model="enhancePrompt"
          size="small"
          :placeholder="$t('suno.placeholder.enhanceLyrics')"
          class="enhance-input"
          @keyup.enter="onEnhanceLyrics"
        >
          <template #append>
            <el-button :loading="enhancingLyrics" @click="onEnhanceLyrics">
              <font-awesome-icon v-if="!enhancingLyrics" icon="fa-solid fa-wand-magic-sparkles" class="mr-1" />
              {{ $t('suno.button.enhance_lyrics') }}
            </el-button>
          </template>
        </el-input>
      </div>
      <template #footer>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-1">
            <el-button v-if="lyricHistory.length > 0" size="small" @click="onUndo">
              <font-awesome-icon icon="fa-solid fa-rotate-left" class="mr-1" />
              {{ $t('suno.button.undo') }}
            </el-button>
            <el-button v-if="lyric" size="small" @click="onClear">
              <font-awesome-icon icon="fa-solid fa-eraser" class="mr-1" />
              {{ $t('suno.button.clear_lyrics') }}
            </el-button>
            <el-button
              v-if="config?.action !== 'extend'"
              size="small"
              :loading="generatingLyrics"
              @click="onGenerateLyrics"
            >
              <font-awesome-icon v-if="!generatingLyrics" icon="fa-solid fa-wand-magic-sparkles" class="mr-1" />
              {{ $t('suno.button.generate_lyrics') }}
            </el-button>
          </div>
          <el-button type="primary" @click="expanded = false">
            {{ $t('common.button.confirm') }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElInput, ElButton, ElMessage, ElTooltip, ElDialog } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import InfoIcon from '@/components/common/InfoIcon.vue';
import { sunoOperator } from '@/operators';

export const DEFAULT_LYRIC = '';

export default defineComponent({
  name: 'LyricInput',
  components: {
    ElInput,
    ElButton,
    ElTooltip,
    ElDialog,
    FontAwesomeIcon,
    InfoIcon
  },
  data() {
    return {
      generatingLyrics: false,
      enhancingLyrics: false,
      enhancePrompt: '',
      lyricHistory: [] as string[],
      expanded: false
    };
  },
  computed: {
    lyric: {
      get() {
        return this.$store.state.suno?.config?.lyric;
      },
      set(val: string) {
        this.$store.commit('suno/setConfig', {
          ...this.$store.state.suno?.config,
          lyric: val
        });
      }
    },
    config() {
      return this.$store.state.suno?.config;
    },
    credential() {
      return this.$store.state.suno?.credential;
    }
  },
  mounted() {
    if (!this.lyric) {
      this.lyric = DEFAULT_LYRIC;
    }
  },
  methods: {
    pushHistory() {
      if (this.lyric) {
        this.lyricHistory.push(this.lyric);
        if (this.lyricHistory.length > 20) this.lyricHistory.shift();
      }
    },
    onUndo() {
      const prev = this.lyricHistory.pop();
      if (prev !== undefined) {
        this.lyric = prev;
      }
    },
    onClear() {
      this.pushHistory();
      this.lyric = '';
    },
    async onEnhanceLyrics() {
      const token = this.credential?.token;
      if (!token || !this.lyric || !this.enhancePrompt) return;

      this.pushHistory();
      this.enhancingLyrics = true;
      ElMessage.info(this.$t('suno.message.enhancingLyrics'));
      try {
        const prompt = `${this.enhancePrompt}\n\nOriginal lyrics:\n${this.lyric}`;
        const response = await sunoOperator.lyric({ prompt }, { token });
        const data = response.data?.data;
        if (data?.text) {
          this.lyric = data.text;
          this.enhancePrompt = '';
          ElMessage.success(this.$t('suno.message.enhanceLyricsSuccess'));
        }
      } catch {
        ElMessage.error(this.$t('suno.message.enhanceLyricsFailed'));
      } finally {
        this.enhancingLyrics = false;
      }
    },
    async onGenerateLyrics() {
      const token = this.credential?.token;
      if (!token) return;

      this.pushHistory();
      const prompt = this.config?.style || this.config?.title || 'a beautiful song';
      this.generatingLyrics = true;
      ElMessage.info(this.$t('suno.message.generatingLyrics'));

      try {
        const response = await sunoOperator.lyric({ prompt }, { token });
        const data = response.data?.data;
        if (data?.text) {
          this.lyric = data.text;
          if (data?.title && !this.config?.title) {
            this.$store.commit('suno/setConfig', {
              ...this.$store.state.suno?.config,
              lyric: data.text,
              title: data.title
            });
          }
          ElMessage.success(this.$t('suno.message.generateLyricsSuccess'));
        }
      } catch {
        ElMessage.error(this.$t('suno.message.generateLyricsFailed'));
      } finally {
        this.generatingLyrics = false;
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.field {
  :deep(.el-textarea__inner) {
    font-family: monospace;
    font-size: 13px;
    line-height: 1.6;
  }
}

.enhance-bar {
  margin-top: 6px;

  .enhance-input {
    :deep(.el-input-group__append) {
      padding: 0 12px;
    }
  }
}

.lyrics-expanded {
  :deep(.el-textarea__inner) {
    font-family: monospace;
    line-height: 1.8;
    font-size: 14px;
  }
}
</style>
