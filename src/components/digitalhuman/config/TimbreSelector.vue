<template>
  <div>
    <div class="row">
      <span class="label">{{ $t('digitalhuman.name.timbre') }}</span>
      <el-select
        :model-value="modelValue"
        class="control"
        :placeholder="$t('digitalhuman.placeholder.pickTimbre')"
        @update:model-value="$emit('update:modelValue', $event)"
      >
        <el-option v-for="voice in voices" :key="voice.voice_id" :label="labelFor(voice)" :value="voice.voice_id">
          <span class="option">
            <span class="option-name">{{ labelFor(voice) }}</span>
            <button
              type="button"
              class="option-remove"
              :aria-label="$t('common.button.delete')"
              :title="$t('common.button.delete')"
              @click.stop="onRemove(voice.voice_id)"
            >
              <delete-icon :size="'1em' as any" aria-hidden="true" focusable="false" />
            </button>
          </span>
        </el-option>
        <template v-if="voices.length === 0" #empty>
          <p class="empty">{{ $t('digitalhuman.message.noVoiceYet') }}</p>
        </template>
      </el-select>
    </div>
    <el-button size="small" text type="primary" class="clone" @click="dialogVisible = true">
      <add-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
      {{ $t('digitalhuman.button.cloneNewVoice') }}
    </el-button>
    <voice-clone-dialog v-model:visible="dialogVisible" @cloned="onCloned" />
  </div>
</template>

<script lang="ts">
import { AddIcon, DeleteIcon } from '@acedatacloud/core/icons/components';
import { defineComponent } from 'vue';
import { ElButton, ElOption, ElSelect } from 'element-plus';
import VoiceCloneDialog from './VoiceCloneDialog.vue';
import { IDigitalHumanVoice, readVoices, removeVoice } from '@/utils/digitalhumanVoices';

interface IData {
  voices: IDigitalHumanVoice[];
  dialogVisible: boolean;
}

export default defineComponent({
  name: 'DigitalHumanTimbreSelector',
  components: {
    AddIcon,
    DeleteIcon,
    ElButton,
    ElOption,
    ElSelect,
    VoiceCloneDialog
  },
  props: {
    modelValue: {
      type: String,
      default: undefined
    }
  },
  emits: ['update:modelValue'],
  data(): IData {
    return {
      voices: readVoices(),
      dialogVisible: false
    };
  },
  mounted() {
    // A voice_id persisted from a previous session is meaningless once its
    // entry is gone from the book — drop it so the field reads as empty.
    if (this.modelValue && !this.voices.some((v) => v.voice_id === this.modelValue)) {
      this.$emit('update:modelValue', undefined);
    }
  },
  methods: {
    labelFor(voice: IDigitalHumanVoice): string {
      const lang = this.$t(`digitalhuman.name.lang_${voice.lang}`) as string;
      return lang.startsWith('digitalhuman.') ? voice.name : `${voice.name} · ${lang}`;
    },
    onCloned(voiceId: string) {
      this.voices = readVoices();
      this.$emit('update:modelValue', voiceId);
    },
    onRemove(voiceId: string) {
      this.voices = removeVoice(voiceId);
      if (this.modelValue === voiceId) {
        this.$emit('update:modelValue', undefined);
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  .label {
    font-size: 14px;
    font-weight: bold;
    flex: none;
  }

  .control {
    width: 190px;
    min-width: 0;
  }
}

.clone {
  margin-top: 4px;
  padding-left: 0;
}

.empty {
  margin: 0;
  padding: 10px 20px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.option {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;

  .option-name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .option-remove {
    flex: none;
    padding: 0 2px;
    border: none;
    background: transparent;
    line-height: 1;
    cursor: pointer;
    color: var(--el-text-color-secondary);
    &:hover {
      color: var(--el-color-danger);
    }
  }
}
</style>
