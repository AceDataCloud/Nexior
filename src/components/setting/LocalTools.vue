<template>
  <div class="settings-list local-tools-setting">
    <p v-if="!desktop" class="hint muted">
      {{ $t('common.settings.localToolsDesktopOnly') }}
    </p>
    <template v-else>
      <!-- Android: Computer Use system permission entry (Accessibility). This
           is where the user pre-authorizes the service that lets the assistant
           see + control the screen. -->
      <section v-if="android">
        <div class="section-head">
          <h3>{{ $t('common.settings.localToolsPermsTitle') }}</h3>
        </div>
        <p class="muted">{{ $t('common.settings.localToolsAndroidPermHint') }}</p>
        <div class="perm-row">
          <span class="perm-name">{{ $t('common.settings.localToolsPermAccessibility') }}</span>
          <el-tag size="small" :type="a11yEnabled ? 'success' : 'info'" effect="plain">
            {{ a11yEnabled ? $t('common.settings.localToolsGranted') : $t('common.settings.localToolsNotGranted') }}
          </el-tag>
          <el-button size="small" type="primary" @click="openAndroidAccessibility">{{
            $t('common.settings.localToolsOpen')
          }}</el-button>
        </div>
      </section>

      <!-- Authorized folders -->
      <section v-if="!android">
        <div class="section-head">
          <h3>{{ $t('common.settings.localToolsFoldersTitle') }}</h3>
          <el-button size="small" type="primary" :icon="Plus" @click="addFolder">
            {{ $t('common.settings.localToolsAddFolder') }}
          </el-button>
        </div>
        <p class="muted">{{ $t('common.settings.localToolsFoldersHint') }}</p>
        <ul class="rows">
          <li v-for="(r, i) in roots" :key="r" class="row">
            <font-awesome-icon icon="fa-solid fa-folder" class="row-icon" />
            <span class="path">{{ r }}</span>
            <el-button size="small" text type="danger" @click="removeRoot(i)">
              {{ $t('common.settings.localToolsRemove') }}
            </el-button>
          </li>
          <li v-if="!roots.length" class="row muted empty">{{ $t('common.settings.localToolsNoFolders') }}</li>
        </ul>
        <div class="actions">
          <el-button size="small" type="primary" :loading="saving" @click="save">
            {{ $t('common.settings.localToolsSave') }}
          </el-button>
          <span v-if="savedTip" class="muted saved-tip">{{ $t('common.settings.localToolsSaved') }}</span>
        </div>
        <p v-if="tools.length" class="muted tools">
          {{ $t('common.settings.localToolsActiveTools') }}: {{ tools.join(', ') }}
        </p>
      </section>

      <!-- Always-allowed (persistent consent grants) -->
      <section v-if="grants !== null && !android">
        <div class="section-head">
          <h3>{{ $t('common.settings.localToolsGrantsTitle') }}</h3>
          <el-button v-if="grants.length" size="small" text type="danger" @click="revokeAll">
            {{ $t('common.settings.localToolsRevokeAll') }}
          </el-button>
        </div>
        <p class="muted">{{ $t('common.settings.localToolsGrantsHint') }}</p>
        <ul class="rows">
          <li v-for="g in grants" :key="g.key" class="row">
            <font-awesome-icon icon="fa-solid fa-shield-halved" class="row-icon" />
            <span class="grant">
              <code class="grant-name">{{ g.name }}</code>
              <span class="grant-input">{{ g.input }}</span>
            </span>
            <el-button size="small" type="danger" @click="revoke(g.key)">
              {{ $t('common.settings.localToolsRevoke') }}
            </el-button>
          </li>
          <li v-if="!grants.length" class="row muted empty">{{ $t('common.settings.localToolsNoGrants') }}</li>
        </ul>
      </section>

      <!-- Built-in tools: per-tool "always allow (any input)" toggles -->
      <section v-if="builtinTools.length && !android">
        <div class="section-head">
          <h3>{{ $t('common.settings.localToolsBuiltinTitle') }}</h3>
        </div>
        <p class="muted">{{ $t('common.settings.localToolsBuiltinHint') }}</p>
        <ul class="rows">
          <li v-for="t in builtinTools" :key="t.name" class="row">
            <font-awesome-icon :icon="builtinIcon(t.name)" class="row-icon" />
            <span class="cu-action">
              <span class="cu-action-name">
                <code class="grant-name">{{ t.name }}</code>
                <el-tag v-if="t.name === 'shell.run_command'" size="small" type="danger" effect="plain">{{
                  $t('common.settings.localToolsBuiltinRisky')
                }}</el-tag>
              </span>
              <span class="cu-action-desc">{{ t.description }}</span>
            </span>
            <el-switch
              :model-value="toolGrants[t.name] === true"
              :loading="builtinBusy === t.name"
              :disabled="!!builtinBusy"
              @change="(v: string | number | boolean) => onToggleBuiltinTool(t.name, v)"
            />
          </li>
        </ul>
      </section>

      <!-- Computer Use (opt-in: screen capture + mouse/keyboard control) -->
      <section>
        <div class="section-head">
          <h3>{{ $t('common.settings.localToolsComputerUseTitle') }}</h3>
          <el-switch v-model="computerUse" :loading="savingCU" @change="onToggleComputerUse" />
        </div>
        <p class="muted">{{ $t('common.settings.localToolsComputerUseHint') }}</p>
        <template v-if="computerTools.length">
          <div class="section-head sub">
            <h4>{{ $t('common.settings.localToolsCuActionsTitle') }}</h4>
            <el-button size="small" text type="primary" :loading="preauthorizing" @click="preauthorizeAll">
              {{ $t('common.settings.localToolsPreauthorizeAll') }}
            </el-button>
          </div>
          <p class="muted">{{ $t('common.settings.localToolsCuActionsHint') }}</p>
          <ul class="rows">
            <li v-for="t in computerTools" :key="t.name" class="row">
              <font-awesome-icon :icon="cuIcon(t.name)" class="row-icon" />
              <span class="cu-action">
                <span class="cu-action-name">{{ cuLabel(t.name) }}</span>
                <span class="cu-action-desc">{{ t.description }}</span>
              </span>
              <el-switch
                :model-value="computerGrants[t.name] === true"
                :loading="cuBusy === t.name"
                :disabled="!!cuBusy || preauthorizing"
                @change="(v: string | number | boolean) => onToggleComputerTool(t.name, v)"
              />
            </li>
          </ul>
        </template>
      </section>

      <!-- macOS system permissions -->
      <section v-if="perm">
        <div class="section-head">
          <h3>{{ $t('common.settings.localToolsPermsTitle') }}</h3>
        </div>
        <p class="muted">{{ $t('common.settings.localToolsPermsHint') }}</p>
        <div class="perm-row">
          <span class="perm-name">{{ $t('common.settings.localToolsPermFullDisk') }}</span>
          <el-tag size="small" :type="perm.fullDisk ? 'success' : 'info'" effect="plain">
            {{ perm.fullDisk ? $t('common.settings.localToolsGranted') : $t('common.settings.localToolsNotGranted') }}
          </el-tag>
          <el-button size="small" type="primary" @click="open('fullDisk')">{{
            $t('common.settings.localToolsOpen')
          }}</el-button>
        </div>
        <div class="perm-row">
          <span class="perm-name">{{ $t('common.settings.localToolsPermScreen') }}</span>
          <el-tag size="small" :type="perm.screen === 'granted' ? 'success' : 'info'" effect="plain">
            {{
              perm.screen === 'granted'
                ? $t('common.settings.localToolsGranted')
                : $t('common.settings.localToolsNotGranted')
            }}
          </el-tag>
          <el-button size="small" type="primary" @click="open('screen')">{{
            $t('common.settings.localToolsOpen')
          }}</el-button>
        </div>
        <div class="perm-row">
          <span class="perm-name">{{ $t('common.settings.localToolsPermAccessibility') }}</span>
          <el-tag size="small" :type="perm.accessibility ? 'success' : 'info'" effect="plain">
            {{
              perm.accessibility ? $t('common.settings.localToolsGranted') : $t('common.settings.localToolsNotGranted')
            }}
          </el-tag>
          <el-button size="small" type="primary" @click="open('accessibility')">{{
            $t('common.settings.localToolsOpen')
          }}</el-button>
        </div>
      </section>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton, ElTag, ElSwitch } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { localExec } from '@/utils/desktop';
