<template>
  <div>
    <span class="text-sm font-bold mb-2 block">{{ $t('sora.name.orientation') }}</span>
    <div class="items">
      <div
        v-for="(option, optionKey) in options"
        :key="optionKey"
        :class="{ active: active === optionKey, item: true }"
        @click="value = option.value"
      >
        <div class="preview" :class="option.value">
          <div class="rect" :style="{ width: option.width + 'px', height: option.height + 'px' }"></div>
        </div>
        <p class="name">
          {{ option.label }}
        </p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { SORA_DEFAULT_ORIENTATION } from '@/constants';

export default defineComponent({
  name: 'OrientationSelector',
  data() {
    return {
      options: [
        {
          value: 'portrait',
          label: '竖屏',
          width: 13,
          height: 25
        },
        {
          value: 'landscape',
          label: '横屏',
          width: 25,
          height: 13
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
        return this.$store.state.sora?.config?.orientation;
      },
      set(val: string) {
        console.debug('set orientation', val);
        this.$store.commit('sora/setConfig', {
          ...this.$store.state?.sora?.config,
          orientation: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = SORA_DEFAULT_ORIENTATION;
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
  justify-content: flex-start;
  gap: 12px;

  .item {
    width: 48px;
    height: 65px;
    border: 1px solid var(--el-border-color);
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    border-radius: var(--el-border-radius-base);

    .preview {
      margin-top: 5px;
      margin-bottom: 3px;
      width: 30px;
      height: 30px;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;

      .rect {
        border: 1px solid var(--el-border-color);
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
