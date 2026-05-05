<template>
  <div>
    <!-- Model Selection -->
    <div class="mb-3">
      <div class="flex items-center mb-1">
        <span class="text-sm font-bold">{{ $t('producer.name.model') }}</span>
      </div>
      <el-select
        v-model="model"
        class="w-full model-select"
        size="default"
        :placeholder="$t('producer.placeholder.select')"
      >
        <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value">
          <div class="model-option">
            <span class="model-option-name">{{ item.label }}</span>
            <span class="model-option-desc">{{ item.desc }}</span>
          </div>
        </el-option>
      </el-select>
    </div>

    <!-- Instrumental Toggle (custom mode only) -->
    <div v-if="custom" class="flex items-center justify-between mb-3">
      <div class="flex items-center">
        <span class="text-sm font-bold">{{ $t('producer.name.instrumental') }}</span>
        <info-icon :content="$t('producer.description.instrumental')" />
      </div>
      <el-switch v-model="instrumental" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSelect, ElOption, ElSwitch } from 'element-plus';
import InfoIcon from '@/components/common/InfoIcon.vue';
import { PRODUCER_DEFAULT_MODEL } from '@/constants';

interface ModelOption {
  label: string;
  value: string;
  desc: string;
}

export default defineComponent({
  name: 'TypeSelector',
  components: {
    ElSelect,
    ElOption,
    ElSwitch,
    InfoIcon
  },
  data() {
    return {
      options: [
        { label: 'FUZZ-2.0 Pro', value: 'FUZZ-2.0 Pro', desc: this.$t('producer.model.fuzz20proDesc') },
        { label: 'FUZZ-2.0', value: 'FUZZ-2.0', desc: this.$t('producer.model.fuzz20desc') },
        { label: 'FUZZ-2.0 Raw', value: 'FUZZ-2.0 Raw', desc: this.$t('producer.model.fuzz20rawDesc') },
        { label: 'FUZZ-1.1 Pro', value: 'FUZZ-1.1 Pro', desc: this.$t('producer.model.fuzz11proDesc') },
        { label: 'FUZZ-1.1', value: 'FUZZ-1.1', desc: this.$t('producer.model.fuzz11desc') },
        { label: 'FUZZ-1.0 Pro', value: 'FUZZ-1.0 Pro', desc: this.$t('producer.model.fuzz10proDesc') },
        { label: 'FUZZ-1.0', value: 'FUZZ-1.0', desc: this.$t('producer.model.fuzz10desc') },
        { label: 'FUZZ-0.8', value: 'FUZZ-0.8', desc: this.$t('producer.model.fuzz08desc') }
      ] as ModelOption[]
    };
  },
  computed: {
    custom: {
      get() {
        return this.$store.state.producer?.config?.custom || false;
      },
      set(val: boolean) {
        this.$store.commit('producer/setConfig', {
          ...this.$store.state.producer?.config,
          custom: val
        });
      }
    },
    instrumental: {
      get() {
        return this.$store.state.producer?.config?.instrumental || false;
      },
      set(val: boolean) {
        this.$store.commit('producer/setConfig', {
          ...this.$store.state.producer?.config,
          instrumental: val
        });
      }
    },
    model: {
      get() {
        return this.$store.state.producer?.config?.model;
      },
      set(val: string) {
        this.$store.commit('producer/setConfig', {
          ...this.$store.state.producer?.config,
          model: val
        });
      }
    }
  },
  mounted() {
    if (!this.model) {
      this.model = PRODUCER_DEFAULT_MODEL;
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

.model-option-name {
  font-weight: 500;
}

.model-option-desc {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  margin-left: 8px;
  white-space: nowrap;
}
</style>
