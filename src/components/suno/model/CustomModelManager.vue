<template>
  <div>
    <div class="flex items-center justify-between mb-3">
      <span class="text-sm text-gray-500">{{ $t('suno.customModel.betaNotice') }}</span>
      <div class="flex gap-2">
        <el-button size="small" :loading="loading" @click="loadModels">{{ $t('common.button.refresh') }}</el-button>
        <el-button type="primary" size="small" @click="showCreate = true">
          <add-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
          {{ $t('suno.customModel.create') }}
        </el-button>
      </div>
    </div>
    <el-empty v-if="!loading && models.length === 0" :description="$t('suno.customModel.empty')" />
    <div v-else class="model-list">
      <div v-for="model in models" :key="model.id" class="model-item">
        <div class="flex-1 min-w-0">
          <div class="font-medium text-sm truncate">{{ model.name }}</div>
          <div class="text-xs text-gray-400 mt-1">
            {{ $t(`suno.customModel.status.${model.status}`) }} · {{ model.source_count }}
          </div>
          <el-progress
            v-if="model.status === 'uploading' && model.progress?.total"
            class="mt-2"
            :percentage="Math.round(((model.progress.uploaded || 0) / model.progress.total) * 100)"
            :show-text="false"
          />
        </div>
        <div class="flex gap-1 ml-2">
          <el-button v-if="model.status === 'ready'" size="small" text type="primary" @click="select(model)">
            {{ $t('suno.customModel.use') }}
          </el-button>
          <el-button size="small" text type="danger" :loading="archivingId === model.id" @click="archive(model)">
            {{ $t('suno.customModel.archive') }}
          </el-button>
        </div>
      </div>
    </div>
    <custom-model-create-dialog v-model="showCreate" @created="loadModels" />
  </div>
</template>

<script lang="ts">
import { AddIcon } from '@acedatacloud/core/icons/components';
import { defineComponent } from 'vue';
import { ElButton, ElEmpty, ElMessage, ElMessageBox, ElProgress } from 'element-plus';
import { ISunoCustomModel } from '@/models';
import CustomModelCreateDialog from './CustomModelCreateDialog.vue';

export default defineComponent({
  name: 'CustomModelManager',
  components: { AddIcon, CustomModelCreateDialog, ElButton, ElEmpty, ElProgress },
  emits: ['selected'],
  data() {
    return { loading: false, showCreate: false, archivingId: '' };
  },
  computed: {
    models(): ISunoCustomModel[] {
      return this.$store.state.suno?.customModels || [];
    }
  },
  mounted() {
    this.loadModels();
  },
  methods: {
    async loadModels() {
      this.loading = true;
      try {
        await this.$store.dispatch('suno/getCustomModels');
      } finally {
        this.loading = false;
      }
    },
    select(model: ISunoCustomModel) {
      this.$store.commit('suno/setConfig', {
        ...this.$store.state.suno?.config,
        custom_model_id: model.id,
        persona_id: undefined,
        custom: true
      });
      this.$emit('selected');
    },
    async archive(model: ISunoCustomModel) {
      try {
        await ElMessageBox.confirm(this.$t('suno.customModel.archiveConfirm'), this.$t('suno.customModel.archive'), {
          type: 'warning'
        });
      } catch {
        return;
      }
      this.archivingId = model.id;
      const success = await this.$store.dispatch('suno/archiveCustomModel', model.id);
      this.archivingId = '';
      if (success) {
        if (this.$store.state.suno?.config?.custom_model_id === model.id) {
          this.$store.commit('suno/setConfig', { ...this.$store.state.suno.config, custom_model_id: undefined });
        }
        ElMessage.success(this.$t('suno.customModel.archiveSuccess'));
      } else {
        ElMessage.error(this.$t('suno.customModel.archiveFailed'));
      }
    }
  }
});
</script>

<style scoped>
.model-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.model-item {
  display: flex;
  align-items: center;
  padding: 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}
</style>
