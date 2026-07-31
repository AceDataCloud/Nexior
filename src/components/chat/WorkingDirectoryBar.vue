<template>
  <!-- The conversation's working directory — the project the AI operates in.
       Desktop only; renders nothing everywhere else. Two states:
         • not chosen  → a call to action; the composer is disabled until it is
         • chosen      → a quiet footer link that switches project on click
       Self-contained + placement-agnostic, like <connector-strip>. -->
  <div v-if="supported" class="working-dir" :class="{ 'working-dir--unset': !workingDirectory }">
    <el-button v-if="!workingDirectory" size="small" type="primary" :loading="picking" @click="onPick">
      <folder-icon :size="'1em' as any" aria-hidden="true" focusable="false" />
      {{ $t('chat.workingDir.choose') }}
    </el-button>
    <el-tooltip v-else effect="dark" placement="top">
      <template #content>
        <div class="working-dir-tip">
          <div>{{ workingDirectory }}</div>
          <div class="working-dir-tip__hint">{{ $t('chat.workingDir.switchHint') }}</div>
        </div>
      </template>
      <span class="working-dir-link" role="button" tabindex="0" @click="onPick" @keydown.enter="onPick">
        <folder-icon :size="'1em' as any" aria-hidden="true" focusable="false" />
        <span class="working-dir-path">{{ displayPath }}</span>
      </span>
    </el-tooltip>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton, ElTooltip } from 'element-plus';
import { FolderIcon } from '@acedatacloud/core/icons/components';
import { localExec } from '@/utils/desktop';
import { isDesktop } from '@/utils/surface';

// Keep the pill from pushing the composer around on a deep path; the full path
// is in the tooltip and in Settings.
const MAX_SEGMENTS = 2;

export default defineComponent({
  name: 'WorkingDirectoryBar',
  components: {
    ElButton,
    ElTooltip,
    FolderIcon
  },
  data() {
    return {
      picking: false
    };
  },
  computed: {
    /** Desktop build AND a live bridge. Android stubs `pickFolder()` to return
     *  null, so gating on the bridge alone would strand it with a precondition
     *  it can never satisfy. */
    supported(): boolean {
      return isDesktop() && !!localExec();
    },
    workingDirectory(): string {
      return this.$store.state.chat?.workingDirectory ?? '';
    },
    /** Trailing segments only — enough to tell projects apart without letting a
     *  deep path dominate the composer row. */
    displayPath(): string {
      const parts = this.workingDirectory.split(/[/\\]/).filter(Boolean);
      if (parts.length <= MAX_SEGMENTS) return this.workingDirectory;
      return '…/' + parts.slice(-MAX_SEGMENTS).join('/');
    }
  },
  async mounted() {
    // The main process owns the value; the store is a mirror for rendering.
    // Re-sync on mount so a change made in Settings (or in another window) is
    // reflected here without a reload.
    if (!this.supported) return;
    try {
      const cfg = await localExec()?.getConfig();
      const dir = cfg?.workingDir ?? '';
      if (dir !== this.workingDirectory) this.$store.commit('chat/setWorkingDirectory', dir);
    } catch {
      /* bridge unavailable — leave the mirrored value alone */
    }
  },
  methods: {
    async onPick() {
      if (this.picking) return;
      this.picking = true;
      try {
        const dir = await localExec()?.pickFolder();
        if (!dir) return; // cancelled
        // Persist to the main process FIRST — it is the source of truth, and it
        // is what authorizes the folder. Mirroring into the store before the
        // save could unblock the composer for a directory that was never
        // actually authorized.
        const cur = await localExec()?.getConfig();
        await localExec()?.saveConfig({
          roots: cur?.roots ?? [],
          mcp: cur?.mcp ?? [],
          computerUse: cur?.computerUse,
          workingDir: dir
        });
        this.$store.commit('chat/setWorkingDirectory', dir);
      } finally {
        this.picking = false;
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.working-dir {
  display: flex;
  align-items: center;
  // Sits in the composer's footer row, left of the centered disclaimer.
  // Absolute so a long path can never shove the disclaimer off-center.
  position: absolute;
  left: 0;
  max-width: 45%;
}
// The call-to-action state is a full button, not a text chip. Keeping it in
// normal flow lets it share the row with the disclaimer instead of overlapping
// it; the row is centered, so the two sit together under the composer.
.working-dir--unset {
  position: static;
  max-width: none;
}
.working-dir-tip__hint {
  margin-top: 2px;
  opacity: 0.7;
}
// Deliberately understated: this is ambient status, not an action to draw the
// eye. Matches the disclaimer's size/color so the footer reads as one line.
.working-dir-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition: color 0.15s;
  &:hover,
  &:focus-visible {
    color: var(--el-text-color-regular);
  }
}
.working-dir-path {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
