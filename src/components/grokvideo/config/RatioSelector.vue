<template>
  <div class="ratio">
    <div class="header">
      <h2 class="title font-bold">{{ $t('grokvideo.name.ratio') }}</h2>
      <info-icon :content="$t('grokvideo.description.ratio')" class="info" />
    </div>
    <div class="items">
      <div
        v-for="item in options"
        :key="item.value"
        class="item"
        :class="{ active: value === item.value }"
        @click="value = item.value"
      >
        <div class="preview">
          <div class="rect" :style="{ width: item.w + 'px', height: item.h + 'px' }" />
        </div>
        <div class="name">{{ item.label }}</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import InfoIcon from '@/components/common/InfoIcon.vue';
import {
  GROKVIDEO_DEFAULT_RATIO,
  GROKVIDEO_RATIO_16_9,
  GROKVIDEO_RATIO_9_16,
  GROKVIDEO_RATIO_1_1,
  GROKVIDEO_RATIO_4_3,
  GROKVIDEO_RATIO_3_4,
  GROKVIDEO_RATIO_3_2,
  GROKVIDEO_RATIO_2_3
} from '@/constants';

interface RatioOption {
  value: string;
  label: string;
  w: number;
  h: number;
}

export default defineComponent({
  name: 'GrokVideoRatioSelector',
  components: {
    InfoIcon
  },
  computed: {
    options(): RatioOption[] {
      return [
        { value: GROKVIDEO_RATIO_16_9, label: '16:9', w: 32, h: 18 },
        { value: GROKVIDEO_RATIO_9_16, label: '9:16', w: 18, h: 32 },
        { value: GROKVIDEO_RATIO_1_1, label: '1:1', w: 24, h: 24 },
        { value: GROKVIDEO_RATIO_4_3, label: '4:3', w: 28, h: 21 },
        { value: GROKVIDEO_RATIO_3_4, label: '3:4', w: 21, h: 28 },
        { value: GROKVIDEO_RATIO_3_2, label: '3:2', w: 30, h: 20 },
        { value: GROKVIDEO_RATIO_2_3, label: '2:3', w: 20, h: 30 }
      ];
    },
    value: {
      get(): string | undefined {
        return this.$store.state.grokvideo?.config?.aspect_ratio;
      },
      set(val: string) {
        this.$store.commit('grokvideo/setConfig', {
          ...this.$store.state.grokvideo?.config,
          aspect_ratio: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = GROKVIDEO_DEFAULT_RATIO;
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

    .info {
      margin-left: 6px;
    }
  }

  .items {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;

    .item {
      flex: 0 0 calc(25% - 6px);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 8px 0 6px;
      border: 1px solid var(--el-border-color);
      border-radius: 8px;
      cursor: pointer;
      transition:
        background-color 0.15s ease,
        border-color 0.15s ease,
        color 0.15s ease;
      background-color: var(--el-fill-color-lighter);

      &:hover {
        background-color: var(--el-fill-color);
        border-color: var(--el-border-color-hover);
      }

      .preview {
        width: 100%;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 4px;

        .rect {
          border: 1.5px solid var(--el-text-color-secondary);
          border-radius: 2px;
          background-color: transparent;
        }
      }

      .name {
        font-size: 12px;
        color: var(--el-text-color-regular);
        line-height: 1;
      }

      &.active {
        border-color: var(--el-color-primary);
        background-color: var(--el-color-primary-light-9);

        .rect {
          border-color: var(--el-color-primary);
        }

        .name {
          color: var(--el-color-primary);
          font-weight: 600;
        }
      }
    }
  }
}
</style>
