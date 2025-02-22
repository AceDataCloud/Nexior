<template>
  <div>
    <h2 class="title font-bold">{{ $t('flux.name.ratio') }}</h2>
    <div class="items">
      <div
        v-for="(option, optionKey) in options"
        :key="optionKey"
        :class="{ active: active === optionKey, item: true }"
        @click="value = option.value"
      >
        <div class="preview" :class="option.label">
          <div class="rect" :style="{ width: option.width + 'px', height: option.height + 'px' }"></div>
        </div>
        <p class="name">
          {{ option.label }}
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { FLUX_DEFAULT_ASPECT_RATIO } from '@/constants';

export default defineComponent({
  name: 'RatioSelector',
  data() {
    return {
      options: [
        {
          value: '1:1',
          label: '1:1',
          width: 20,
          height: 20
        },
        {
          value: '2:3',
          label: '2:3',
          width: 18,
          height: 27
        },
        {
          value: '3:2',
          label: '3:2',
          width: 27,
          height: 18
        },
        {
          value: '4:3',
          label: '4:3',
          width: 20,
          height: 15
        },
        {
          value: '3:4',
          label: '3:4',
          width: 15,
          height: 20
        },
        {
          value: '16:9',
          label: '16:9',
          width: 25,
          height: 13
        },
        {
          value: '9:16',
          label: '9:16',
          width: 13,
          height: 25
        }
      ]
    };
  },
  computed: {
    active() {
      return this.options.findIndex((option) => option.value === this.value) || 0;
    },
    value: {
      get() {
        return this.$store.state.flux?.config?.aspect_ratio;
      },
      set(val) {
        console.debug('set ratio', val);
        this.$store.commit('flux/setConfig', {
          ...this.$store.state.flux.config,
          aspect_ratio: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = FLUX_DEFAULT_ASPECT_RATIO;
    }
  }
});
</script>
<style lang="scss" scoped>
.title {
  font-size: 14px;
  margin-bottom: 10px;
}

.items {
  display: grid;
  grid-template-columns: repeat(5, 48px); // 固定每行5列
  gap: 8px; // 元素间距
  justify-content: start; // 左对齐

  .item {
    width: 48px;
    height: 65px;
    border: 2px solid var(--el-border-color);
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    border-radius: 5px;
    flex-shrink: 0;

    .preview {
      margin-top: 8px;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;

      .rect {
        border: 2px solid var(--el-border-color);
        width: 20px;
        height: 20px;
        border-radius: 2px;
      }
    }

    .name {
      display: block;
      font-size: 12px;
      color: var(--el-text-color-primary);
    }

    &.active {
      border-color: var(--el-color-primary);
      .rect {
        border-color: var(--el-color-primary);
      }
    }
  }
}

/* 响应式处理 */
@media (max-width: 480px) {
  .items {
    grid-template-columns: repeat(5, 48px); // 固定每行5列
    gap: 8px; // 元素间距
  }
}

@media (min-width: 481px) and (max-width: 768px) {
  .items {
    grid-template-columns: repeat(5, 48px); // 固定每行5列
    gap: 8px; // 元素间距
  }
}
</style>
