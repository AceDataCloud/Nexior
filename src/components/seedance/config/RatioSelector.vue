<template>
  <div class="ratio">
    <div class="header">
      <h2 class="title font-bold">{{ $t('seedance.name.ratio') }}</h2>
      <info-icon :content="$t('seedance.description.ratio')" class="info" />
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
          <div v-if="item.w && item.h" class="rect" :style="{ width: item.w + 'px', height: item.h + 'px' }" />
          <div v-else class="rect rect-auto">A</div>
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
  SEEDANCE_DEFAULT_RATIO,
  SEEDANCE_RATIO_16_9,
  SEEDANCE_RATIO_4_3,
  SEEDANCE_RATIO_1_1,
  SEEDANCE_RATIO_3_4,
  SEEDANCE_RATIO_9_16,
  SEEDANCE_RATIO_21_9,
  SEEDANCE_RATIO_ADAPTIVE
} from '@/constants';

interface RatioOption {
  value: string;
  label: string;
  w: number;
  h: number;
}

export default defineComponent({
  name: 'SeedanceRatioSelector',
  components: {
    InfoIcon
  },
  computed: {
    options(): RatioOption[] {
      return [
        { value: SEEDANCE_RATIO_16_9, label: '16:9', w: 32, h: 18 },
        { value: SEEDANCE_RATIO_9_16, label: '9:16', w: 18, h: 32 },
        { value: SEEDANCE_RATIO_4_3, label: '4:3', w: 28, h: 21 },
        { value: SEEDANCE_RATIO_3_4, label: '3:4', w: 21, h: 28 },
        { value: SEEDANCE_RATIO_1_1, label: '1:1', w: 24, h: 24 },
        { value: SEEDANCE_RATIO_21_9, label: '21:9', w: 34, h: 14 },
        {
          value: SEEDANCE_RATIO_ADAPTIVE,
          label: this.$t('seedance.ratio.adaptive') as string,
          w: 0,
          h: 0
        }
      ];
    },
    value: {
      get(): string | undefined {
        return this.$store.state.seedance?.config?.ratio;
      },
      set(val: string) {
        this.$store.commit('seedance/setConfig', {
          ...this.$store.state.seedance?.config,
          ratio: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = SEEDANCE_DEFAULT_RATIO;
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
      background-color: var(--el-bg-color);

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

        .rect-auto {
          width: 28px;
          height: 28px;
          border-style: dashed;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          color: var(--el-text-color-secondary);
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
          color: var(--el-color-primary);
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
