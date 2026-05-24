<template>
  <el-collapse v-model="activeNames" class="advanced-collapse">
    <el-collapse-item :title="$t('producer.name.advancedParams')" name="advanced">
      <!-- Style Negative (custom mode only) -->
      <div v-if="config?.custom" class="mb-3">
        <div class="flex items-center mb-1">
          <span class="text-xs font-bold">{{ $t('producer.name.styleNegative') }}</span>
          <info-icon :content="$t('producer.description.styleNegative')" />
        </div>
        <el-input v-model="styleNegative" size="small" :placeholder="$t('producer.placeholder.styleNegative')" />
      </div>

      <!-- Lyric Prompt (auto-generate lyrics seed; only meaningful in custom + vocal) -->
      <div v-if="config?.custom && !config?.instrumental" class="mb-3">
        <div class="flex items-center mb-1">
          <span class="text-xs font-bold">{{ $t('producer.name.lyricPrompt') }}</span>
          <info-icon :content="$t('producer.description.lyricPrompt')" />
        </div>
        <el-input v-model="lyricPrompt" size="small" :placeholder="$t('producer.placeholder.lyricPrompt')" />
      </div>

      <!-- Weirdness (always available) -->
      <div class="mb-3">
        <div class="flex items-center justify-between mb-1">
          <div class="flex items-center">
            <span class="text-xs font-bold">{{ $t('producer.name.weirdness') }}</span>
            <info-icon :content="$t('producer.description.weirdness')" />
          </div>
          <span class="text-xs text-[var(--el-text-color-secondary)]">{{ weirdness ?? 0.5 }}</span>
        </div>
        <el-slider v-model="weirdness" :min="0" :max="1" :step="0.01" />
      </div>

      <!-- Sound Strength (always available — drives audio prompt intensity) -->
      <div class="mb-3">
        <div class="flex items-center justify-between mb-1">
          <div class="flex items-center">
            <span class="text-xs font-bold">{{ $t('producer.name.soundStrength') }}</span>
            <info-icon :content="$t('producer.description.soundStrength')" />
          </div>
          <span class="text-xs text-[var(--el-text-color-secondary)]">{{ soundStrength ?? 0.7 }}</span>
        </div>
        <el-slider v-model="soundStrength" :min="0.2" :max="1" :step="0.01" />
      </div>

      <!-- Lyrics Strength (custom + vocal only) -->
      <div v-if="config?.custom && !config?.instrumental" class="mb-3">
        <div class="flex items-center justify-between mb-1">
          <div class="flex items-center">
            <span class="text-xs font-bold">{{ $t('producer.name.lyricsStrength') }}</span>
            <info-icon :content="$t('producer.description.lyricsStrength')" />
          </div>
          <span class="text-xs text-[var(--el-text-color-secondary)]">{{ lyricsStrength ?? 0.7 }}</span>
        </div>
        <el-slider v-model="lyricsStrength" :min="0" :max="1" :step="0.01" />
      </div>

      <!-- Seed (always available) -->
      <div class="mb-3">
        <div class="flex items-center mb-1">
          <span class="text-xs font-bold">{{ $t('producer.name.seed') }}</span>
          <info-icon :content="$t('producer.description.seed')" />
        </div>
        <el-input-number
          v-model="seed"
          :min="0"
          :controls="false"
          size="small"
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
import InfoIcon from '@/components/common/InfoIcon.vue';

export default defineComponent({
  name: 'AdvancedParams',
  components: {
    ElCollapse,
    ElCollapseItem,
    ElInput,
    ElSlider,
    ElInputNumber,
    InfoIcon
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
        return this.$store.state.producer?.config?.weirdness ?? 0.5;
      },
      set(val: number) {
        this.$store.commit('producer/setConfig', {
          ...this.$store.state.producer?.config,
          weirdness: val
        });
      }
    },
    soundStrength: {
      get() {
        return this.$store.state.producer?.config?.sound_strength ?? 0.7;
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
        return this.$store.state.producer?.config?.lyrics_strength ?? 0.7;
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
  },
  mounted() {
    // Migrate legacy persisted values from the old 0-100 slider scale to the
    // 0-1 scale required by the upstream Producer API. Anything > 1 was
    // stored when the sliders ran on 0-100; divide by 100 to preserve
    // semantics.
    const cfg = this.$store.state.producer?.config;
    if (!cfg) return;
    const updates: Record<string, number> = {};
    if (typeof cfg.weirdness === 'number' && cfg.weirdness > 1) {
      updates.weirdness = cfg.weirdness / 100;
    }
    if (typeof cfg.sound_strength === 'number' && cfg.sound_strength > 1) {
      updates.sound_strength = cfg.sound_strength / 100;
    }
    if (typeof cfg.lyrics_strength === 'number' && cfg.lyrics_strength > 1) {
      updates.lyrics_strength = cfg.lyrics_strength / 100;
    }
    if (Object.keys(updates).length > 0) {
      this.$store.commit('producer/setConfig', { ...cfg, ...updates });
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
