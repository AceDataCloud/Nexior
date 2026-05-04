<template>
  <div class="field">
    <h2 class="title font-bold">{{ $t('veo.name.motionType') }}</h2>
    <el-select v-model="value" class="value" :placeholder="$t('veo.placeholder.select')" filterable>
      <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSelect, ElOption } from 'element-plus';
import { VEO_DEFAULT_MOTION_TYPE, VEO_MOTION_TYPES } from '@/constants';

export default defineComponent({
  name: 'MotionTypeSelector',
  components: { ElSelect, ElOption },
  computed: {
    options() {
      return VEO_MOTION_TYPES.map((v) => ({ value: v, label: v }));
    },
    value: {
      get() {
        return this.$store.state.veo?.config?.motion_type;
      },
      set(val: string) {
        this.$store.commit('veo/setConfig', {
          ...this.$store.state.veo.config,
          motion_type: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = VEO_DEFAULT_MOTION_TYPE;
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
