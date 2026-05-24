<template>
  <el-collapse v-model="activeNames" class="advanced-collapse">
    <el-collapse-item :title="$t('suno.name.advancedParams')" name="advanced">
      <!-- Style Negative -->
      <div v-if="config?.custom" class="mb-3">
        <div class="flex items-center mb-1">
          <span class="text-xs font-bold">{{ $t('suno.name.styleNegative') }}</span>
        </div>
        <el-input v-model="styleNegative" size="small" :placeholder="$t('suno.placeholder.styleNegative')" />
      </div>

      <!-- Lyric Prompt (auto-generate lyrics) -->
      <div v-if="config?.custom && !config?.instrumental" class="mb-3">
        <div class="flex items-center mb-1">
          <span class="text-xs font-bold">{{ $t('suno.name.lyricPrompt') }}</span>
        </div>
        <el-input v-model="lyricPrompt" size="small" :placeholder="$t('suno.placeholder.lyricPrompt')" />
      </div>

      <!-- Weirdness -->
      <div v-if="config?.custom" class="mb-3">
        <div class="flex items-center justify-between mb-1">
          <span class="text-xs font-bold">{{ $t('suno.name.weirdness') }}</span>
          <span class="text-xs text-[var(--el-text-color-secondary)]">{{ weirdness ?? 0 }}</span>
        </div>
        <el-slider v-model="weirdness" :min="0" :max="1" :step="0.01" />
      </div>

      <!-- Style Influence -->
      <div v-if="config?.custom" class="mb-3">
        <div class="flex items-center justify-between mb-1">
          <span class="text-xs font-bold">{{ $t('suno.name.styleInfluence') }}</span>
          <span class="text-xs text-[var(--el-text-color-secondary)]">{{ styleInfluence ?? 0.5 }}</span>
        </div>
        <el-slider v-model="styleInfluence" :min="0" :max="1" :step="0.01" />
      </div>

      <!-- Variation Category (v5+ only) -->
      <div v-if="isV5OrAbove" class="mb-3">
        <div class="flex items-center mb-1">
          <span class="text-xs font-bold">{{ $t('suno.name.variationCategory') }}</span>
        </div>
        <el-radio-group v-model="variationCategory" size="small">
          <el-radio-button value="">{{ $t('suno.gender.auto') }}</el-radio-button>
          <el-radio-button value="high">{{ $t('suno.variation.high') }}</el-radio-button>
          <el-radio-button value="low">{{ $t('suno.variation.low') }}</el-radio-button>
        </el-radio-group>
      </div>

      <!-- Audio Weight (for cover action) -->
      <div v-if="config?.action === 'cover'" class="mb-3">
        <div class="flex items-center justify-between mb-1">
          <span class="text-xs font-bold">{{ $t('suno.name.audioWeight') }}</span>
          <span class="text-xs text-[var(--el-text-color-secondary)]">{{ audioWeight ?? 0.5 }}</span>
        </div>
        <el-slider v-model="audioWeight" :min="0" :max="1" :step="0.01" />
      </div>
      <!-- Lyrics Mode (Manual/Auto) -->
      <div v-if="config?.custom && !config?.instrumental" class="mb-3">
        <div class="flex items-center mb-1">
          <span class="text-xs font-bold">{{ $t('suno.name.lyricsMode') }}</span>
        </div>
        <el-radio-group v-model="lyricsMode" size="small">
          <el-radio-button value="manual">{{ $t('suno.lyricsMode.manual') }}</el-radio-button>
          <el-radio-button value="auto">{{ $t('suno.lyricsMode.auto') }}</el-radio-button>
        </el-radio-group>
      </div>
    </el-collapse-item>
  </el-collapse>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElCollapse, ElCollapseItem, ElInput, ElSlider, ElRadioGroup, ElRadioButton } from 'element-plus';

export default defineComponent({
  name: 'AdvancedParams',
  components: {
    ElCollapse,
    ElCollapseItem,
    ElInput,
    ElSlider,
    ElRadioGroup,
    ElRadioButton
  },
  data() {
    return {
      activeNames: [] as string[]
    };
  },
  computed: {
    config() {
      return this.$store.state.suno?.config;
    },
    isV5OrAbove() {
      const model = this.config?.model || '';
      return ['chirp-v5', 'chirp-v5-5'].includes(model);
    },
    styleNegative: {
      get() {
        return this.$store.state.suno?.config?.style_negative || '';
      },
      set(val: string) {
        this.$store.commit('suno/setConfig', {
          ...this.$store.state.suno?.config,
          style_negative: val || undefined
        });
      }
    },
    lyricPrompt: {
      get() {
        return this.$store.state.suno?.config?.lyric_prompt || '';
      },
      set(val: string) {
        this.$store.commit('suno/setConfig', {
          ...this.$store.state.suno?.config,
          lyric_prompt: val || undefined
        });
      }
    },
    weirdness: {
      get() {
        return this.$store.state.suno?.config?.weirdness ?? 0;
      },
      set(val: number) {
        this.$store.commit('suno/setConfig', {
          ...this.$store.state.suno?.config,
          weirdness: val || undefined
        });
      }
    },
    styleInfluence: {
      get() {
        return this.$store.state.suno?.config?.style_influence ?? 0.5;
      },
      set(val: number) {
        this.$store.commit('suno/setConfig', {
          ...this.$store.state.suno?.config,
          style_influence: val
        });
      }
    },
    variationCategory: {
      get() {
        return this.$store.state.suno?.config?.variation_category || '';
      },
      set(val: string) {
        this.$store.commit('suno/setConfig', {
          ...this.$store.state.suno?.config,
          variation_category: val || undefined
        });
      }
    },
    audioWeight: {
      get() {
        return this.$store.state.suno?.config?.audio_weight ?? 0.5;
      },
      set(val: number) {
        this.$store.commit('suno/setConfig', {
          ...this.$store.state.suno?.config,
          audio_weight: val
        });
      }
    },
    lyricsMode: {
      get() {
        return this.$store.state.suno?.config?.lyrics_mode || 'manual';
      },
      set(val: string) {
        this.$store.commit('suno/setConfig', {
          ...this.$store.state.suno?.config,
          lyrics_mode: val
        });
      }
    }
  },
  mounted() {
    // Migrate legacy persisted values from the old 0-100 slider scale to the
    // 0-1 scale required by the upstream Suno API. Anything > 1 was stored
    // when the sliders ran on 0-100; divide by 100 to preserve semantics.
    const cfg = this.$store.state.suno?.config;
    if (!cfg) return;
    const updates: Record<string, number> = {};
    if (typeof cfg.weirdness === 'number' && cfg.weirdness > 1) {
      updates.weirdness = cfg.weirdness / 100;
    }
    if (typeof cfg.style_influence === 'number' && cfg.style_influence > 1) {
      updates.style_influence = cfg.style_influence / 100;
    }
    if (typeof cfg.audio_weight === 'number' && cfg.audio_weight > 1) {
      updates.audio_weight = cfg.audio_weight / 100;
    }
    if (Object.keys(updates).length > 0) {
      this.$store.commit('suno/setConfig', { ...cfg, ...updates });
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
