<template>
  <div class="field">
    <h2 class="title">{{ $t('qrart.name.rotate') }}</h2>
    <el-select v-model="value" clearable class="value" :placeholder="$t('qrart.placeholder.rotate')">
      <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </div>
</template>

<script>
import { QRART_DEFAULT_ROTATE } from '@/constants';
import { defineComponent } from 'vue';
import { ElSelect, ElOption } from 'element-plus';

export default defineComponent({
  name: 'RotateSelector',
  components: {
    ElSelect,
    ElOption
  },
  data() {
    return {
      options: [
        {
          value: 0,
          label: 0
        },
        {
          value: 90,
          label: 90
        },
        {
          value: 180,
          label: 180
        },
        {
          value: 270,
          label: 270
        }
      ]
    };
  },
  computed: {
    value: {
      get() {
        return this.$store.state.qrart?.config?.rotate;
      },
      set(val) {
        console.debug('set rotate', val);
        this.$store.commit('qrart/setConfig', {
          ...this.$store.state.qrart?.config,
          rotate: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = QRART_DEFAULT_ROTATE;
    }
  }
});
</script>

<style lang="scss" scoped>
.field {
  display: flex;
  flex-direction: row;
  align-items: center;

  .title {
    font-size: 14px;
    margin: 0;
    width: 30%;
  }
  .value {
    flex: 1;
  }
}
</style>
