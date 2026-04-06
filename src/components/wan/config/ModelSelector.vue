<template>
  <div class="field">
    <h2 class="title font-bold">{{ $t('wan.name.model') }}</h2>
    <el-select v-model="value" class="value" :placeholder="$t('wan.placeholder.select')" clearable>
      <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value">
        <span class="float-left">{{ item.label }}</span>
      </el-option>
    </el-select>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSelect, ElOption } from 'element-plus';
import { WAN_DEFAULT_MODEL } from '@/constants';

export default defineComponent({
  name: 'ModelSelector',
  components: {
    ElSelect,
    ElOption
  },
  data() {
    return {};
  },
  computed: {
    options() {
      return [
        {
          value: 'wan2.6-t2v',
          label: this.$t('wan.button.modelT2v')
        },
        {
          value: 'wan2.6-i2v',
          label: this.$t('wan.button.modelI2v')
        },
        {
          value: 'wan2.6-i2v-flash',
          label: this.$t('wan.button.modelI2vFlash')
        },
        {
          value: 'wan2.6-r2v',
          label: this.$t('wan.button.modelR2v')
        }
      ];
    },
    value: {
      get() {
        return this.$store.state.wan?.config?.model;
      },
      set(val: string) {
        this.$store.commit('wan/setConfig', {
          ...this.$store.state.wan?.config,
          model: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = WAN_DEFAULT_MODEL;
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
