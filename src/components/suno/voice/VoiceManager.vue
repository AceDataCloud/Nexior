<template>
  <div class="voice-manager">
    <div class="flex items-center justify-between mb-3">
      <span class="text-sm font-medium">{{ $t('suno.voice.title') }}</span>
      <el-button type="primary" size="small" @click="showCreateDialog = true">
        <add-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
        {{ $t('suno.voice.create') }}
      </el-button>
    </div>
    <el-tabs v-model="activeTab" class="voice-tabs" size="small">
      <el-tab-pane name="all" :label="$t('suno.voice.tabAll') + ' (' + (personas?.length || 0) + ')'" />
      <el-tab-pane name="favorites" :label="$t('suno.voice.tabFavorites') + ' (' + favoritePersonas.length + ')'" />
    </el-tabs>
    <div v-if="loading" class="text-center py-6">
      <el-icon class="is-loading"><loading :size="'1em' as any" aria-hidden="true" focusable="false" /></el-icon>
    </div>
    <div v-else-if="visiblePersonas.length === 0" class="text-center py-6 text-gray-400 text-sm">
      {{ activeTab === 'favorites' ? $t('suno.voice.emptyFavorites') : $t('suno.voice.empty') }}
    </div>
    <div v-else class="voice-list">
      <div
        v-for="persona in visiblePersonas"
        :key="persona.persona_id"
        class="voice-item"
        :class="{ active: selectedPersonaId === persona.persona_id }"
        @click="selectPersona(persona)"
      >
        <div class="flex-1 min-w-0">
          <div class="voice-name">
            <microphone-icon
              v-if="persona.source_type === 'voice'"
              class="mr-1.5 text-xs opacity-60"
              :size="'1em' as any"
              aria-hidden="true"
              focusable="false"
            />
            <music-icon
              v-else
              class="mr-1.5 text-xs opacity-60"
              :size="'1em' as any"
              aria-hidden="true"
              focusable="false"
            />
            {{ persona.name || persona.persona_id }}
          </div>
          <div v-if="persona.description" class="voice-desc">{{ persona.description }}</div>
        </div>
        <div class="voice-actions" @click.stop>
          <el-tooltip
            :content="isFavorite(persona.persona_id) ? $t('suno.voice.unfavorite') : $t('suno.voice.favorite')"
            placement="top"
          >
            <el-button
              size="small"
              text
              :class="{ 'voice-fav-active': isFavorite(persona.persona_id) }"
              :aria-label="isFavorite(persona.persona_id) ? $t('suno.voice.unfavorite') : $t('suno.voice.favorite')"
              :title="isFavorite(persona.persona_id) ? $t('suno.voice.unfavorite') : $t('suno.voice.favorite')"
              @click="onToggleFavorite(persona)"
            >
              <favorite-icon :size="'1em' as any" aria-hidden="true" focusable="false" />
            </el-button>
          </el-tooltip>
          <el-button
            type="danger"
            size="small"
            text
            :loading="deletingId === persona.persona_id"
            :aria-label="$t('common.button.delete')"
            :title="$t('common.button.delete')"
            @click="onDelete(persona)"
          >
            <delete-icon :size="'1em' as any" aria-hidden="true" focusable="false" />
          </el-button>
        </div>
      </div>
    </div>
    <voice-create-dialog v-model="showCreateDialog" @created="onCreated" />
  </div>
</template>

<script lang="ts">
import {
  AddIcon,
  DeleteIcon,
  FavoriteIcon,
  LoadingIcon as Loading,
  MicrophoneIcon,
  MusicIcon
} from '@acedatacloud/core/icons/components';
import { defineComponent } from 'vue';
import { ElButton, ElIcon, ElMessage, ElMessageBox, ElTabs, ElTabPane, ElTooltip } from 'element-plus';

import VoiceCreateDialog from './VoiceCreateDialog.vue';
import { ISunoPersona } from '@/models';

export default defineComponent({
  name: 'VoiceManager',
  components: {
    AddIcon,
    DeleteIcon,
    FavoriteIcon,
    ElButton,
    ElIcon,
    ElTabs,
    ElTabPane,
    ElTooltip,
    Loading,
    MicrophoneIcon,
    MusicIcon,
    VoiceCreateDialog
  },
  data() {
    return {
      showCreateDialog: false,
      loading: false,
      deletingId: null as string | null,
      activeTab: 'all' as 'all' | 'favorites'
    };
  },
  computed: {
    personas(): ISunoPersona[] {
      return this.$store.state.suno?.personas || [];
    },
    favoriteIds(): string[] {
      return this.$store.state.suno?.favoritePersonaIds || [];
    },
    favoritePersonas(): ISunoPersona[] {
      return this.personas.filter((p) => p.persona_id && this.favoriteIds.includes(p.persona_id));
    },
    visiblePersonas(): ISunoPersona[] {
      return this.activeTab === 'favorites' ? this.favoritePersonas : this.personas;
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
    isFavorite(personaId?: string): boolean {
      return !!personaId && this.favoriteIds.includes(personaId);
    },
    onToggleFavorite(persona: ISunoPersona) {
      if (!persona.persona_id) return;
      this.$store.commit('suno/togglePersonaFavorite', persona.persona_id);
    },
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
        // Also drop from favorites if present
        if (this.favoriteIds.includes(persona.persona_id)) {
          this.$store.commit('suno/togglePersonaFavorite', persona.persona_id);
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
.voice-tabs {
  margin-bottom: 8px;
}
.voice-tabs :deep(.el-tabs__header) {
  margin: 0 0 8px 0;
}
.voice-tabs :deep(.el-tabs__nav-wrap::after) {
  height: 1px;
}
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
  display: flex;
  align-items: center;
  gap: 2px;
}

.voice-fav-active :deep(svg),
.voice-fav-active {
  color: #f5a623;
}
</style>
