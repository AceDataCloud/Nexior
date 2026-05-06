<template>
  <div>
    <!-- Model Selection -->
    <div class="mb-3">
      <div class="flex items-center mb-1">
        <span class="text-sm font-bold">{{ $t('suno.name.model') }}</span>
      </div>
      <el-select
        v-model="model"
        class="w-full model-select"
        size="default"
        :placeholder="$t('suno.placeholder.select')"
      >
        <el-option
          v-for="item in options"
          :key="item.value"
          :label="item.label"
          :value="item.value"
          :class="{ 'model-option-divider': item.dividerAfter }"
        >
          <div class="model-option">
            <div class="model-option-left">
              <span class="model-option-name">{{ item.label }}</span>
            </div>
            <span class="model-option-desc">{{ item.desc }}</span>
          </div>
        </el-option>
      </el-select>
    </div>

    <!-- Instrumental Toggle (custom mode only) -->
    <div v-if="custom" class="flex items-center justify-between mb-3">
      <span class="text-sm font-bold">{{ $t('suno.name.instrumental') }}</span>
      <el-switch v-model="instrumental" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSelect, ElOption, ElSwitch } from 'element-plus';
import { SUNO_DEFAULT_MODEL } from '@/constants';

interface ModelOption {
  label: string;
  value: string;
  desc: string;
  dividerAfter?: boolean;
}

export default defineComponent({
  name: 'TypeSelector',
  components: {
    ElSelect,
    ElOption,
    ElSwitch
  },
  data() {
    return {
      options: [
        {
          label: 'v5.5',
          value: 'chirp-v5-5',
          desc: this.$t('suno.model.v55desc')
        },
        {
          label: 'v5',
          value: 'chirp-v5',
          desc: this.$t('suno.model.v5desc')
        },
        {
          label: 'v4.5+',
          value: 'chirp-v4-5-plus',
          desc: this.$t('suno.model.v45plusdesc')
        },
        {
          label: 'v4.5',
          value: 'chirp-v4-5',
          desc: this.$t('suno.model.v45desc'),
          dividerAfter: true
        },
        {
          label: 'v4',
          value: 'chirp-v4',
          desc: this.$t('suno.model.v4desc')
        },
        {
          label: 'v3.5',
          value: 'chirp-v3-5',
          desc: this.$t('suno.model.v35desc')
        },
        {
          label: 'v3',
          value: 'chirp-v3-0',
          desc: this.$t('suno.model.v3desc')
        }
      ] as ModelOption[]
    };
  },
  computed: {
    custom: {
      get() {
        return this.$store.state.suno?.config?.custom || false;
      },
      set(val: boolean) {
        this.$store.commit('suno/setConfig', {
          ...this.$store.state.suno?.config,
          custom: val
        });
      }
    },
    instrumental: {
      get() {
        return this.$store.state.suno?.config?.instrumental || false;
      },
      set(val: boolean) {
        this.$store.commit('suno/setConfig', {
          ...this.$store.state.suno?.config,
          instrumental: val
        });
      }
    },
    model: {
      get() {
        return this.$store.state.suno?.config?.model;
      },
      set(val: string) {
        this.$store.commit('suno/setConfig', {
          ...this.$store.state.suno?.config,
          model: val
        });
      }
    }
  },
  mounted() {
    if (!this.model) {
      this.model = SUNO_DEFAULT_MODEL;
    }
  }
});
</script>

<style lang="scss" scoped>
.model-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 2px 0;
}

.model-option-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.model-option-name {
  font-weight: 500;
}

.model-option-desc {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  margin-left: 8px;
  white-space: nowrap;
}

:deep(.model-option-divider) {
  border-bottom: 1px solid var(--el-border-color-lighter);
  margin-bottom: 4px;
  padding-bottom: 4px;
}
</style>
