<template>
  <div class="space-y-4">
    <div class="field">
      <span class="label">{{ $t('wan.name.ratio') }}</span
      ><el-select v-model="ratio"><el-option v-for="x in ratios" :key="x" :label="x" :value="x" /></el-select>
    </div>
    <div class="field">
      <span class="label">{{ $t('wan.name.duration') }}</span
      ><el-input-number v-model="duration" :min="-1" :max="30" />
    </div>
    <el-checkbox v-model="audio">{{ $t('wan.name.audio') }}</el-checkbox>
  </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue';
import { ElSelect, ElOption, ElInputNumber, ElCheckbox } from 'element-plus';
export default defineComponent({
  name: 'Wan3Options',
  components: { ElSelect, ElOption, ElInputNumber, ElCheckbox },
  data: () => ({ ratios: ['adaptive', '16:9', '4:3', '1:1', '3:4', '9:16'] }),
  computed: {
    ratio: {
      get(): string {
        return this.$store.state.wan?.config?.ratio || 'adaptive';
      },
      set(ratio: string) {
        this.set({ ratio });
      }
    },
    duration: {
      get(): number {
        return this.$store.state.wan?.config?.duration ?? 5;
      },
      set(duration: number) {
        this.set({ duration });
      }
    },
    audio: {
      get(): boolean {
        return this.$store.state.wan?.config?.audio !== false;
      },
      set(audio: boolean) {
        this.set({ audio });
      }
    }
  },
  methods: {
    set(value: object) {
      this.$store.commit('wan/setConfig', { ...this.$store.state.wan?.config, ...value });
    }
  }
});
</script>
<style scoped>
.field {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.label {
  font-size: 14px;
  font-weight: 700;
}
</style>
