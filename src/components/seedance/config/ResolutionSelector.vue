<template>
  <div class="field">
    <div class="label">
      <div class="box">
        <h2 class="title font-bold">{{ $t('seedance.name.resolution') }}</h2>
        <info-icon :content="$t('seedance.description.resolution')" class="info" />
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
import {
  SEEDANCE_DEFAULT_RESOLUTION,
  SEEDANCE_RESOLUTION_480P,
  SEEDANCE_RESOLUTION_720P,
  SEEDANCE_RESOLUTION_1080P
} from '@/constants';

export default defineComponent({
  name: 'SeedanceResolutionSelector',
  components: {
    ElSelect,
    ElOption,
    InfoIcon
  },
  data() {
    return {
      options: [
        { value: SEEDANCE_RESOLUTION_480P, label: '480p' },
        { value: SEEDANCE_RESOLUTION_720P, label: '720p' },
        { value: SEEDANCE_RESOLUTION_1080P, label: '1080p' }
      ]
    };
  },
  computed: {
    value: {
      get(): string | undefined {
        return this.$store.state.seedance?.config?.resolution;
      },
      set(val: string) {
        this.$store.commit('seedance/setConfig', {
          ...this.$store.state.seedance?.config,
          resolution: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = SEEDANCE_DEFAULT_RESOLUTION;
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
    width: 110px;
  }
}
</style>
