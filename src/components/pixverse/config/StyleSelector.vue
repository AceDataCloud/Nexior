<template>
  <div class="field">
    <h2 class="title font-bold">{{ $t('pixverse.name.style') }}</h2>
    <el-select v-model="value" class="value" :placeholder="$t('pixverse.placeholder.select')">
      <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSelect, ElOption } from 'element-plus';
import { PIXVERSE_DEFAULT_STYLE } from '@/constants';

export default defineComponent({
  name: 'StyleSelector',
  components: {
    ElSelect,
    ElOption
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
      options: [
        {
          value: 'cyberpunk',
          label: this.$t('pixverse.name.style1')
        },
        {
          value: 'anime',
          label: this.$t('pixverse.name.style2')
        },
        {
          value: 'comic',
          label: this.$t('pixverse.name.style3')
        },
        {
          value: 'clay',
          label: this.$t('pixverse.name.style4')
        },
        {
          value: '3d_animation',
          label: this.$t('pixverse.name.style5')
        },
        {
          value: 'realistic',
          label: this.$t('pixverse.name.style6')
        }
      ]
    };
  },
  computed: {
    value: {
      get() {
        return this.$store.state.pixverse?.config?.style;
      },
      set(val: string) {
        this.$store.commit('pixverse/setConfig', {
          ...this.$store.state.pixverse.config,
          style: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = PIXVERSE_DEFAULT_STYLE;
    }
  }
});
</script>

<style lang="scss" scoped>
.field {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;

  .title {
    font-size: 14px;
    margin: 0;
    width: 30%;
  }
  .value {
    width: 120px;
  }
}
</style>
