<template>
  <div class="field">
    <div class="flex items-center justify-between mb-2">
      <div class="flex items-center">
        <span class="text-sm font-bold">{{ $t('suno.customModel.name') }}</span>
        <info-icon :content="$t('suno.customModel.description')" />
      </div>
      <el-button size="small" round @click="showManager = true">
        <music-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
        {{ $t('suno.customModel.manage') }}
      </el-button>
    </div>
    <el-select
      v-model="customModelId"
      :placeholder="$t('suno.customModel.placeholder')"
      clearable
      filterable
      class="w-full"
    >
      <el-option v-for="model in readyModels" :key="model.id" :value="model.id" :label="model.name" />
    </el-select>
    <el-drawer v-model="showManager" :title="$t('suno.customModel.title')" size="420px" direction="rtl">
      <custom-model-manager @selected="showManager = false" />
    </el-drawer>
  </div>
</template>

<script lang="ts">
import { MusicIcon } from '@acedatacloud/core/icons/components';
import { defineComponent } from 'vue';
import { ElButton, ElDrawer, ElOption, ElSelect } from 'element-plus';
import InfoIcon from '@/components/common/InfoIcon.vue';
import CustomModelManager from '@/components/suno/model/CustomModelManager.vue';
import { ISunoCustomModel } from '@/models';

export default defineComponent({
  name: 'CustomModelInput',
  components: { CustomModelManager, ElButton, ElDrawer, ElOption, ElSelect, InfoIcon, MusicIcon },
  data() {
    return { showManager: false };
  },
  computed: {
    customModelId: {
      get(): string {
        return this.$store.state.suno?.config?.custom_model_id || '';
      },
      set(value: string) {
        this.$store.commit('suno/setConfig', {
          ...this.$store.state.suno?.config,
          custom_model_id: value || undefined,
          persona_id: value ? undefined : this.$store.state.suno?.config?.persona_id
        });
      }
    },
    readyModels(): ISunoCustomModel[] {
      return (this.$store.state.suno?.customModels || []).filter((model: ISunoCustomModel) => model.status === 'ready');
    }
  },
  watch: {
    '$store.state.suno.credential': {
      handler() {
        if (this.$store.state.suno?.credential?.token) this.$store.dispatch('suno/getCustomModels');
      },
      immediate: true
    }
  }
});
</script>