import { isAndroid } from '@/utils/surface';

interface GrantRow {
  key: string;
  name: string;
  input: string;
}

export default defineComponent({
  name: 'LocalToolsSetting',
  components: { ElButton, ElTag, ElSwitch, FontAwesomeIcon },
  data() {
    return {
      Plus,
      roots: [] as string[],
      tools: [] as string[],
      grants: null as null | GrantRow[],
      perm: null as null | { mac: boolean; fullDisk: boolean; screen: string; mic: string; accessibility: boolean },
      computerUse: false,
      // Computer-use tool catalog + per-action always-allow state (`computer.<x>`
      // → granted?). `cuBusy` holds the tool name whose toggle is in flight.
      computerTools: [] as { name: string; description: string }[],
      computerGrants: {} as Record<string, boolean>,
      cuBusy: null as null | string,
      // Builtin (fs/shell) tool catalog + per-tool tool-wide always-allow state.
      builtinTools: [] as { name: string; description: string; mutates: boolean }[],
      toolGrants: {} as Record<string, boolean>,
      builtinBusy: null as null | string,
      savingCU: false,
      preauthorizing: false,
      saving: false,
      savedTip: false,
      // Android: whether the Computer Use accessibility service is enabled.
      a11yEnabled: false,
      onFocus: null as null | (() => void),
      cuOff: null as null | (() => void)
    };
  },
  computed: {
    desktop(): boolean {
      return !!localExec();
    },
    android(): boolean {
      return isAndroid();
    }
  },
  async mounted() {
    const ex = localExec();
    if (!ex) return;
    const cfg = await ex.getConfig();
    this.roots = cfg.roots;
    this.computerUse = cfg.computerUse === true;
    this.tools = (await ex.listTools()).map((t) => t.name);
    this.computerTools = (await ex.computerTools?.()) ?? [];
    this.builtinTools = (await ex.builtinTools?.()) ?? [];
    const s = await ex.perm?.status();
    if (s?.mac) this.perm = s;
    await this.loadGrants();
    if (this.android) {
      await this.refreshA11y();
      // Re-check the accessibility status when the user returns from system
      // settings so the badge/toggles reflect it without a manual reload.
      this.onFocus = () => {
        if (document.visibilityState === 'visible') void this.refreshA11y();
      };
      document.addEventListener('visibilitychange', this.onFocus);
    }
    // Reflect the global panic hotkey: keep the toggle in sync so a later Save
    // can't silently re-enable Computer Use after it was force-disabled.
    this.cuOff =
      ex.onComputerUseDisabled?.(() => {
        this.computerUse = false;
      }) ?? null;
  },
  beforeUnmount() {
    this.cuOff?.();
    if (this.onFocus) document.removeEventListener('visibilitychange', this.onFocus);
  },
  methods: {
    async refreshA11y() {
      const s = await localExec()?.perm?.status();
      this.a11yEnabled = s?.accessibility === true;
    },
    async openAndroidAccessibility() {
      await localExec()?.perm?.openPane('accessibility');
    },
    async loadGrants() {
      const ex = localExec();
      if (!ex?.grants) {
        this.grants = null;
        return;
      }
      const keys = await ex.grants.list();
      // computer.* grants are name-scoped (bare tool name, no `:input`) and get
      // their own per-action toggles, so split them out of the generic
      // "always-allowed" list to avoid showing each one twice.
      const cuGrants: Record<string, boolean> = {};
      const toolWide: Record<string, boolean> = {};
      const builtinNames = new Set(this.builtinTools.map((t) => t.name));
      const rows: GrantRow[] = [];
      for (const k of keys) {
        if (k.startsWith('computer.') && !k.includes(':')) {
          cuGrants[k] = true;
          continue;
        }
        // Bare-name (no `:input`) grant for a builtin tool = tool-wide always-allow,
        // surfaced as its own toggle → hide from the generic list too.
        if (!k.includes(':') && builtinNames.has(k)) {
          toolWide[k] = true;
          continue;
        }
        // key shape: `<tool.name>:<json input>`. The input is always JSON, so
        // split at the first `:{` (object) — robust even if a tool name ever
        // contained a colon. Fall back to the first `:` for non-object inputs.
        const sep = k.indexOf(':{');
        const idx = sep >= 0 ? sep : k.indexOf(':');
        rows.push({ key: k, name: idx >= 0 ? k.slice(0, idx) : k, input: idx >= 0 ? k.slice(idx + 1) : '' });
      }
      this.computerGrants = cuGrants;
      this.toolGrants = toolWide;
      this.grants = rows;
    },
    async addFolder() {
      const p = await localExec()?.pickFolder();
      if (p && !this.roots.includes(p)) this.roots.push(p);
    },
    removeRoot(i: number) {
      this.roots.splice(i, 1);
    },
    async open(k: 'fullDisk' | 'screen' | 'accessibility') {
      await localExec()?.perm?.openPane(k);
    },
    async save() {
      this.saving = true;
      // Preserve mcp; the worker registers MCP servers from this same config.
      const cur = await localExec()?.getConfig();
      await localExec()?.saveConfig({ roots: this.roots, mcp: cur?.mcp ?? [], computerUse: this.computerUse });
      this.saving = false;
      this.savedTip = true;
      setTimeout(() => (this.savedTip = false), 2000);
    },
    // Toggle persists ONLY the Computer Use flag (preserving last-saved roots +
    // mcp), and hot-applies it in the main process so the tools appear/disappear
    // from the next `client_tools` payload without a restart.
    async onToggleComputerUse(val: string | number | boolean) {
      this.savingCU = true;
      const cur = await localExec()?.getConfig();
      await localExec()?.saveConfig({
        roots: cur?.roots ?? this.roots,
        mcp: cur?.mcp ?? [],
        computerUse: val === true
      });
      this.savingCU = false;
    },
    // Pre-approve every computer.* action (persistent always-allow), enable
    // Computer Use, and trigger the macOS Screen Recording / Accessibility
    // prompts up front so the first real action doesn't stall on a dialog.
    async preauthorizeAll() {
      const ex = localExec();
      if (!ex?.preauthorizeComputerUse) return;
      this.preauthorizing = true;
      try {
        const r = await ex.preauthorizeComputerUse();
        this.computerUse = r.computerUse === true;
        if (r.perm?.mac) this.perm = r.perm;
        await this.loadGrants();
      } finally {
        this.preauthorizing = false;
      }
    },
    // Per-action always-allow. ON pre-approves just this one computer.* tool
    // (native confirm in main), enables Computer Use, and triggers the system
    // prompts. OFF revokes the single grant, re-arming its per-call confirmation.
    async onToggleComputerTool(name: string, val: string | number | boolean) {
      const ex = localExec();
      if (!ex) return;
      this.cuBusy = name;
      try {
        if (val === true) {
          const r = await ex.preauthorizeComputerUse?.([name]);
          if (r) {
            this.computerUse = r.computerUse === true;
            if (r.perm?.mac) this.perm = r.perm;
          }
        } else {
          await ex.grants?.revoke(name);
        }
        await this.loadGrants();
      } finally {
        this.cuBusy = null;
      }
    },
    // Short i18n label + icon per computer.* action. Falls back to the bare
    // suffix / a generic icon for any tool the UI doesn't have copy for yet.
    cuLabel(name: string): string {
      const key = `common.settings.localToolsCu${this.cuSuffix(name)}`;
      const label = this.$t(key);
      return label === key ? name.replace(/^computer\./, '') : label;
    },
    cuIcon(name: string): string {
      const map: Record<string, string> = {
        screenshot: 'fa-solid fa-camera',
        click: 'fa-solid fa-arrow-pointer',
        move: 'fa-solid fa-up-down-left-right',
        type: 'fa-solid fa-keyboard',
        key: 'fa-solid fa-keyboard',
        scroll: 'fa-solid fa-arrows-up-down'
      };
      return map[name.replace(/^computer\./, '')] ?? 'fa-solid fa-shield-halved';
    },
    cuSuffix(name: string): string {
      const s = name.replace(/^computer\./, '');
      return s.charAt(0).toUpperCase() + s.slice(1);
    },
    // Per-tool tool-wide always-allow for a builtin tool. ON pre-approves the
    // tool for ANY input (native confirm in main; the switch reverts if the user
    // cancels). OFF revokes the bare-name grant, re-arming the per-call prompt.
    async onToggleBuiltinTool(name: string, val: string | number | boolean) {
      const ex = localExec();
      if (!ex?.grants) return;
      this.builtinBusy = name;
      try {
        if (val === true) {
          const r = await ex.grants.grantToolWide?.(name);
          // Cancelled native dialog → ok:false → leave the toggle off.
          if (!r?.ok) {
            this.toolGrants = { ...this.toolGrants, [name]: false };
          }
        } else {
          await ex.grants.revoke(name);
        }
        await this.loadGrants();
      } finally {
        this.builtinBusy = null;
      }
    },
    builtinIcon(name: string): string {
      if (name === 'shell.run_command') return 'fa-solid fa-terminal';
      if (name === 'fs.write_file') return 'fa-solid fa-pen';
      if (name === 'fs.read_file') return 'fa-solid fa-file';
      if (name === 'fs.list_dir') return 'fa-solid fa-folder';
      return 'fa-solid fa-shield-halved';
    },
    async revoke(key: string) {
      await localExec()?.grants?.revoke(key);
      await this.loadGrants();
    },
    async revokeAll() {
      await localExec()?.grants?.clear();
      await this.loadGrants();
    }
  }
});
</script>

