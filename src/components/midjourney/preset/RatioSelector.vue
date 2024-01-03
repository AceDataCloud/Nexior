<template>
  <div>
    <h2 class="title">{{ $t('midjourney.name.ratio') }}</h2>
    <div class="items">
      <div
        v-for="(option, optionKey) in options"
        :key="optionKey"
        :class="{ active: active === optionKey, item: true }"
        @click="
          active = optionKey;
          value = option.value;
        "
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

const DEFAULT_RATIO = '1:1';

export default defineComponent({
  name: 'RatioSelector',
  props: {
    modelValue: {
      type: String,
      default: undefined
    }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      value: this.modelValue,
      options: [
        {
          value: '1:1',
          label: '1:1',
          width: 15,
          height: 15
        },
        {
          value: '4:3',
          label: '4:3',
          width: 16,
          height: 12
        },
        {
          value: '3:4',
          label: '3:4',
          width: 12,
          height: 16
        },
        {
          value: '16:9',
          label: '16:9',
          width: 16,
          height: 9
        },
        {
          value: '9:16',
          label: '9:16',
          width: 9,
          height: 16
        }
      ]
    };
  },
  computed: {
    active() {
      return this.options.findIndex((option) => option.value === this.value);
    }
  },
  watch: {
    modelValue(val) {
      if (val !== this.value) {
        this.value = val;
      }
    },
    value(val) {
      this.$emit('update:modelValue', val);
    }
  },
  mounted() {
    if (!this.modelValue) {
      this.value = DEFAULT_RATIO;
    } else {
      this.value = this.modelValue;
    }
    this.$emit('update:modelValue', this.value);
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
    width: 40px;
    height: 60px;
    border: 2px solid #eee;
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
        border: 2px solid #eee;
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
