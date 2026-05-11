<template>
  <div v-if="voices === undefined">
    <bot-placeholder />
  </div>
  <div v-else-if="voices.length === 0" class="w-full h-full flex items-center justify-center">
    <no-tasks />
  </div>
  <div v-else class="w-full h-full overflow-y-auto">
    <voice-card v-for="item in voices" :key="item.id" :model-value="item" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import VoiceCard from './model/Card.vue';
import BotPlaceholder from '@/components/common/BotPlaceholder.vue';
import NoTasks from '@/components/common/NoTasks.vue';
import { IFishVoiceModel } from '@/models';

export default defineComponent({
  name: 'FishModelListPanel',
  components: {
    VoiceCard,
    BotPlaceholder,
    NoTasks
  },
  props: {
    loading: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    voices(): IFishVoiceModel[] | undefined {
      return this.$store.state.fish?.voices;
    }
  }
});
</script>
