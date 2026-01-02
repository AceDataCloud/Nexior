<template>
  <div class="field">
    <div class="label">
      <div class="box">
        <h2 class="title font-bold">{{ $t('seedream.name.watermark') }}</h2>
        <info-icon :content="$t('seedream.description.watermark')" class="info" />
      </div>
    </div>
    <div class="value">
      <el-switch v-model="value" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSwitch } from 'element-plus';
import InfoIcon from '@/components/common/InfoIcon.vue';
import { SEEDREAM_DEFAULT_WATERMARK } from '@/constants';

export default defineComponent({
  name: 'SeedreamWatermarkSwitch',
  components: {
    ElSwitch,
    InfoIcon
  },
  computed: {
    value: {
      get(): boolean {
        const v = this.$store.state.seedream?.config?.watermark;
        return v === undefined ? SEEDREAM_DEFAULT_WATERMARK : !!v;
      },
      set(val: boolean) {
        this.$store.commit('seedream/setConfig', {
          ...this.$store.state.seedream?.config,
          watermark: val
        });
      }
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
    width: 160px;
    display: flex;
    justify-content: flex-end;
  }
}
</style>
