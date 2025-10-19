<template>
  <div class="field">
    <div class="control">
      <h2 class="title font-bold">{{ $t('sora.name.duration') }}</h2>
      <el-select v-model="value" class="value" :placeholder="$t('sora.placeholder.select')" :disabled="isLocked">
        <el-option v-for="item in optionsForModel" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </div>
    <p v-if="isLocked" class="hint">{{ $t('sora.tip.proOnly') }}</p>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSelect, ElOption } from 'element-plus';
import { SORA_ALLOWED_DURATIONS, SORA_DEFAULT_DURATION, SORA_DEFAULT_MODEL, SORA_MODEL_PRO } from '@/constants';

export default defineComponent({
  name: 'DurationSelector',
  components: {
    ElSelect,
    ElOption
  },
  data() {
    return {
      options: SORA_ALLOWED_DURATIONS.map((duration) => ({
        value: duration,
        label: `${duration}s`
      }))
    };
  },
  computed: {
    model(): string {
      return this.$store.state.sora?.config?.model || SORA_DEFAULT_MODEL;
    },
    isLocked(): boolean {
      return this.model !== SORA_MODEL_PRO;
    },
    optionsForModel(): Array<{ value: number; label: string }> {
      if (this.isLocked) {
        return this.options.filter((option) => option.value === SORA_DEFAULT_DURATION);
      }
      return this.options;
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
    isLocked(newValue: boolean) {
      if (newValue && this.value !== SORA_DEFAULT_DURATION) {
        this.value = SORA_DEFAULT_DURATION;
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

.hint {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
