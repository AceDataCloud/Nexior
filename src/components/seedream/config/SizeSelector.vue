<template>
  <div class="field">
    <div class="label">
      <div class="box">
        <h2 class="title font-bold">{{ $t('seedream.name.size') }}</h2>
        <info-icon :content="$t('seedream.description.size')" class="info" />
      </div>
    </div>
    <el-select
      v-model="value"
      class="value"
      :placeholder="$t('seedream.placeholder.size')"
      filterable
      allow-create
      default-first-option
    >
      <el-option-group v-if="capabilities.sizeTiers.length" :label="$t('seedream.size.group.tier')">
        <el-option v-for="item in capabilities.sizeTiers" :key="item" :label="item" :value="item" />
      </el-option-group>
      <el-option-group v-if="capabilities.sizeAdaptive" :label="$t('seedream.size.group.adaptive')">
        <el-option
          :key="SEEDREAM_SIZE_ADAPTIVE"
          :label="$t('seedream.size.adaptive')"
          :value="SEEDREAM_SIZE_ADAPTIVE"
        />
      </el-option-group>
      <el-option-group :label="$t('seedream.size.group.pixel')">
        <el-option
          v-for="item in pixelOptions"
          :key="item.value"
          :label="`${item.value} (${item.ratio})`"
          :value="item.value"
        />
      </el-option-group>
    </el-select>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSelect, ElOption, ElOptionGroup } from 'element-plus';
import InfoIcon from '@/components/common/InfoIcon.vue';
import { SEEDREAM_DEFAULT_SIZE, SEEDREAM_PIXEL_PRESETS, SEEDREAM_SIZE_ADAPTIVE } from '@/constants';
import { getSeedreamCapabilities, ISeedreamCapability } from '@/utils/seedream/capabilities';

export default defineComponent({
  name: 'SeedreamSizeSelector',
  components: {
    ElSelect,
    ElOption,
    ElOptionGroup,
    InfoIcon
  },
  data() {
    return {
      SEEDREAM_SIZE_ADAPTIVE,
      pixelOptions: SEEDREAM_PIXEL_PRESETS
    };
  },
  computed: {
    model(): string | undefined {
      return this.$store.state.seedream?.config?.model;
    },
    capabilities(): ISeedreamCapability {
      return getSeedreamCapabilities(this.model);
    },
    value: {
      get(): string | undefined {
        return this.$store.state.seedream?.config?.size;
      },
      set(val: string) {
        this.$store.commit('seedream/setConfig', {
          ...this.$store.state.seedream?.config,
          size: val
        });
      }
    }
  },
  watch: {
    // Seed a sensible default when the size is unset (initial load, or after
    // ModelSelector cleared it as part of a conflict-resolution flow). Real
    // model-switch clamping is owned by ModelSelector via findSeedreamConflicts.
    model: {
      immediate: true,
      handler() {
        if (this.value) return;
        const caps = this.capabilities;
        if (caps.sizeTiers.length) {
          this.value = caps.sizeTiers.includes(SEEDREAM_DEFAULT_SIZE) ? SEEDREAM_DEFAULT_SIZE : caps.sizeTiers[0];
        } else if (caps.sizePixelDefault) {
          this.value = caps.sizePixelDefault;
        }
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
    width: 200px;
  }
}
</style>
