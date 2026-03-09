<template>
  <div v-if="isSupported" class="field">
    <div class="label">
      <div class="box">
        <h2 class="title font-bold">{{ $t('seedance.name.generateAudio') }}</h2>
        <info-icon :content="$t('seedance.description.generateAudio')" class="info" />
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
import { SEEDANCE_DEFAULT_GENERATE_AUDIO, SEEDANCE_MODEL_1_5_PRO } from '@/constants';

export default defineComponent({
  name: 'SeedanceGenerateAudioSwitch',
  components: {
    ElSwitch,
    InfoIcon
  },
  computed: {
    isSupported(): boolean {
      return this.$store.state.seedance?.config?.model === SEEDANCE_MODEL_1_5_PRO;
    },
    value: {
      get(): boolean {
        return this.$store.state.seedance?.config?.generate_audio ?? false;
      },
      set(val: boolean) {
        this.$store.commit('seedance/setConfig', {
          ...this.$store.state.seedance?.config,
          generate_audio: val
        });
      }
    }
  },
  watch: {
    isSupported(supported: boolean) {
      if (!supported && this.value) {
        this.value = false;
      }
    }
  },
  mounted() {
    if (this.value === undefined) {
      this.value = SEEDANCE_DEFAULT_GENERATE_AUDIO;
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
}
</style>
