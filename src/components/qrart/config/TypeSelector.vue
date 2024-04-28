<template>
  <div class="field">
    <h2 class="title">{{ $t('qrart.name.type') }}</h2>
    <el-select v-model="value" class="value" :placeholder="$t('qrart.placeholder.select')">
      <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { ElSelect, ElOption } from 'element-plus';

const DEFAULT_TYPE = 'Link';

export default defineComponent({
  name: 'VersionSelector',
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
          label: 'Text',
          value: 'text'
        },
        {
          label: 'Link',
          value: 'link'
        }
      ]
    };
  },
  computed: {
    value: {
      get() {
        return this.$store.state.qrart.config?.type;
      },
      set(val) {
        console.debug('set type', val);
        this.$store.commit('qrart/setConfig', {
          ...this.$store.state.qrart.config,
          type: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = DEFAULT_TYPE;
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
