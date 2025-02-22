<template>
  <div>
    <div class="flex justify-start items-center">
      <span class="text-sm font-bold">{{ $t('midjourney.name.model') }}</span>
      <info-icon :content="$t('midjourney.description.model')" />
    </div>
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
import InfoIcon from '@/components/common/InfoIcon.vue';

export default defineComponent({
  name: 'ModelSelector',
  components: {
    ElImage,
    InfoIcon
  },
  data() {
    return {
      options: [
        {
          value: '',
          label: this.$t('midjourney.model.general'),
          image: 'https://cdn.acedata.cloud/ebvlwg.png'
        },
        {
          value: 'niji 5',
          label: this.$t('midjourney.model.niji'),
          image: 'https://cdn.acedata.cloud/j6v1m7.png'
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
        return this.$store.state.midjourney.config.model;
      },
      set(val) {
        this.$store.commit('midjourney/setConfig', {
          ...this.$store.state.midjourney.config,
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
    width: 130px;
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
      top: 12px;
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
