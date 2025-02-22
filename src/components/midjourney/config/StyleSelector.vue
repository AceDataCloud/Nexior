<template>
  <div class="field">
    <span class="text-sm font-bold title">{{ $t('midjourney.name.style') }}</span>
    <el-select v-model="value" class="value" :placeholder="$t('midjourney.placeholder.select')" clearable>
      <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value">
        <span class="float-left">{{ item.label }}</span>
        <span class="float-right">{{ item.value }}</span>
      </el-option>
    </el-select>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { ElSelect, ElOption } from 'element-plus';

const DEFAULT_STYLE = '';

export default defineComponent({
  name: 'StyleSelector',
  components: {
    ElSelect,
    ElOption
  },
  data() {
    return {};
  },
  computed: {
    model() {
      return this.$store.state.midjourney.config.model;
    },
    options() {
      if (this.model?.includes('niji')) {
        return [
          {
            value: 'cute',
            label: this.$t('midjourney.style.cute')
          },
          {
            value: 'expressive',
            label: this.$t('midjourney.style.expressive')
          },
          {
            value: 'scenic',
            label: this.$t('midjourney.style.scenic')
          },
          {
            value: 'original',
            label: this.$t('midjourney.style.original')
          }
        ];
      } else {
        return [
          {
            value: 'raw',
            label: this.$t('midjourney.style.raw')
          }
        ];
      }
    },
    value: {
      get() {
        return this.$store.state.midjourney.config.style;
      },
      set(val) {
        this.$store.commit('midjourney/setConfig', {
          ...this.$store.state.midjourney.config,
          style: val
        });
      }
    }
  },
  watch: {
    model() {
      this.value = '';
    }
  },
  mounted() {
    if (!this.value) {
      this.value = DEFAULT_STYLE;
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
