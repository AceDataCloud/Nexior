<template>
  <div class="model-list-panel flex flex-col h-full">
    <header class="header">
      <h2 class="title">{{ $t('fish.title.myVoices') }}</h2>
      <span v-if="voices?.length" class="count">{{ voices?.length }}</span>
    </header>
    <div class="body flex-1 min-h-0">
      <div v-if="voices === undefined" class="h-full">
        <bot-placeholder />
      </div>
      <div
        v-else-if="voices.length === 0"
        class="w-full h-full flex flex-col items-center justify-center text-center px-6"
      >
        <font-awesome-icon icon="fa-solid fa-microphone-lines" class="empty-icon" />
        <p class="empty-title">{{ $t('fish.title.noVoicesYet') }}</p>
        <p class="empty-hint">{{ $t('fish.description.noVoicesYet') }}</p>
      </div>
      <div v-else class="w-full h-full overflow-y-auto pr-1">
        <voice-card v-for="item in voices" :key="item.id" :model-value="item" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import VoiceCard from './model/Card.vue';
import BotPlaceholder from '@/components/common/BotPlaceholder.vue';
import { IFishVoiceModel } from '@/models';

export default defineComponent({
  name: 'FishModelListPanel',
  components: {
    VoiceCard,
    BotPlaceholder,
    FontAwesomeIcon
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

<style lang="scss" scoped>
.model-list-panel {
  .header {
    display: flex;
    align-items: baseline;
    gap: 8px;
    padding: 0 4px 12px 4px;
    border-bottom: 1px solid var(--app-border-subtle);
    margin-bottom: 12px;
    flex: none;

    .title {
      font-size: 16px;
      font-weight: 600;
      margin: 0;
      color: var(--el-text-color-primary);
    }
    .count {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      background: var(--el-fill-color-light);
      padding: 1px 8px;
      border-radius: 10px;
    }
  }

  .empty-icon {
    font-size: 36px;
    color: var(--el-text-color-placeholder);
    margin-bottom: 12px;
  }
  .empty-title {
    font-size: 14px;
    color: var(--el-text-color-regular);
    margin: 0 0 4px 0;
  }
  .empty-hint {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin: 0;
    max-width: 280px;
  }
}
</style>
