<template>
  <div class="field">
    <h2 class="title">{{ $t('qrart.name.pixelStyle') }}</h2>
    <el-select v-model="value" clearable class="value" :placeholder="$t('qrart.placeholder.pixelStyle')">
      <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </div>
</template>

<script>
import { QRART_DEFAULT_PIXEL_STYLE } from '@/constants';
import { defineComponent } from 'vue';
import { ElSelect, ElOption } from 'element-plus';

export default defineComponent({
  name: 'PixelStyleSelector',
  components: {
    ElSelect,
    ElOption
  },
  data() {
    return {
      options: [
        {
          value: 'square',
          label: this.$t('qrart.pixelStyle.square')
        },
        {
          value: 'rounded',
          label: this.$t('qrart.pixelStyle.rounded')
        },
        {
          value: 'dot',
          label: this.$t('qrart.pixelStyle.dot')
        },
        {
          value: 'squircle',
          label: this.$t('qrart.pixelStyle.squircle')
        },
        {
          value: 'row',
          label: this.$t('qrart.pixelStyle.row')
        },
        {
          value: 'column',
          label: this.$t('qrart.pixelStyle.column')
        }
      ]
    };
  },
  computed: {
    value: {
      get() {
        return this.$store.state.qrart?.config?.pixel_style;
      },
      set(val) {
        console.debug('set pixel_style', val);
        this.$store.commit('qrart/setConfig', {
          ...this.$store.state.qrart?.config,
          pixel_style: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = QRART_DEFAULT_PIXEL_STYLE;
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
