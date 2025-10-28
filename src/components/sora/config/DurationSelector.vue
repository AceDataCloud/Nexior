<template>
  <div class="field">
    <div class="control">
      <h2 class="title font-bold">{{ $t('sora.name.duration') }}</h2>
      <el-select v-model="value" class="value" :placeholder="$t('sora.placeholder.select')">
        <el-option v-for="item in optionsForModel" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSelect, ElOption } from 'element-plus';
import { SORA_ALLOWED_DURATIONS_BY_MODEL, SORA_DEFAULT_DURATION, SORA_DEFAULT_MODEL } from '@/constants';

export default defineComponent({
  name: 'DurationSelector',
  components: {
    ElSelect,
    ElOption
  },
  computed: {
    model(): string {
      return this.$store.state.sora?.config?.model || SORA_DEFAULT_MODEL;
    },
    allowedDurations(): number[] {
      return SORA_ALLOWED_DURATIONS_BY_MODEL[this.model] || [SORA_DEFAULT_DURATION];
    },
    optionsForModel(): Array<{ value: number; label: string }> {
      return this.allowedDurations.map((duration) => ({
        value: duration,
        label: `${duration}s`
      }));
    },
    value: {
      get(): number | undefined {
        return this.$store.state.sora?.config?.duration;
      },
      set(val: number | undefined) {
        const currentConfig = this.$store.state.sora?.config || {};
        this.$store.commit('sora/setConfig', {
          ...currentConfig,
          duration: val
        });
      }
    }
  },
  watch: {
    allowedDurations() {
      const durations = this.allowedDurations;
      if (!durations.includes(this.value as number)) {
        const fallback = durations.includes(SORA_DEFAULT_DURATION) ? SORA_DEFAULT_DURATION : durations[0];
        this.value = fallback;
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = SORA_DEFAULT_DURATION;
    }
  }
});
</script>

<style lang="scss" scoped>
.field {
  display: flex;
  flex-direction: column;
}

.control {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.title {
  font-size: 14px;
  margin: 0;
  width: 30%;
}

.value {
  width: 120px;
}
</style>
