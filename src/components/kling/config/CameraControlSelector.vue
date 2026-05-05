<template>
  <div class="field">
    <div class="header">
      <span class="text-sm font-bold">{{ $t('kling.name.cameraControl') }}</span>
      <info-icon :content="tooltipContent" />
    </div>
    <el-select
      v-model="selectedTypeRaw"
      class="value"
      :placeholder="$t('kling.placeholder.cameraType')"
      :clearable="true"
      :disabled="disabled"
    >
      <el-option v-for="item in typeOptions" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
    <div v-if="selectedType === 'simple' && !disabled" class="config-grid">
      <div v-for="key in configKeys" :key="key" class="cfg-row">
        <div class="cfg-row-head">
          <span class="cfg-name">{{ $t(`kling.name.cc_${key}`) }}</span>
          <el-input-number
            v-model="configValues[key]"
            :min="-1"
            :max="1"
            :step="0.1"
            :precision="1"
            controls-position="right"
            size="small"
            class="cfg-num"
            @change="onNumberChange(key, $event)"
          />
        </div>
        <el-slider
          :model-value="configValues[key] ?? 0"
          :min="-1"
          :max="1"
          :step="0.1"
          @input="onSliderChange(key, $event as number)"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSelect, ElOption, ElSlider, ElInputNumber } from 'element-plus';
import InfoIcon from '@/components/common/InfoIcon.vue';
import { IKlingCameraType, IKlingCameraControlConfig } from '@/models';
import { getKlingCapabilities } from '@/utils/kling/capabilities';

const CONFIG_KEYS: (keyof IKlingCameraControlConfig)[] = ['horizontal', 'vertical', 'pan', 'tilt', 'roll', 'zoom'];

interface IData {
  configKeys: (keyof IKlingCameraControlConfig)[];
}

export default defineComponent({
  name: 'CameraControlSelector',
  components: {
    ElSelect,
    ElOption,
    ElSlider,
    ElInputNumber,
    InfoIcon
  },
  data(): IData {
    return {
      configKeys: CONFIG_KEYS
    };
  },
  computed: {
    typeOptions() {
      return [
        { value: '', label: this.$t('kling.name.cameraTypeNone') },
        { value: 'simple', label: this.$t('kling.name.cameraTypeSimple') },
        { value: 'down_back', label: this.$t('kling.name.cameraTypeDownBack') },
        { value: 'forward_up', label: this.$t('kling.name.cameraTypeForwardUp') },
        { value: 'left_turn_forward', label: this.$t('kling.name.cameraTypeLeftTurnForward') },
        { value: 'right_turn_forward', label: this.$t('kling.name.cameraTypeRightTurnForward') }
      ];
    },
    selectedMode(): string {
      return this.$store.state.kling?.config?.mode || '';
    },
    selectedModel(): string {
      return this.$store.state.kling?.config?.model || '';
    },
    selectedDuration(): number | undefined {
      return this.$store.state.kling?.config?.duration;
    },
    motionControlSupported(): boolean {
      // Per the official Kling matrix, motion control is allowed only on a
      // narrow subset of (model, mode, duration) combos — not just non-4k.
      // E.g. v1-6 / v2-6 / v3-omni / video-o1 never support it; v1 only at 5s;
      // v3 only outside 4k mode.
      return getKlingCapabilities(this.selectedModel, this.selectedMode, this.selectedDuration).motionControl;
    },
    hasStartImage(): boolean {
      return Boolean(this.$store.state.kling?.config?.start_image_url);
    },
    disabled(): boolean {
      // image2video (start_image_url set) is rejected by the upstream worker
      // regardless of model/mode.
      return !this.motionControlSupported || this.hasStartImage;
    },
    tooltipContent(): string {
      if (!this.motionControlSupported) {
        // Single message regardless of why (4k mode, omni model, v1 at 10s,
        // v1-6/v2-6 any mode, etc.) — saying "switch to std/pro" only helps
        // for kling-v3 4k and would mislead users on every other case.
        return this.$t('kling.description.cameraControlNotSupported');
      }
      if (this.hasStartImage) {
        return this.$t('kling.description.cameraControlDisabledImage2Video');
      }
      return this.$t('kling.description.cameraControl');
    },
    selectedType(): IKlingCameraType | undefined {
      return this.$store.state.kling?.config?.camera_control?.type;
    },
    selectedTypeRaw: {
      get(): string {
        return this.selectedType ?? '';
      },
      set(val: string) {
        const cfg = this.$store.state.kling?.config || {};
        if (!val) {
          // Clear camera_control entirely
          const next = { ...cfg };
          delete next.camera_control;
          this.$store.commit('kling/setConfig', next);
          return;
        }
        const typed = val as IKlingCameraType;
        this.$store.commit('kling/setConfig', {
          ...cfg,
          camera_control: {
            type: typed,
            // Only 'simple' carries a config block; presets ignore numeric values.
            config: typed === 'simple' ? cfg.camera_control?.config || {} : undefined
          }
        });
      }
    },
    configValues(): IKlingCameraControlConfig {
      return this.$store.state.kling?.config?.camera_control?.config || {};
    }
  },
  watch: {
    disabled(now: boolean) {
      // Auto-clear camera_control when the current (model, mode, duration) combo
      // no longer supports motion control, or when the user uploads a start
      // image (image2video), so the request stays valid.
      if (now && this.selectedType !== undefined) {
        this.selectedTypeRaw = '';
      }
    }
  },
  methods: {
    writeConfig(key: keyof IKlingCameraControlConfig, val: number | undefined) {
      const cfg = this.$store.state.kling?.config || {};
      const cc = cfg.camera_control || { type: 'simple' };
      const nextConfig: IKlingCameraControlConfig = { ...(cc.config || {}) };
      if (val === undefined || val === null) {
        delete nextConfig[key];
      } else {
        nextConfig[key] = val;
      }
      this.$store.commit('kling/setConfig', {
        ...cfg,
        camera_control: {
          ...cc,
          type: 'simple',
          config: nextConfig
        }
      });
    },
    onSliderChange(key: keyof IKlingCameraControlConfig, val: number) {
      this.writeConfig(key, val);
    },
    onNumberChange(key: keyof IKlingCameraControlConfig, val: number | undefined) {
      this.writeConfig(key, val);
    }
  }
});
</script>

<style lang="scss" scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: 8px;

  .header {
    display: flex;
    flex-direction: row;
    align-items: center;
  }
  .value {
    width: 100%;
  }
}
.config-grid {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  border-radius: 8px;
  background-color: var(--el-fill-color-lighter);

  .cfg-row {
    display: flex;
    flex-direction: column;
    gap: 0;

    .cfg-row-head {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;

      .cfg-name {
        font-size: 12px;
        color: var(--el-text-color-regular);
      }
      .cfg-num {
        width: 100px;
      }
    }
  }
}
</style>
