<template>
  <div class="field">
    <div class="control">
      <h2 class="title font-bold">{{ $t('sora.name.size') }}</h2>
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
import { SORA_ALLOWED_SIZES, SORA_DEFAULT_MODEL, SORA_DEFAULT_SIZE, SORA_MODEL_PRO } from '@/constants';

const formatSizeLabel = (value: string): string => {
  if (!value) {
    return value;
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
};

export default defineComponent({
  name: 'SizeSelector',
  components: {
    ElSelect,
    ElOption
  },
  data() {
    return {
      options: SORA_ALLOWED_SIZES.map((size) => ({
        value: size,
        label: formatSizeLabel(size)
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
    optionsForModel(): Array<{ value: string; label: string }> {
      if (this.isLocked) {
        return this.options.filter((option) => option.value === SORA_DEFAULT_SIZE);
      }
      return this.options;
    },
    value: {
      get(): string | undefined {
        return this.$store.state.sora?.config?.size;
      },
      set(val: string | undefined) {
        const currentConfig = this.$store.state.sora?.config || {};
        this.$store.commit('sora/setConfig', {
          ...currentConfig,
          size: val
        });
      }
    }
  },
  watch: {
    isLocked(newValue: boolean) {
      if (newValue && this.value !== SORA_DEFAULT_SIZE) {
        this.value = SORA_DEFAULT_SIZE;
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = SORA_DEFAULT_SIZE;
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
