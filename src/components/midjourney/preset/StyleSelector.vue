<template>
  <div class="field">
    <h2 class="title">{{ $t('midjourney.name.style') }}</h2>
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
      return this.$store.state.midjourney.preset?.model;
    },
    options() {
      if (this.model === 'niji') {
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
        return this.$store.state.midjourney.preset?.style;
      },
      set(val) {
        console.debug('set style', val);
        this.$store.commit('midjourney/setPreset', {
          ...this.$store.state.midjourney.preset,
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
