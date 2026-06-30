<template>
  <div class="settings-list local-tools-setting">
    <p v-if="!desktop" class="hint muted">
      {{ $t('common.settings.localToolsDesktopOnly') }}
    </p>
    <template v-else>
      <!-- Authorized folders -->
      <section>
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
      <section v-if="grants !== null">
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

      <!-- Computer Use (opt-in: screen capture + mouse/keyboard control) -->
      <section>
        <div class="section-head">
          <h3>{{ $t('common.settings.localToolsComputerUseTitle') }}</h3>
          <el-switch v-model="computerUse" :loading="savingCU" @change="onToggleComputerUse" />
        </div>
        <p class="muted">{{ $t('common.settings.localToolsComputerUseHint') }}</p>
        <div class="actions">
          <el-button size="small" type="primary" :loading="preauthorizing" @click="preauthorizeAll">
            {{ $t('common.settings.localToolsPreauthorizeAll') }}
          </el-button>
          <span class="muted">{{ $t('common.settings.localToolsPreauthorizeHint') }}</span>
        </div>
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
      savingCU: false,
      preauthorizing: false,
      saving: false,
      savedTip: false,
      cuOff: null as null | (() => void)
    };
  },
  computed: {
    desktop(): boolean {
      return !!localExec();
    }
  },
  async mounted() {
    const ex = localExec();
    if (!ex) return;
    const cfg = await ex.getConfig();
    this.roots = cfg.roots;
    this.computerUse = cfg.computerUse === true;
    this.tools = (await ex.listTools()).map((t) => t.name);
    const s = await ex.perm?.status();
    if (s?.mac) this.perm = s;
    await this.loadGrants();
    // Reflect the global panic hotkey: keep the toggle in sync so a later Save
    // can't silently re-enable Computer Use after it was force-disabled.
    this.cuOff =
      ex.onComputerUseDisabled?.(() => {
        this.computerUse = false;
      }) ?? null;
  },
  beforeUnmount() {
    this.cuOff?.();
  },
  methods: {
    async loadGrants() {
      const ex = localExec();
      if (!ex?.grants) {
        this.grants = null;
        return;
      }
      const keys = await ex.grants.list();
      this.grants = keys.map((k) => {
        // key shape: `<tool.name>:<json input>`. The input is always JSON, so
        // split at the first `:{` (object) — robust even if a tool name ever
        // contained a colon. Fall back to the first `:` for non-object inputs.
        const sep = k.indexOf(':{');
        const idx = sep >= 0 ? sep : k.indexOf(':');
        return { key: k, name: idx >= 0 ? k.slice(0, idx) : k, input: idx >= 0 ? k.slice(idx + 1) : '' };
      });
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
