<template>
  <div>
    <h2 class="title">{{ $t('midjourney.name.model') }}</h2>
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
        <el-image :src="option.image" fit="cover" class="image" />
        <p class="name">
          {{ option.label }}
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { ElImage } from 'element-plus';
export default defineComponent({
  name: 'ModelSelector',
  components: {
    ElImage
  },
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
      active: 0,
      options: [
        {
          value: '',
          label: this.$t('midjourney.model.general'),
          image: 'https://cdn.zhishuyun.com/2023-10-06-174633.png'
        },
        {
          value: 'niji',
          label: this.$t('midjourney.model.niji'),
          image: 'https://cdn.zhishuyun.com/2023-10-06-174008.png'
        }
      ]
    };
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
    width: 115px;
    height: 60px;
    border: 2px solid #eee;
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    border-radius: 5px;
    position: relative;

    .image {
      width: 100%;
      height: 100%;
    }

    .name {
      display: block;
      font-size: 18px;
      color: white;
      position: absolute;
      text-align: center;
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
