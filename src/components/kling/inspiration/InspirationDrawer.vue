<template>
  <el-drawer
    v-model="visible"
    direction="rtl"
    :with-header="false"
    :size="drawerSize"
    custom-class="kling-inspiration-drawer"
    :destroy-on-close="false"
  >
    <div class="drawer-content">
      <div class="drawer-header">
        <div class="title-row">
          <font-awesome-icon icon="fa-regular fa-lightbulb" class="mr-2" />
          <span class="title">{{ $t('kling.inspiration.title') }}</span>
        </div>
        <el-button text :icon="Close" class="close-btn" @click="visible = false" />
      </div>

      <div class="hint">{{ $t('kling.inspiration.hint') }}</div>

      <div v-if="selectedCount > 0" class="selected-bar">
        <span class="selected-text">{{ $t('kling.inspiration.selectedSummary', { count: selectedCount }) }}</span>
        <el-button text size="small" class="clear-btn" @click="onClearSelected">
          {{ $t('kling.inspiration.clearSelected') }}
        </el-button>
      </div>

      <div class="groups">
        <div v-for="group in groups" :key="group.groupKey" class="group">
          <div class="group-title">{{ $t(`kling.inspiration.group.${group.groupKey}`) }}</div>
          <div class="chip-grid">
            <button
              v-for="chipKey in group.chipKeys"
              :key="chipKey"
              type="button"
              :class="{ chip: true, active: isSelected(chipText(chipKey)) }"
              @click="onToggle(chipText(chipKey))"
            >
              {{ chipText(chipKey) }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElDrawer, ElButton } from 'element-plus';
import { Close } from '@element-plus/icons-vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { KLING_PRESET_GROUPS } from './presets';
import { appendChunk, removeChunk } from './promptChunks';

export default defineComponent({
  name: 'InspirationDrawer',
  components: {
    ElDrawer,
    ElButton,
    FontAwesomeIcon
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      groups: KLING_PRESET_GROUPS,
      Close
    };
  },
  computed: {
    visible: {
      get(): boolean {
        return this.modelValue;
      },
      set(val: boolean) {
        this.$emit('update:modelValue', val);
      }
    },
    drawerSize(): string {
      // Mobile gets full width; desktop a fixed-width side panel.
      return window.innerWidth < 768 ? '100%' : '380px';
    },
    prompt(): string {
      return this.$store.state.kling?.config?.prompt || '';
    },
    allChipTexts(): string[] {
      return this.groups.flatMap((g) => g.chipKeys.map((k) => this.$t(`kling.inspiration.chip.${k}`) as string));
    },
    selectedCount(): number {
      return this.allChipTexts.filter((t) => this.isSelected(t)).length;
    }
  },
  methods: {
    chipText(chipKey: string): string {
      return this.$t(`kling.inspiration.chip.${chipKey}`) as string;
    },
    isSelected(text: string): boolean {
      if (!text) return false;
      // Use word-boundary-ish substring match. Chip text is unique enough that
      // a literal includes() works reliably across en + zh.
      return this.prompt.includes(text);
    },
    setPrompt(val: string) {
      this.$store.commit('kling/setConfig', {
        ...this.$store.state.kling?.config,
        prompt: val
      });
    },
    onToggle(text: string) {
      if (!text) return;
      if (this.isSelected(text)) {
        this.setPrompt(removeChunk(this.prompt, text));
      } else {
        this.setPrompt(appendChunk(this.prompt, text));
      }
    },
    onClearSelected() {
      let next = this.prompt;
      for (const t of this.allChipTexts) {
        while (next.includes(t)) {
          next = removeChunk(next, t);
        }
      }
      this.setPrompt(next);
    }
  }
});
</script>

<style lang="scss" scoped>
.drawer-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px 18px 24px;
  overflow-y: auto;
}
.drawer-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;

  .title-row {
    display: inline-flex;
    align-items: center;
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
  .close-btn {
    padding: 6px;
    height: 32px;
    width: 32px;
  }
}
.hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 12px;
  line-height: 1.5;
}
.selected-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  margin-bottom: 12px;
  background-color: var(--el-color-primary-light-9);
  border-radius: 8px;
  font-size: 12px;

  .selected-text {
    color: var(--el-color-primary);
    font-weight: 500;
  }
}
.groups {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.group {
  .group-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-regular);
    margin-bottom: 8px;
  }
  .chip-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
}
.chip {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid var(--el-border-color);
  background-color: var(--el-fill-color-lighter);
  color: var(--el-text-color-regular);
  font-size: 13px;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;

  &:hover {
    border-color: var(--el-color-primary-light-5);
    background-color: var(--el-color-primary-light-9);
  }

  &.active {
    border-color: var(--el-color-primary);
    background-color: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
    font-weight: 500;
  }
}
</style>

<style lang="scss">
.kling-inspiration-drawer .el-drawer__body {
  padding: 0;
}
</style>
