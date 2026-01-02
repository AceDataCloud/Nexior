<template>
  <div class="field">
    <div class="label">
      <div class="box">
        <h2 class="title font-bold">{{ $t('seedance.name.serviceTier') }}</h2>
        <info-icon :content="$t('seedance.description.serviceTier')" class="info" />
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
import { SEEDANCE_DEFAULT_SERVICE_TIER, SEEDANCE_SERVICE_TIER_DEFAULT, SEEDANCE_SERVICE_TIER_FLEX } from '@/constants';

export default defineComponent({
  name: 'SeedanceServiceTierSelector',
  components: {
    ElSelect,
    ElOption,
    InfoIcon
  },
  data() {
    return {
      options: [
        { value: SEEDANCE_SERVICE_TIER_DEFAULT, label: this.$t('seedance.serviceTier.default') },
        { value: SEEDANCE_SERVICE_TIER_FLEX, label: this.$t('seedance.serviceTier.flex') }
      ]
    };
  },
  computed: {
    value: {
      get() {
        return this.$store.state.seedance?.config?.service_tier;
      },
      set(val: string) {
        this.$store.commit('seedance/setConfig', {
          ...this.$store.state.seedance?.config,
          service_tier: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = SEEDANCE_DEFAULT_SERVICE_TIER;
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
  }
}
</style>

