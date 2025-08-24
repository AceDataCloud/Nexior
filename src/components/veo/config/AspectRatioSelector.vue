<template>
  <div>
    <span class="text-sm font-bold mb-2 block">{{ $t('veo.name.ratio') }}</span>
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

<script lang="ts">
import { defineComponent } from 'vue';
import { VEO_DEFAULT_ASPECT_RATIO } from '@/constants';

export default defineComponent({
  name: 'AspectRatioSelector',
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
        return this.$store.state.veo?.config?.aspect_ratio;
      },
      set(val: string) {
        console.debug('set aspect_ratio', val);
        this.$store.commit('veo/setConfig', {
          ...this.$store.state?.veo?.config,
          aspect_ratio: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = VEO_DEFAULT_ASPECT_RATIO;
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
