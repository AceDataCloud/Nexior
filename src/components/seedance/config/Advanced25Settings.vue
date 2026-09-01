<template>
  <div v-if="visible" class="space-y-4">
    <div class="field">
      <div class="label">
        <h2 class="title font-bold">{{ $t('seedance.name.taskType') }}</h2>
        <info-icon :content="$t('seedance.description.taskType')" class="info" />
      </div>
      <el-select v-model="taskType" class="value">
        <el-option value="auto" :label="$t('seedance.taskType.auto')" />
        <el-option value="reference" :label="$t('seedance.taskType.reference')" />
        <el-option value="edit" :label="$t('seedance.taskType.edit')" />
        <el-option value="extend" :label="$t('seedance.taskType.extend')" />
      </el-select>
    </div>
    <div class="field">
      <div class="label">
        <h2 class="title font-bold">{{ $t('seedance.name.outputFormat') }}</h2>
      </div>
      <el-select v-model="outputFormat" class="value">
        <el-option value="mp4" label="MP4" />
        <el-option value="mov" label="MOV" />
      </el-select>
    </div>
    <div class="field">
      <div class="label">
        <h2 class="title font-bold">{{ $t('seedance.name.webSearch') }}</h2>
        <info-icon :content="$t('seedance.description.webSearch')" class="info" />
      </div>
      <el-switch v-model="webSearch" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElOption, ElSelect, ElSwitch } from 'element-plus';
import InfoIcon from '@/components/common/InfoIcon.vue';
import { SEEDANCE_MODEL_2_5 } from '@/constants';
import type { SeedanceOutputFormat, SeedanceTaskType } from '@/models';

export default defineComponent({
  name: 'SeedanceAdvanced25Settings',
  components: { ElOption, ElSelect, ElSwitch, InfoIcon },
  computed: {
    visible(): boolean {
      return this.$store.state.seedance?.config?.model === SEEDANCE_MODEL_2_5;
    },
    taskType: {
      get(): SeedanceTaskType {
        return this.$store.state.seedance?.config?.omni_reference_task_type || 'auto';
      },
      set(value: SeedanceTaskType) {
        this.updateConfig({ omni_reference_task_type: value });
      }
    },
    outputFormat: {
      get(): SeedanceOutputFormat {
        return this.$store.state.seedance?.config?.output_format || 'mp4';
      },
      set(value: SeedanceOutputFormat) {
        this.updateConfig({ output_format: value });
      }
    },
    webSearch: {
      get(): boolean {
        return this.$store.state.seedance?.config?.web_search === true;
      },
      set(value: boolean) {
        this.updateConfig({ web_search: value });
      }
    }
  },
  methods: {
    updateConfig(patch: Record<string, unknown>) {
      this.$store.commit('seedance/setConfig', {
        ...this.$store.state.seedance?.config,
        ...patch
      });
    }
  }
});
</script>

<style lang="scss" scoped>
.field {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.label {
  display: flex;
  width: 45%;
  align-items: center;
}
.title {
  margin: 0;
  font-size: 14px;
}
.info {
  margin-left: 6px;
}
.value {
  width: 160px;
}
</style>
