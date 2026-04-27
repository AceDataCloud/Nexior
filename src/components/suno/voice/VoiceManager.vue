<template>
  <div class="voice-manager">
    <div class="flex items-center justify-between mb-3">
      <span class="text-sm font-medium">{{ $t('suno.voice.title') }}</span>
      <el-button type="primary" size="small" @click="showCreateDialog = true">
        <font-awesome-icon icon="fa-solid fa-plus" class="mr-1" />
        {{ $t('suno.voice.create') }}
      </el-button>
    </div>
    <div v-if="loading" class="text-center py-6">
      <el-icon class="is-loading"><loading /></el-icon>
    </div>
    <div v-else-if="!personas || personas.length === 0" class="text-center py-6 text-gray-400 text-sm">
      {{ $t('suno.voice.empty') }}
    </div>
    <div v-else class="voice-list">
      <div
        v-for="persona in personas"
        :key="persona.persona_id"
        class="voice-item"
        :class="{ active: selectedPersonaId === persona.persona_id }"
        @click="selectPersona(persona)"
      >
        <div class="flex-1 min-w-0">
          <div class="voice-name">
            <font-awesome-icon
              :icon="persona.source_type === 'voice' ? 'fa-solid fa-microphone' : 'fa-solid fa-music'"
              class="mr-1.5 text-xs opacity-60"
            />
            {{ persona.name || persona.persona_id }}
          </div>
          <div v-if="persona.description" class="voice-desc">{{ persona.description }}</div>
        </div>
        <div class="voice-actions" @click.stop>
          <el-button
            type="danger"
            size="small"
            text
            :loading="deletingId === persona.persona_id"
            @click="onDelete(persona)"
          >
            <font-awesome-icon icon="fa-solid fa-trash" />
          </el-button>
        </div>
      </div>
    </div>
    <voice-create-dialog v-model="showCreateDialog" @created="onCreated" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton, ElIcon, ElMessage, ElMessageBox } from 'element-plus';
import { Loading } from '@element-plus/icons-vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import VoiceCreateDialog from './VoiceCreateDialog.vue';
import { ISunoPersona } from '@/models';

export default defineComponent({
  name: 'VoiceManager',
  components: {
    ElButton,
    ElIcon,
    Loading,
    FontAwesomeIcon,
    VoiceCreateDialog
  },
  data() {
    return {
      showCreateDialog: false,
      loading: false,
      deletingId: null as string | null
    };
  },
  computed: {
    personas(): ISunoPersona[] {
      return this.$store.state.suno?.personas || [];
    },
    selectedPersonaId(): string | undefined {
      return this.$store.state.suno?.config?.persona_id;
    }
  },
  watch: {
    '$store.state.suno.credential': {
      handler() {
        this.loadPersonas();
      },
      immediate: true
    }
  },
  methods: {
    async loadPersonas() {
      if (!this.$store.state.suno?.credential?.token) return;
      this.loading = true;
      try {
        await this.$store.dispatch('suno/getPersonas');
      } finally {
        this.loading = false;
      }
    },
    selectPersona(persona: ISunoPersona) {
      const config = { ...this.$store.state.suno?.config };
      if (config.persona_id === persona.persona_id) {
        config.persona_id = undefined;
      } else {
        config.persona_id = persona.persona_id;
      }
      this.$store.dispatch('suno/setConfig', config);
    },
    async onDelete(persona: ISunoPersona) {
      try {
        await ElMessageBox.confirm(this.$t('suno.voice.confirmDelete'), this.$t('suno.voice.delete'), {
          type: 'warning',
          confirmButtonText: this.$t('common.button.confirm'),
          cancelButtonText: this.$t('common.button.cancel')
        });
      } catch {
        return;
      }
      if (!persona.persona_id) return;
      this.deletingId = persona.persona_id;
      const success = await this.$store.dispatch('suno/deletePersona', persona.persona_id);
      this.deletingId = null;
      if (success) {
        ElMessage.success(this.$t('suno.voice.deleteSuccess'));
        // Clear selection if deleted persona was selected
        if (this.selectedPersonaId === persona.persona_id) {
          const config = { ...this.$store.state.suno?.config, persona_id: undefined };
          this.$store.dispatch('suno/setConfig', config);
        }
      } else {
        ElMessage.error(this.$t('suno.voice.deleteFailed'));
      }
    },
    async onCreated() {
      await this.loadPersonas();
    }
  }
});
</script>

<style scoped>
.voice-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 300px;
  overflow-y: auto;
}

.voice-item {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid var(--el-border-color-lighter);
  transition: all 0.2s;
}

.voice-item:hover {
  border-color: var(--el-color-primary-light-5);
  background: var(--el-fill-color-light);
}

.voice-item.active {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.voice-name {
  font-size: 13px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.voice-desc {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: 2px;
}

.voice-actions {
  flex-shrink: 0;
  margin-left: 8px;
}
</style>
