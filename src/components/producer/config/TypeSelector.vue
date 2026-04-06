<template>
  <div>
    <!-- Custom Mode Toggle -->
    <div class="flex items-center justify-between mb-3">
      <span class="text-sm font-bold">{{ $t('producer.name.type') }}</span>
      <el-switch v-model="custom" />
    </div>

    <!-- Model Selection -->
    <div class="mb-3">
      <div class="flex items-center mb-1">
        <span class="text-sm font-bold">{{ $t('producer.name.model') }}</span>
      </div>
      <el-select v-model="model" class="w-full" size="default" :placeholder="$t('producer.placeholder.select')">
        <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value">
          <div class="flex items-center justify-between w-full">
            <span>{{ item.label }}</span>
            <span class="text-xs text-[var(--el-text-color-placeholder)]">{{ item.info }}</span>
          </div>
        </el-option>
      </el-select>
    </div>

    <!-- Song Description / Instrumental Toggle -->
    <div v-if="custom" class="flex items-center justify-between mb-3">
      <span class="text-sm font-bold">{{ $t('producer.name.instrumental') }}</span>
      <el-switch v-model="instrumental" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSelect, ElOption, ElSwitch } from 'element-plus';
import { PRODUCER_DEFAULT_MODEL } from '@/constants';

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
          label: 'FUZZ-2.0 Pro',
          value: 'FUZZ-2.0 Pro',
          info: '8 min'
        },
        {
          label: 'FUZZ-2.0',
          value: 'FUZZ-2.0',
          info: '8 min'
        },
        {
          label: 'FUZZ-2.0 Raw',
          value: 'FUZZ-2.0 Raw',
          info: '8 min'
        },
        {
          label: 'FUZZ-1.1 Pro',
          value: 'FUZZ-1.1 Pro',
          info: '4 min'
        },
        {
          label: 'FUZZ-1.0 Pro',
          value: 'FUZZ-1.0 Pro',
          info: '4 min'
        },
        {
          label: 'FUZZ-1.1',
          value: 'FUZZ-1.1',
          info: '4 min'
        },
        {
          label: 'FUZZ-1.0',
          value: 'FUZZ-1.0',
          info: '2 min'
        },
        {
          label: 'FUZZ-0.8',
          value: 'FUZZ-0.8',
          info: '2 min'
        }
      ]
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
