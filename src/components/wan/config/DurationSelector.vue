<template>
  <div class="field">
    <h2 class="title font-bold">{{ $t('wan.name.duration') }}</h2>
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

const DEFAULT_DURATION = 5;

export default defineComponent({
  name: 'DurationSelector',
  components: {
    ElSelect,
    ElOption
  },
  computed: {
    options() {
      return [
        {
          value: 5,
          label: this.$t('wan.name.duration5s')
        },
        {
          value: 10,
          label: this.$t('wan.name.duration10s')
        },
        {
          value: 15,
          label: this.$t('wan.name.duration15s')
        }
      ];
    },
    value: {
      get() {
        return this.$store.state.wan?.config?.duration;
      },
      set(val: number) {
        this.$store.commit('wan/setConfig', {
          ...this.$store.state.wan?.config,
          duration: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = DEFAULT_DURATION;
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
