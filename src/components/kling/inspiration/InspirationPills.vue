<template>
  <div v-if="selected.length > 0" class="pills" role="list">
    <div v-for="text in selected" :key="text" class="pill" role="listitem">
      <span class="pill-text">{{ text }}</span>
      <button
        type="button"
        class="pill-remove"
        :aria-label="$t('kling.inspiration.removeChip')"
        @click.stop="onRemove(text)"
      >
        <font-awesome-icon icon="fa-solid fa-xmark" />
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { KLING_PRESET_GROUPS } from './presets';
import { removeChunk } from './promptChunks';

export default defineComponent({
  name: 'InspirationPills',
  components: {
    FontAwesomeIcon
  },
  computed: {
    prompt(): string {
      return this.$store.state.kling?.config?.prompt || '';
    },
    /**
     * Localized text for every preset chip, used to detect which ones the
     * user has currently selected. We match against the raw prompt text
     * because that is also the source of truth used by the drawer.
     */
    allChipTexts(): string[] {
      return KLING_PRESET_GROUPS.flatMap((g) =>
        g.chipKeys.map((k) => this.$t(`kling.inspiration.chip.${k}`) as string)
      );
    },
    selected(): string[] {
      const text = this.prompt;
      if (!text) return [];
      // Preserve the order in which chips appear inside the prompt so the
      // pills visually match the content as the user reads it.
      const found: { text: string; idx: number }[] = [];
      for (const t of this.allChipTexts) {
        const idx = text.indexOf(t);
        if (idx !== -1) {
          found.push({ text: t, idx });
        }
      }
      return found.sort((a, b) => a.idx - b.idx).map((f) => f.text);
    }
  },
  methods: {
    onRemove(text: string) {
      const next = removeChunk(this.prompt, text);
      this.$store.commit('kling/setConfig', {
        ...this.$store.state.kling?.config,
        prompt: next
      });
    }
  }
});
</script>

<style lang="scss" scoped>
.pills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}
.pill {
  display: inline-flex;
  align-items: center;
  padding: 3px 4px 3px 10px;
  border-radius: 999px;
  background-color: var(--el-color-primary-light-9);
  border: 1px solid var(--el-color-primary-light-7);
  color: var(--el-color-primary);
  font-size: 12px;
  line-height: 1;
  max-width: 100%;

  .pill-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 220px;
  }
  .pill-remove {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    margin-left: 4px;
    padding: 0;
    border: none;
    background: transparent;
    border-radius: 50%;
    color: var(--el-color-primary);
    cursor: pointer;
    font-size: 10px;

    &:hover {
      background-color: var(--el-color-primary-light-7);
    }
  }
}
</style>
