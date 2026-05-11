<template>
  <div class="bg-setting">
    <!--
      16:9 preview. The checkerboard makes transparent PNGs visually
      obvious, matching the convention used elsewhere (EditImage uploads,
      avatar cropper, etc.).
    -->
    <div class="preview">
      <div v-if="image" class="preview-image" :style="{ backgroundImage: `url(${image})`, filter: previewFilter }" />
      <div v-else class="preview-empty">
        <font-awesome-icon icon="fa-solid fa-image" class="icon" />
        <span class="text">{{ $t('common.settings.backgroundEmpty') }}</span>
      </div>
    </div>

    <div class="controls">
      <edit-image
        :model-value="image || ''"
        :title="$t('common.settings.backgroundUploadTitle')"
        :tip="$t('common.settings.backgroundTip')"
        @confirm="onUpload"
      />
      <el-button v-if="image" round size="small" type="danger" plain class="ml-2" @click="onClear">
        {{ $t('common.button.clear') }}
      </el-button>
    </div>

    <!--
      Blur + opacity sliders are only meaningful with a wallpaper set. The
      hard min/max on each slider matches `src/utils/wallpaper.ts` BG_*_MIN
      / BG_*_MAX constants; the backend doesn't validate `metadata.*` so we
      enforce the readable range here at the UI boundary.
    -->
    <template v-if="image">
      <div class="slider-row">
        <span class="label">{{ $t('common.settings.backgroundBlur') }}</span>
        <el-slider
          :model-value="blur"
          :min="BG_BLUR_MIN"
          :max="BG_BLUR_MAX"
          :step="1"
          :show-tooltip="true"
          class="slider"
          @change="onBlurChange"
        />
        <span class="value">{{ blur }}px</span>
      </div>
      <div class="slider-row">
        <span class="label">{{ $t('common.settings.backgroundOpacity') }}</span>
        <el-slider
          :model-value="opacity"
          :min="BG_OPACITY_MIN"
          :max="BG_OPACITY_MAX"
          :step="1"
          :show-tooltip="true"
          class="slider"
          @change="onOpacityChange"
        />
        <span class="value">{{ opacity }}%</span>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton, ElSlider } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import EditImage from '@/components/site/EditImage.vue';
import { siteOperator } from '@/operators';
import {
  BG_BLUR_DEFAULT,
  BG_BLUR_MAX,
  BG_BLUR_MIN,
  BG_OPACITY_DEFAULT,
  BG_OPACITY_MAX,
  BG_OPACITY_MIN,
  readWallpaperConfig
} from '@/utils/wallpaper';

export default defineComponent({
  name: 'BackgroundSetting',
  components: {
    ElButton,
    ElSlider,
    FontAwesomeIcon,
    EditImage
  },
  data() {
    return {
      BG_BLUR_MIN,
      BG_BLUR_MAX,
      BG_OPACITY_MIN,
      BG_OPACITY_MAX
    };
  },
  computed: {
    site(): any {
      return this.$store.state.site || {};
    },
    config() {
      return readWallpaperConfig(this.site.metadata);
    },
    image(): string {
      return this.config.image;
    },
    blur(): number {
      return this.config.blur;
    },
    opacity(): number {
      return this.config.opacity;
    },
    /**
     * The same `filter: blur(N)` we render globally, but applied directly
     * to the small `.preview-image` so admins see the live effect of the
     * slider in the 16:9 frame BEFORE saving. `scale(1.05)` mirrors the
     * `inset: -5%` overscan in `_common.scss` so the blur halo doesn't
     * clip in the preview.
     */
    previewFilter(): string {
      return `blur(${this.blur}px)`;
    }
  },
  methods: {
    onUpload(url: string) {
      if (!url) return;
      // On first upload, seed sensible defaults for blur + opacity so the
      // admin doesn't have to drag two sliders to get a readable result.
      // Subsequent uploads preserve whatever they previously chose.
      const hasExisting = !!this.site?.metadata?.background_image;
      void this.saveMetadata({
        background_image: url,
        background_blur: hasExisting ? this.blur : BG_BLUR_DEFAULT,
        background_opacity: hasExisting ? this.opacity : BG_OPACITY_DEFAULT
      });
    },
    onClear() {
      // Remove all three keys so the next read falls cleanly back to
      // "no wallpaper" without ghost blur/opacity values lingering in
      // `metadata`.
      void this.saveMetadata({
        background_image: '',
        background_blur: undefined,
        background_opacity: undefined
      });
    },
    onBlurChange(value: number | number[]) {
      const v = Array.isArray(value) ? value[0] : value;
      void this.saveMetadata({ background_blur: v });
    },
    onOpacityChange(value: number | number[]) {
      const v = Array.isArray(value) ? value[0] : value;
      void this.saveMetadata({ background_opacity: v });
    },
    async saveMetadata(patch: Record<string, any>) {
      // Spread the existing metadata so we don't clobber other admin-set
      // keys (e.g. analytics, brand-specific flags). `undefined` keys are
      // dropped \u2014 use that to "remove" a key on Clear.
      const nextMetadata: Record<string, any> = {
        ...(this.site.metadata || {})
      };
      for (const [k, v] of Object.entries(patch)) {
        if (v === undefined) {
          delete nextMetadata[k];
        } else {
          nextMetadata[k] = v;
        }
      }
      const payload = {
        ...this.site,
        metadata: nextMetadata
      };
      try {
        await siteOperator.update(this.site?.id, payload);
        // Refresh the store so App.vue's `siteMetadata` watcher repaints.
        await this.$store.dispatch('getSite');
      } catch (e) {
        console.error('failed to save site wallpaper metadata', e);
      }
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
      // Match the global `body::before` overscan so the blur halo doesn't
      // clip in the preview frame.
      transform: scale(1.08);
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

  .slider-row {
    display: flex;
    align-items: center;
    gap: 12px;
    max-width: 320px;

    .label {
      font-size: 13px;
      color: var(--el-text-color-regular);
      flex: none;
      min-width: 56px;
    }

    .slider {
      flex: 1;
      min-width: 120px;
    }

    .value {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      flex: none;
      width: 44px;
      text-align: right;
    }
  }
}
</style>
