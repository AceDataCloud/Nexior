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
      :placeholder="$t('seedream.placeholder.select')"
      filterable
      allow-create
      default-first-option
    >
      <el-option-group :label="$t('seedream.size.group.tier')">
        <el-option v-for="item in tierOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-option-group>
      <el-option-group :label="$t('seedream.size.group.adaptive')">
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
import {
  SEEDREAM_DEFAULT_SIZE,
  SEEDREAM_PIXEL_PRESETS,
  SEEDREAM_SIZE_1K,
  SEEDREAM_SIZE_2K,
  SEEDREAM_SIZE_3K,
  SEEDREAM_SIZE_4K,
  SEEDREAM_SIZE_ADAPTIVE
} from '@/constants';

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
      tierOptions: [
        { value: SEEDREAM_SIZE_1K, label: SEEDREAM_SIZE_1K },
        { value: SEEDREAM_SIZE_2K, label: SEEDREAM_SIZE_2K },
        { value: SEEDREAM_SIZE_3K, label: SEEDREAM_SIZE_3K },
        { value: SEEDREAM_SIZE_4K, label: SEEDREAM_SIZE_4K }
      ],
      pixelOptions: SEEDREAM_PIXEL_PRESETS
    };
  },
  computed: {
    value: {
      get() {
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
  mounted() {
    if (!this.value) {
      this.value = SEEDREAM_DEFAULT_SIZE;
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
