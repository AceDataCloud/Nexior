<template>
  <div>
    <h2 class="title">{{ $t('midjourney.name.model') }}</h2>
    <div class="items">
      <div
        v-for="(option, optionKey) in options"
        :key="optionKey"
        :class="{ active: active === optionKey, item: true }"
        @click="value = option.value"
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
  data() {
    return {
      options: [
        {
          value: '',
          label: this.$t('midjourney.model.general'),
          image: 'https://cdn.acedata.cloud/2023-10-06-174633.png'
        },
        {
          value: 'niji 5',
          label: this.$t('midjourney.model.niji'),
          image: 'https://cdn.acedata.cloud/2023-10-06-174008.png'
        }
      ]
    };
  },
  computed: {
    active() {
      return this.options.findIndex((option) => option.value === this.value);
    },
    value: {
      get() {
        return this.$store.state.midjourney.preset?.model;
      },
      set(val) {
        console.debug('set model', val);
        this.$store.commit('midjourney/setPreset', {
          ...this.$store.state.midjourney.preset,
          model: val
        });
      }
    }
  },
  mounted() {
    if (this.value === undefined) {
      this.value = '';
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
    width: 115px;
    height: 60px;
    border: 2px solid var(--el-border-color);
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