<style scoped>
.local-tools-setting {
  display: flex;
  flex-direction: column;
  gap: 28px;
}
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.section-head h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
}
.section-head.sub {
  margin-top: 6px;
}
.section-head.sub h4 {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
}
.cu-action {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.cu-action-name {
  font-weight: 600;
  font-size: 13px;
}
.cu-action-desc {
  color: var(--el-text-color-secondary, #909399);
  font-size: 12px;
}
.muted {
  color: var(--el-text-color-secondary, #909399);
  font-size: 13px;
  margin: 6px 0 10px;
}
.rows {
  list-style: none;
  margin: 0;
  padding: 0;
  border: 1px solid var(--el-border-color-lighter, #ebeef5);
  border-radius: 8px;
  overflow: hidden;
}
.row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter, #ebeef5);
}
.rows .row:last-child {
  border-bottom: none;
}
.row.empty {
  justify-content: center;
  padding: 16px;
}
.row-icon {
  color: var(--el-text-color-secondary, #909399);
  flex-shrink: 0;
}
.path,
.grant {
  flex: 1;
  word-break: break-all;
  font-size: 13px;
}
.grant {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.grant-name {
  font-weight: 600;
}
.grant-input {
  color: var(--el-text-color-secondary, #909399);
  font-size: 12px;
  word-break: break-all;
}
.actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
}
.saved-tip {
  margin: 0;
}
.tools {
  margin-top: 12px;
}
.perm-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
}
.perm-name {
  flex: 1;
  font-size: 14px;
}
</style>
