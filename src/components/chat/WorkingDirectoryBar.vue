<template>
  <!-- The conversation's working directory — the project the AI operates in.
       Desktop only; renders nothing everywhere else. Two states:
         • not chosen  → a call to action; the composer is disabled until it is
         • chosen      → a compact pill that switches project on click
       Self-contained + placement-agnostic, like <connector-strip>. -->
  <div v-if="supported" class="working-dir">
    <el-button v-if="!workingDirectory" size="small" type="primary" :loading="picking" @click="onPick">
      <folder-icon :size="'1em' as any" aria-hidden="true" focusable="false" />
      {{ $t('chat.workingDir.choose') }}
    </el-button>
    <el-tooltip v-else effect="dark" :content="$t('chat.workingDir.switchHint')" placement="top">
      <span class="working-dir-pill" role="button" tabindex="0" @click="onPick" @keydown.enter="onPick">
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
}
.working-dir-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 320px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-light);
  cursor: pointer;
  &:hover {
    background: var(--el-fill-color);
  }
}
.working-dir-path {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
