<template>
  <div>
    <span class="text-sm font-bold mb-2 block">{{ $t('kling.name.ratio') }}</span>
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
import { KLING_DEFAULT_ASPECT_RATIO } from '@/constants';

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
        return this.$store.state?.kling?.config?.aspect_ratio;
      },
      set(val) {
        console.debug('set ratio', val);
        this.$store.commit('kling/setConfig', {
          ...this.$store.state?.kling?.config,
          aspect_ratio: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = KLING_DEFAULT_ASPECT_RATIO;
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
  gap: 10px;

  .item {
    width: 48px;
    height: 65px;
    border: 2px solid var(--el-border-color);
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    border-radius: 5px;
    margin-right: 30px;

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
