<template>
  <div class="field">
    <div class="flex items-center mb-2">
      <h2 class="text-sm font-bold m-0">{{ $t('suno.name.persona') }}</h2>
      <info-icon :content="$t('suno.description.persona')" />
    </div>
    <el-input v-model="personaId" size="small" :placeholder="$t('suno.placeholder.personaId')" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElInput } from 'element-plus';
import InfoIcon from '@/components/common/InfoIcon.vue';

export default defineComponent({
  name: 'PersonaInput',
  components: {
    ElInput,
    InfoIcon
  },
  computed: {
    personaId: {
      get() {
        return this.$store.state.suno?.config?.persona_id || '';
      },
      set(val: string) {
        this.$store.commit('suno/setConfig', {
          ...this.$store.state.suno?.config,
          persona_id: val || undefined
        });
      }
    }
  }
});
</script>
