<template>
  <div v-if="isSupported" class="field">
    <div class="label">
      <div class="box">
        <h2 class="title font-bold">{{ $t('seedance.name.talking') }}</h2>
        <info-icon :content="$t('seedance.description.talking')" class="info" />
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
import { getSeedanceCapability } from '@/constants';
import { ISeedanceImageInput } from '@/models';

export default defineComponent({
  name: 'SeedanceTalkingModeSwitch',
  components: {
    ElSwitch,
    InfoIcon
  },
  computed: {
    // Talking-head (口播) rides the Seedance 2.0 r2v path, so only expose it for
    // models that accept a reference image.
    isSupported(): boolean {
      const model = this.$store.state.seedance?.config?.model;
      return getSeedanceCapability(model).acceptsReferenceImage;
    },
    value: {
      get(): boolean {
        return this.$store.state.seedance?.config?.talking ?? false;
      },
      set(val: boolean) {
        const config = { ...this.$store.state.seedance?.config, talking: val };
        // Turning talking ON steers uploads to the speech path: force audio and
        // remap any first/last-frame image to reference_image. Turning OFF leaves
        // other settings intact so it doesn't clobber a deliberate config.
        if (val) {
          config.generate_audio = true;
          const images = (config.images || []) as ISeedanceImageInput[];
          config.images = images.map((img) =>
            img?.role === 'first_frame' || img?.role === 'last_frame'
              ? { ...img, role: 'reference_image' as const }
              : img
          );
        }
        this.$store.commit('seedance/setConfig', config);
      }
    }
  },
  watch: {
    // immediate so a persisted talking:true on an unsupported model (e.g. an old
    // user whose local state loads 1.0 Pro) is cleared on mount, not just on a
    // later model change — otherwise the prompt guidance shows for a mode that
    // normalization silently ignores.
    isSupported: {
      handler(supported: boolean) {
        if (!supported && this.value) {
          this.value = false;
        }
      },
      immediate: true
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
