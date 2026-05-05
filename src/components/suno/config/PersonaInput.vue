<template>
  <div class="field">
    <div class="flex items-center justify-between mb-2">
      <div class="flex items-center">
        <h2 class="text-sm font-bold m-0">{{ $t('suno.name.persona') }}</h2>
        <info-icon :content="$t('suno.description.persona')" />
      </div>
      <el-button size="small" round @click="showManager = true">
        <font-awesome-icon icon="fa-solid fa-microphone" class="mr-1" />
        {{ $t('suno.voice.manage') }}
      </el-button>
    </div>
    <el-select
      v-model="personaId"
      :placeholder="$t('suno.placeholder.personaId')"
      clearable
      filterable
      class="w-full"
    >
      <el-option
        v-for="persona in personas"
        :key="persona.persona_id || ''"
        :value="persona.persona_id || ''"
        :label="persona.name || persona.persona_id || ''"
      >
        <div class="flex items-center justify-between w-full">
          <span>{{ persona.name || persona.persona_id }}</span>
          <span v-if="persona.source_type" class="text-xs text-gray-400 ml-2">{{ persona.source_type }}</span>
        </div>
      </el-option>
    </el-select>
    <el-drawer v-model="showManager" :title="$t('suno.voice.title')" size="380px" direction="rtl">
      <voice-manager />
    </el-drawer>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSelect, ElOption, ElButton, ElDrawer } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import InfoIcon from '@/components/common/InfoIcon.vue';
import VoiceManager from '@/components/suno/voice/VoiceManager.vue';
import { ISunoPersona } from '@/models';

export default defineComponent({
  name: 'PersonaInput',
  components: {
    ElSelect,
    ElOption,
    ElButton,
    ElDrawer,
    FontAwesomeIcon,
    InfoIcon,
    VoiceManager
  },
  data() {
    return {
      showManager: false
    };
  },
  computed: {
    personaId: {
      get(): string {
        return this.$store.state.suno?.config?.persona_id || '';
      },
      set(val: string) {
        this.$store.commit('suno/setConfig', {
          ...this.$store.state.suno?.config,
          persona_id: val || undefined
        });
      }
    },
    personas(): ISunoPersona[] {
      return this.$store.state.suno?.personas || [];
    }
  }
});
</script>
