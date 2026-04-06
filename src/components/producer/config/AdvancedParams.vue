<template>
  <el-collapse v-model="activeNames" class="advanced-collapse">
    <el-collapse-item :title="$t('producer.name.advancedParams')" name="advanced">
      <!-- Style Negative -->
      <div v-if="config?.custom" class="mb-3">
        <div class="flex items-center mb-1">
          <span class="text-xs font-bold">{{ $t('producer.name.styleNegative') }}</span>
        </div>
        <el-input v-model="styleNegative" :placeholder="$t('producer.placeholder.styleNegative')" />
      </div>

      <!-- Lyric Prompt (auto-generate lyrics) -->
      <div v-if="config?.custom && !config?.instrumental" class="mb-3">
        <div class="flex items-center mb-1">
          <span class="text-xs font-bold">{{ $t('producer.name.lyricPrompt') }}</span>
        </div>
        <el-input v-model="lyricPrompt" :placeholder="$t('producer.placeholder.lyricPrompt')" />
      </div>

      <!-- Weirdness -->
      <div v-if="config?.custom" class="mb-3">
        <div class="flex items-center justify-between mb-1">
          <span class="text-xs font-bold">{{ $t('producer.name.weirdness') }}</span>
          <span class="text-xs text-[var(--el-text-color-secondary)]">{{ weirdness ?? 0 }}</span>
        </div>
        <el-slider v-model="weirdness" :min="0" :max="100" :step="1" />
      </div>

      <!-- Sound Strength -->
      <div v-if="config?.custom" class="mb-3">
        <div class="flex items-center justify-between mb-1">
          <span class="text-xs font-bold">{{ $t('producer.name.soundStrength') }}</span>
          <span class="text-xs text-[var(--el-text-color-secondary)]">{{ soundStrength ?? 50 }}</span>
        </div>
        <el-slider v-model="soundStrength" :min="0" :max="100" :step="1" />
      </div>

      <!-- Lyrics Strength -->
      <div v-if="config?.custom && !config?.instrumental" class="mb-3">
        <div class="flex items-center justify-between mb-1">
          <span class="text-xs font-bold">{{ $t('producer.name.lyricsStrength') }}</span>
          <span class="text-xs text-[var(--el-text-color-secondary)]">{{ lyricsStrength ?? 50 }}</span>
        </div>
        <el-slider v-model="lyricsStrength" :min="0" :max="100" :step="1" />
      </div>

      <!-- Seed -->
      <div v-if="config?.custom" class="mb-3">
        <div class="flex items-center mb-1">
          <span class="text-xs font-bold">{{ $t('producer.name.seed') }}</span>
        </div>
        <el-input-number
          v-model="seed"
          :min="0"
          :controls="false"
          :placeholder="$t('producer.placeholder.seed')"
          class="w-full"
        />
      </div>
    </el-collapse-item>
  </el-collapse>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElCollapse, ElCollapseItem, ElInput, ElSlider, ElInputNumber } from 'element-plus';

export default defineComponent({
  name: 'AdvancedParams',
  components: {
    ElCollapse,
    ElCollapseItem,
    ElInput,
    ElSlider,
    ElInputNumber
  },
  data() {
    return {
      activeNames: [] as string[]
    };
  },
  computed: {
    config() {
      return this.$store.state.producer?.config;
    },
    styleNegative: {
      get() {
        return this.$store.state.producer?.config?.style_negative || '';
      },
      set(val: string) {
        this.$store.commit('producer/setConfig', {
          ...this.$store.state.producer?.config,
          style_negative: val || undefined
        });
      }
    },
    lyricPrompt: {
      get() {
        return this.$store.state.producer?.config?.lyric_prompt || '';
      },
      set(val: string) {
        this.$store.commit('producer/setConfig', {
          ...this.$store.state.producer?.config,
          lyric_prompt: val || undefined
        });
      }
    },
    weirdness: {
      get() {
        return this.$store.state.producer?.config?.weirdness ?? 0;
      },
      set(val: number) {
        this.$store.commit('producer/setConfig', {
          ...this.$store.state.producer?.config,
          weirdness: val || undefined
        });
      }
    },
    soundStrength: {
      get() {
        return this.$store.state.producer?.config?.sound_strength ?? 50;
      },
      set(val: number) {
        this.$store.commit('producer/setConfig', {
          ...this.$store.state.producer?.config,
          sound_strength: val
        });
      }
    },
    lyricsStrength: {
      get() {
        return this.$store.state.producer?.config?.lyrics_strength ?? 50;
      },
      set(val: number) {
        this.$store.commit('producer/setConfig', {
          ...this.$store.state.producer?.config,
          lyrics_strength: val
        });
      }
    },
    seed: {
      get() {
        return this.$store.state.producer?.config?.seed;
      },
      set(val: number | undefined) {
        this.$store.commit('producer/setConfig', {
          ...this.$store.state.producer?.config,
          seed: val
        });
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.advanced-collapse {
  border: none;
  :deep(.el-collapse-item__header) {
    font-size: 14px;
    font-weight: bold;
    background: transparent;
    border: none;
    height: 32px;
    line-height: 32px;
  }
  :deep(.el-collapse-item__wrap) {
    background: transparent;
    border: none;
  }
  :deep(.el-collapse-item__content) {
    padding-bottom: 0;
  }
}
</style>
