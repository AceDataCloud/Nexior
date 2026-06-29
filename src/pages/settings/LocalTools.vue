<template>
  <div class="local-tools">
    <h2>Local Tools</h2>
    <p v-if="!desktop" class="muted">Desktop app only.</p>
    <template v-else>
      <p class="muted">Authorize folders the AI may read/write locally. Tools execute on this machine.</p>
      <el-button size="small" type="primary" @click="addFolder">Add folder</el-button>
      <ul class="roots">
        <li v-for="(r, i) in roots" :key="r">
          <span>{{ r }}</span>
          <el-button size="small" text @click="removeRoot(i)">remove</el-button>
        </li>
        <li v-if="!roots.length" class="muted">No folders yet.</li>
      </ul>
      <el-button size="small" :loading="saving" @click="save">Save</el-button>
      <p v-if="tools.length" class="muted">Tools: {{ tools.join(', ') }}</p>
      <section v-if="perm" class="perms">
        <h3>System permissions</h3>
        <p class="muted">Optional. Folder access above needs none of these; grant only what a task requires.</p>
        <div class="row">
          <span>Full Disk Access</span>
          <b>{{ perm.fullDisk ? '✓' : '—' }}</b>
          <el-button size="small" text @click="open('fullDisk')">Open…</el-button>
        </div>
        <div class="row">
          <span>Screen Recording</span>
          <b>{{ perm.screen }}</b>
          <el-button size="small" text @click="open('screen')">Open…</el-button>
        </div>
        <div class="row">
          <span>Accessibility</span>
          <b>{{ perm.accessibility ? '✓' : '—' }}</b>
          <el-button size="small" text @click="open('accessibility')">Open…</el-button>
        </div>
      </section>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton } from 'element-plus';
import { localExec } from '@/utils/desktop';

export default defineComponent({
  name: 'SettingsLocalTools',
  components: { ElButton },
  data() {
    return {
      roots: [] as string[],
      tools: [] as string[],
      saving: false,
      perm: null as null | { mac: boolean; fullDisk: boolean; screen: string; mic: string; accessibility: boolean }
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
    this.roots = (await ex.getConfig()).roots;
    this.tools = (await ex.listTools()).map((t) => t.name);
    const s = await ex.perm?.status();
    if (s?.mac) this.perm = s;
  },
  methods: {
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
      await localExec()?.saveConfig({ roots: this.roots, mcp: [] });
      this.saving = false;
    }
  }
});
</script>

<style scoped>
.local-tools {
  padding: 24px;
}
.muted {
  color: #888;
  font-size: 13px;
}
.roots {
  list-style: none;
  padding: 0;
}
.roots li {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
}
.perms {
  margin-top: 24px;
  border-top: 1px solid #eee;
  padding-top: 12px;
}
.perms .row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 0;
}
.perms .row span {
  flex: 1;
}
</style>
