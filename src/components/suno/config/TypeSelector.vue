<template>
  <div>
    <!-- Custom Mode Toggle -->
    <div class="flex items-center justify-between mb-3">
      <span class="text-sm font-bold">{{ $t('suno.name.type') }}</span>
      <el-switch v-model="custom" size="small" />
    </div>

    <!-- Model Selection -->
    <div class="mb-3">
      <div class="flex items-center mb-1">
        <span class="text-sm font-bold">{{ $t('suno.name.model') }}</span>
      </div>
      <el-select v-model="model" class="w-full" size="default" :placeholder="$t('suno.placeholder.select')">
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
      <span class="text-sm font-bold">{{ $t('suno.name.instrumental') }}</span>
      <el-switch v-model="instrumental" size="small" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSelect, ElOption, ElSwitch } from 'element-plus';
import { SUNO_DEFAULT_MODEL } from '@/constants';

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
          label: 'Suno v5.5',
          value: 'chirp-v5-5',
          info: '8 min'
        },
        {
          label: 'Suno v5',
          value: 'chirp-v5',
          info: '8 min'
        },
        {
          label: 'Suno v4.5+',
          value: 'chirp-v4-5-plus',
          info: '8 min'
        },
        {
          label: 'Suno v4.5',
          value: 'chirp-v4-5',
          info: '4 min'
        },
        {
          label: 'Suno v4',
          value: 'chirp-v4',
          info: '2.5 min'
        },
        {
          label: 'Suno v3.5',
          value: 'chirp-v3-5',
          info: '2 min'
        },
        {
          label: 'Suno v3',
          value: 'chirp-v3-0',
          info: '2 min'
        }
      ]
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
