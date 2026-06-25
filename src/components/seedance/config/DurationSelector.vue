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
import { getSeedanceCapability, SEEDANCE_DEFAULT_DURATION } from '@/constants';

export default defineComponent({
  name: 'SeedanceDurationSelector',
  components: {
    ElSelect,
    ElOption,
    InfoIcon
  },
  computed: {
    model(): string | undefined {
      return this.$store.state.seedance?.config?.model;
    },
    capability() {
      return getSeedanceCapability(this.model);
    },
    options(): { value: number; label: string }[] {
      const items: { value: number; label: string }[] = [];
      for (let s = this.capability.minDuration; s <= this.capability.maxDuration; s++) {
        items.push({ value: s, label: `${s}s` });
      }
      return items;
    },
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
  watch: {
    model() {
      this.clampValue();
    }
  },
  mounted() {
    if (!this.value) {
      this.value = SEEDANCE_DEFAULT_DURATION;
    } else {
      this.clampValue();
    }
  },
  methods: {
    clampValue() {
      const current = this.value;
      if (current !== undefined && (current < this.capability.minDuration || current > this.capability.maxDuration)) {
        this.value = SEEDANCE_DEFAULT_DURATION;
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
    width: 80px;
  }
}
</style>
