<template>
  <div class="field">
    <div class="label">
      <div class="box">
        <h2 class="title font-bold">{{ $t('seedance.name.watermark') }}</h2>
        <info-icon :content="$t('seedance.description.watermark')" class="info" />
      </div>
    </div>
    <div class="value">
      <el-switch
        v-model="value"
        inline-prompt
        :active-text="$t('seedance.button.on')"
        :inactive-text="$t('seedance.button.off')"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSwitch } from 'element-plus';
import InfoIcon from '@/components/common/InfoIcon.vue';
import { SEEDANCE_DEFAULT_WATERMARK } from '@/constants';

export default defineComponent({
  name: 'SeedanceWatermarkSwitch',
  components: {
    ElSwitch,
    InfoIcon
  },
  computed: {
    value: {
      get(): boolean {
        return this.$store.state.seedance?.config?.watermark ?? false;
      },
      set(val: boolean) {
        this.$store.commit('seedance/setConfig', {
          ...this.$store.state.seedance?.config,
          watermark: val
        });
      }
    }
  },
  mounted() {
    if (this.$store.state.seedance?.config?.watermark === undefined) {
      this.value = SEEDANCE_DEFAULT_WATERMARK;
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
    width: 70%;
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
    flex: 1;
    display: flex;
    justify-content: flex-end;
  }
}
</style>
