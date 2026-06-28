<template>
  <div class="ratio">
    <div class="header">
      <h2 class="title font-bold">{{ $t('nanobanana.name.aspectRatio') }}</h2>
      <info-icon :content="$t('nanobanana.description.aspectRatio')" class="ml-1" />
    </div>
    <div class="items" role="radiogroup" :aria-label="$t('nanobanana.name.aspectRatio')">
      <div
        v-for="opt in options"
        :key="opt.value"
        class="item"
        :class="{ active: value === opt.value }"
        role="radio"
        :aria-checked="value === opt.value"
        :aria-label="opt.label"
        tabindex="0"
        @click="onSelect(opt.value)"
        @keydown.enter.prevent="onSelect(opt.value)"
        @keydown.space.prevent="onSelect(opt.value)"
      >
        <div class="preview">
          <div class="rect" :style="{ width: opt.width + 'px', height: opt.height + 'px' }"></div>
        </div>
        <p class="name">{{ opt.label }}</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import InfoIcon from '@/components/common/InfoIcon.vue';

interface IRatioOption {
  value: string;
  label: string;
  width: number;
  height: number;
}

export default defineComponent({
  name: 'AspectRatioSelector',
  components: { InfoIcon },
  data() {
    return {
      options: [
        { value: '1:1', label: '1:1', width: 20, height: 20 },
        { value: '3:2', label: '3:2', width: 27, height: 18 },
        { value: '2:3', label: '2:3', width: 18, height: 27 },
        { value: '16:9', label: '16:9', width: 25, height: 13 },
        { value: '9:16', label: '9:16', width: 13, height: 25 },
        { value: '4:3', label: '4:3', width: 24, height: 18 },
        { value: '3:4', label: '3:4', width: 18, height: 24 }
      ] as IRatioOption[]
    };
  },
  computed: {
    value(): string | undefined {
      return this.$store.state.nanobanana?.config?.aspect_ratio;
    }
  },
  methods: {
    onSelect(val: string) {
      // Toggle: clicking the active ratio clears it. nano-banana intentionally
      // allows "no aspect ratio" so edit mode follows the input image's ratio.
      const next = this.value === val ? undefined : val;
      const nextConfig = { ...(this.$store.state.nanobanana?.config || {}) };
      if (!next) {
        delete (nextConfig as any).aspect_ratio;
      } else {
        (nextConfig as any).aspect_ratio = next;
      }
      this.$store.commit('nanobanana/setConfig', nextConfig);
    }
  }
});
</script>

<style lang="scss" scoped>
.ratio {
  .header {
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-bottom: 10px;

    .title {
      font-size: 14px;
      margin: 0;
    }
  }

  .items {
    display: grid;
    grid-template-columns: repeat(5, 48px);
    gap: 8px;
    justify-content: start;

    .item {
      width: 48px;
      height: 65px;
      border: 1px solid var(--el-border-color);
      background-color: var(--el-fill-color-lighter);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      border-radius: 8px;
      transition:
        background-color 0.2s ease,
        border-color 0.2s ease;

      .preview {
        width: 30px;
        height: 30px;
        margin-bottom: 4px;
        display: flex;
        align-items: center;
        justify-content: center;

        .rect {
          border: 1px solid var(--el-text-color-placeholder);
          border-radius: 2px;
        }
      }

      .name {
        font-size: 12px;
        margin: 0;
        color: var(--el-text-color-primary);
      }

      &:hover {
        background-color: var(--el-fill-color);
      }

      &:focus-visible {
        outline: none;
        border-color: var(--el-color-primary);
        box-shadow: 0 0 0 2px var(--el-color-primary-light-7);
      }

      &.active {
        border-color: var(--el-color-primary);
        background-color: var(--el-color-primary-light-9);

        .rect {
          border-color: var(--el-color-primary);
        }
      }
    }
  }
}
</style>
