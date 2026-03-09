<template>
  <div class="field">
    <div class="flex items-center justify-between mb-1">
      <div class="flex items-center">
        <span class="text-sm font-bold">{{ $t('suno.name.lyrics') }}</span>
        <info-icon :content="$t('suno.description.lyrics')" />
      </div>
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
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElInput, ElButton, ElMessage } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import InfoIcon from '@/components/common/InfoIcon.vue';
import { sunoOperator } from '@/operators';

export const DEFAULT_LYRIC = '';

export default defineComponent({
  name: 'LyricInput',
  components: {
    ElInput,
    ElButton,
    FontAwesomeIcon,
    InfoIcon
  },
  data() {
    return {
      generatingLyrics: false
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
    async onGenerateLyrics() {
      const token = this.credential?.token;
      if (!token) return;

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
    line-height: 1.6;
  }
}
</style>
