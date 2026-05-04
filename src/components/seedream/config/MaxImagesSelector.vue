<template>
  <div v-if="supported" class="field">
    <div class="label">
      <div class="box">
        <h2 class="title font-bold">{{ $t('seedream.name.maxImages') }}</h2>
        <info-icon :content="$t('seedream.description.maxImages')" class="info" />
      </div>
    </div>
    <div class="value">
      <el-input-number
        v-model="value"
        :min="1"
        :max="effectiveMax"
        :step="1"
        size="default"
        controls-position="right"
        class="counter"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElInputNumber } from 'element-plus';
import InfoIcon from '@/components/common/InfoIcon.vue';
import { SEEDREAM_DEFAULT_MAX_IMAGES, SEEDREAM_MAX_IMAGES_LIMIT, supportsSeedreamGroupGeneration } from '@/constants';

export default defineComponent({
  name: 'SeedreamMaxImagesSelector',
  components: {
    ElInputNumber,
    InfoIcon
  },
  computed: {
    config(): any {
      return this.$store.state.seedream?.config || {};
    },
    supported(): boolean {
      return supportsSeedreamGroupGeneration(this.config?.model);
    },
    referenceImageCount(): number {
      const image = this.config?.image;
      return Array.isArray(image) ? image.length : 0;
    },
    // Volcengine LAS rule: (input reference images) + (generated images) <= 15.
    // Cap the spinner upper bound dynamically so the user can't pick a value
    // that the upstream will reject. Floor at 1 so the input never becomes
    // unusable when the user uploads exactly 14 references (15 - 14 = 1).
    effectiveMax(): number {
      const remaining = SEEDREAM_MAX_IMAGES_LIMIT - this.referenceImageCount;
      return Math.max(1, Math.min(SEEDREAM_MAX_IMAGES_LIMIT, remaining));
    },
    value: {
      get(): number {
        const v = this.config?.sequential_image_generation_options?.max_images;
        return typeof v === 'number' && v >= 1 ? v : SEEDREAM_DEFAULT_MAX_IMAGES;
      },
      set(val: number) {
        const cfg = { ...(this.config || {}) };
        const next = Math.max(1, Math.min(this.effectiveMax, Math.floor(val || 1)));
        if (next > 1) {
          cfg.sequential_image_generation = 'auto';
          cfg.sequential_image_generation_options = {
            ...(cfg.sequential_image_generation_options || {}),
            max_images: next
          };
        } else {
          // count=1 -> revert to single-image mode and drop the options object
          // so we don't ship a misleading payload to the upstream.
          cfg.sequential_image_generation = 'disabled';
          if (cfg.sequential_image_generation_options) {
            delete cfg.sequential_image_generation_options;
          }
        }
        this.$store.commit('seedream/setConfig', cfg);
      }
    }
  },
  watch: {
    // If the user switches to a model that doesn't support group generation
    // (e.g. doubao-seedream-3.0-t2i), strip the multi-image fields so the
    // request stays valid.
    supported: {
      immediate: true,
      handler(v: boolean) {
        if (v) return;
        const cfg = { ...(this.config || {}) };
        let dirty = false;
        if (cfg.sequential_image_generation) {
          delete cfg.sequential_image_generation;
          dirty = true;
        }
        if (cfg.sequential_image_generation_options) {
          delete cfg.sequential_image_generation_options;
          dirty = true;
        }
        if (dirty) this.$store.commit('seedream/setConfig', cfg);
      }
    },
    // If the user shrinks the picker by uploading more reference images,
    // clamp the stored value so it stays valid.
    effectiveMax(max: number) {
      if (this.value > max) {
        this.value = max;
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.field {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;

  .label {
    width: 30%;
    display: flex;
    align-items: center;

    .box {
      display: flex;
      flex-direction: row;
      align-items: center;

      .title {
        font-size: 14px;
        margin: 0;
      }

      .info {
        margin-left: 6px;
      }
    }
  }

  .value {
    width: 160px;
    display: flex;
    justify-content: flex-end;

    .counter {
      width: 140px;
    }
  }
}
</style>
