<template>
  <div class="field">
    <h2 class="title">{{ $t('midjourney.name.version') }}</h2>
    <el-select v-model="value" class="value" :placeholder="$t('midjourney.placeholder.select')">
      <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { ElSelect, ElOption } from 'element-plus';

const DEFAULT_VERSION = '6.0';

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
          value: '6.1',
          label: '6.1'
        },
        {
          value: '6.0',
          label: '6.0'
        },
        {
          value: '5.2',
          label: '5.2'
        },
        {
          value: '5.1',
          label: '5.1'
        },
        {
          value: '5.0',
          label: '5'
        },
        {
          value: '4',
          label: '4'
        },
        {
          value: '3',
          label: '3'
        },
        {
          value: '2',
          label: '2'
        },
        {
          value: '1',
          label: '1'
        }
      ]
    };
  },
  computed: {
    value: {
      get() {
        return this.$store.state.midjourney.preset?.version;
      },
      set(val) {
        console.debug('set version', val);
        this.$store.commit('midjourney/setPreset', {
          ...this.$store.state.midjourney.preset,
          version: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = DEFAULT_VERSION;
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
