<template>
  <div class="field">
    <h2 class="title">绘制风格</h2>
    <el-tabs v-model="tab">
      <el-tab-pane
        v-for="(element, elementKey) in elements"
        :key="elementKey"
        :label="element.displayName"
        :name="elementKey"
        class="pane"
      >
        <div
          v-for="(item, itemKey) in element.items"
          :key="itemKey"
          :class="{
            item: true,
            active: value.includes(item.value)
          }"
          @click="onChoose(item.value)"
        >
          <el-image :src="item.image" fit="fill" class="preview" />
          <span class="name">{{ item.label }}</span>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElTabs, ElTabPane, ElImage } from 'element-plus';

export default defineComponent({
  name: 'StylizeSelector',
  components: {
    ElTabs,
    ElTabPane,
    ElImage
  },
  props: {
    modelValue: {
      type: Array,
      default: () => []
    }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      tab: 'styles',
      value: this.modelValue,
      elements: {
        styles: {
          displayName: '风格',
          items: [
            {
              value: '2D illustration',
              label: '二位插图',
              image: 'https://cdn.zhishuyun.com/2023-10-07-102019.png'
            },
            {
              value: 'Pixel art',
              label: '像素艺术',
              image: 'https://cdn.zhishuyun.com/2023-10-07-102158.png'
            },
            {
              value: 'Watercolour',
              label: '水彩',
              image: 'https://cdn.zhishuyun.com/2023-10-07-102236.png'
            },
            {
              value: 'Ukiyo-e art',
              label: '浮世绘艺术',
              image: 'https://cdn.zhishuyun.com/2023-10-07-102303.png'
            }
          ]
        },
        lighting: {
          displayName: '光照',
          items: [
            {
              value: 'Golden hour light',
              label: '黄金时段光线',
              image: 'https://cdn.zhishuyun.com/2023-10-07-102458.png'
            },
            {
              value: 'Candlelight',
              label: '烛光',
              image: 'https://cdn.zhishuyun.com/2023-10-07-102537.png'
            }
          ]
        },
        artists: {
          displayName: '艺术家',
          items: [
            {
              value: 'Monet',
              label: '莫奈',
              image: 'https://cdn.zhishuyun.com/2023-10-07-102650.png'
            },
            {
              value: 'Picasso',
              label: '毕加索',
              image: 'https://cdn.zhishuyun.com/2023-10-07-102740.png'
            }
          ]
        }
      }
    };
  },
  watch: {
    modelValue(val) {
      this.value = val;
    },
    value: {
      handler(val) {
        this.$emit('update:modelValue', val);
      },
      deep: true
    }
  },
  mounted() {
    if (!this.value) {
      this.value = [];
    }
    this.$emit('update:modelValue', this.value);
  },
  methods: {
    onChoose(value: string) {
      this.value.push(value);
      this.$emit('update:modelValue', this.value);
    }
  }
});
</script>

<style lang="scss" scoped>
.pane {
  display: flex;
  flex-direction: row;
  justify-content: left;
  align-items: center;
  .item {
    $height: 100px;
    $width: 100px;
    position: relative;
    width: $height;
    height: $width;
    margin-right: 8px;
    margin-bottom: 8px;
    border-width: 2px;
    border-style: solid;
    border-color: #eee;
    border-radius: 5px;
    overflow: hidden;

    &.active {
      border-color: var(--el-color-primary);
    }

    .preview {
      width: $height;
      height: $width;
    }
    .name {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 20px;
      width: $width;
      background-color: rgba(0, 0, 0, 0.5);
      color: white;
      font-size: 10px;
      text-align: center;
    }
  }
}
</style>
