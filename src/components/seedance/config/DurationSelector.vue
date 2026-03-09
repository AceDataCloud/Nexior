<template>
  <div class="field">
    <div class="label">
      <div class="box">
        <h2 class="title font-bold">{{ $t('seedance.name.duration') }}</h2>
        <info-icon :content="$t('seedance.description.duration')" class="info" />
      </div>
    </div>
    <el-select v-model="value" class="value" :placeholder="$t('seedance.placeholder.select')">
      <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSelect, ElOption } from 'element-plus';
import InfoIcon from '@/components/common/InfoIcon.vue';
import { SEEDANCE_DEFAULT_DURATION } from '@/constants';

export default defineComponent({
  name: 'SeedanceDurationSelector',
  components: {
    ElSelect,
    ElOption,
    InfoIcon
  },
  data() {
    return {
      options: [
        { value: 2, label: '2s' },
        { value: 3, label: '3s' },
        { value: 4, label: '4s' },
        { value: 5, label: '5s' },
        { value: 6, label: '6s' },
        { value: 7, label: '7s' },
        { value: 8, label: '8s' },
        { value: 9, label: '9s' },
        { value: 10, label: '10s' },
        { value: 11, label: '11s' },
        { value: 12, label: '12s' }
      ]
    };
  },
  computed: {
    value: {
      get(): number | undefined {
        return this.$store.state.seedance?.config?.duration;
      },
      set(val: number) {
        this.$store.commit('seedance/setConfig', {
          ...this.$store.state.seedance?.config,
          duration: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = SEEDANCE_DEFAULT_DURATION;
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

  .label {
    width: 30%;
    display: flex;
    align-items: center;

    .box {
      display: flex;
      flex-direction: row;
      align-items: center;

      .title {
        font-size: 14px;
        margin: 0;
      }

      .info {
        margin-left: 6px;
      }
    }
  }

  .value {
    width: 80px;
  }
}
</style>
