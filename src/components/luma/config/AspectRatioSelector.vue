<template>
  <div>
    <h2 class="title">{{ $t('qrart.name.aspectRatio') }}</h2>
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
import { QRART_DEFAULT_ASPECT_RATIO } from '@/constants';

export default defineComponent({
  name: 'AspectRatioSelector',
  data() {
    return {
      options: [
        {
          value: '1:1',
          label: '1:1',
          width: 30,
          height: 30
        },
        {
          value: '4:3',
          label: '4:3',
          width: 32,
          height: 24
        },
        {
          value: '3:4',
          label: '3:4',
          width: 24,
          height: 32
        },
        {
          value: '16:9',
          label: '16:9',
          width: 32,
          height: 18
        },
        {
          value: '9:16',
          label: '9:16',
          width: 18,
          height: 32
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
        return this.$store.state.qrart?.config?.aspect_ratio;
      },
      set(val) {
        console.debug('set aspect ratio', val);
        this.$store.commit('qrart/setConfig', {
          ...this.$store.state.qrart?.config,
          aspect_ratio: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = QRART_DEFAULT_ASPECT_RATIO;
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
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;

  .item {
    width: 45px;
    height: 75px;
    border: 2px solid var(--el-border-color);
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    border-radius: 5px;

    .preview {
      margin-top: 8px;
      width: 30px;
      height: 30px;
      display: flex;
      flex-direction: row;
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
</style>
