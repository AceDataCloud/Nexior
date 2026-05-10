<template>
  <div class="bg-setting">
    <!--
      Preview: shows the currently selected wallpaper (or "no wallpaper"
      placeholder) at the same checkerboard background convention the
      `ImageCropper`/EditImage upload uses, so transparent PNGs are
      visually obvious.
    -->
    <div class="preview">
      <div v-if="backgroundImage" class="preview-image" :style="{ backgroundImage: `url(${backgroundImage})` }" />
      <div v-else class="preview-empty">
        <font-awesome-icon icon="fa-solid fa-image" class="icon" />
        <span class="text">{{ $t('common.settings.backgroundEmpty') }}</span>
      </div>
    </div>

    <div class="controls">
      <edit-image
        :model-value="backgroundImage || ''"
        :title="$t('common.settings.backgroundUploadTitle')"
        :tip="$t('common.settings.backgroundTip')"
        @confirm="onUpload"
      />
      <el-button v-if="backgroundImage" round size="small" type="danger" plain class="ml-2" @click="onClear">
        {{ $t('common.button.clear') }}
      </el-button>
    </div>

    <!--
      Opacity slider only meaningful when a wallpaper is set. Controls the
      alpha of the content surfaces (sidebars / cards / main canvas) layered
      ON TOP of the wallpaper. Stored as 0..100; consumed as
      `0.85` by App.vue via the `--app-surface-alpha` CSS variable.
    -->
    <div v-if="backgroundImage" class="opacity-row">
      <span class="label">{{ $t('common.settings.backgroundOpacity') }}</span>
      <el-slider
        :model-value="opacity"
        :min="20"
        :max="100"
        :step="1"
        :show-tooltip="true"
        class="slider"
        @input="onOpacityChange"
      />
      <span class="value">{{ opacity }}%</span>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton, ElSlider } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import EditImage from '@/components/site/EditImage.vue';

export default defineComponent({
  name: 'BackgroundSetting',
  components: {
    ElButton,
    ElSlider,
    FontAwesomeIcon,
    EditImage
  },
  computed: {
    backgroundImage(): string {
      return this.$store.getters.setting?.backgroundImage || '';
    },
    opacity(): number {
      const v = this.$store.getters.setting?.backgroundOpacity;
      return typeof v === 'number' ? v : 85;
    }
  },
  methods: {
    onUpload(url: string) {
      if (!url) return;
      this.$store.commit('setSetting', { backgroundImage: url });
    },
    onClear() {
      this.$store.commit('setSetting', { backgroundImage: '' });
    },
    onOpacityChange(value: number | number[]) {
      const v = Array.isArray(value) ? value[0] : value;
      this.$store.commit('setSetting', { backgroundOpacity: v });
    }
  }
});
</script>

<style lang="scss" scoped>
.bg-setting {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .preview {
    width: 100%;
    max-width: 320px;
    aspect-ratio: 16 / 9;
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid var(--app-border-subtle);
    background-color: var(--el-fill-color-light);
    background-image:
      linear-gradient(45deg, #d8d8d8 25%, transparent 25%), linear-gradient(-45deg, #d8d8d8 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #d8d8d8 75%), linear-gradient(-45deg, transparent 75%, #d8d8d8 75%);
    background-size: 12px 12px;
    background-position:
      0 0,
      0 6px,
      6px -6px,
      -6px 0;

    .preview-image {
      width: 100%;
      height: 100%;
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
    }

    .preview-empty {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: var(--el-text-color-secondary);
      background-color: var(--el-bg-color);

      .icon {
        font-size: 22px;
        margin-bottom: 6px;
      }

      .text {
        font-size: 12px;
      }
    }
  }

  .controls {
    display: flex;
    align-items: center;
  }

  .opacity-row {
    display: flex;
    align-items: center;
    gap: 12px;
    max-width: 320px;

    .label {
      font-size: 13px;
      color: var(--el-text-color-regular);
      flex: none;
    }

    .slider {
      flex: 1;
      min-width: 120px;
    }

    .value {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      flex: none;
      width: 36px;
      text-align: right;
    }
  }
}
</style>
