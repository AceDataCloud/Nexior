<template>
  <div class="skills-page">
    <console-page-header :title="$t('skill.title.skills')" :subtitle="$t('skill.message.pageDescription')" />
    <div class="skills-shell">
      <!-- Left pane: skill list -->
      <aside class="left-pane">
        <header class="left-header">
          <el-input
            v-model="searchQuery"
            class="search-input"
            size="default"
            clearable
            :placeholder="$t('skill.placeholder.search')"
          >
            <template #prefix>
              <search-icon :size="14" aria-hidden="true" focusable="false" />
            </template>
          </el-input>

          <el-dropdown trigger="click" placement="bottom-end" :hide-on-click="false">
            <button
              type="button"
              class="add-button"
              :aria-label="$t('skill.button.add')"
              :title="$t('skill.button.add')"
            >
              <add-icon :size="16" aria-hidden="true" focusable="false" />
            </button>
            <template #dropdown>
              <el-dropdown-menu class="add-menu">
                <el-dropdown-item @click="onBrowse">
                  <marketplace-icon class="menu-icon" :size="14" aria-hidden="true" focusable="false" />
                  {{ $t('skill.menu.browse') }}
                </el-dropdown-item>
                <el-dropdown-item divided>
                  <el-dropdown trigger="hover" placement="left-start" :hide-on-click="true">
                    <span class="submenu-trigger">
                      <add-icon class="menu-icon" :size="14" aria-hidden="true" focusable="false" />
                      {{ $t('skill.menu.create') }}
                      <expand-right-icon class="submenu-arrow" :size="14" aria-hidden="true" focusable="false" />
                    </span>
                    <template #dropdown>
                      <el-dropdown-menu class="add-menu">
                        <el-dropdown-item disabled>
                          <ai-create-icon class="menu-icon" :size="14" aria-hidden="true" focusable="false" />
                          {{ $t('skill.menu.createWithClaude') }}
                          <span class="badge-soon">{{ $t('skill.menu.soon') }}</span>
                        </el-dropdown-item>
                        <el-dropdown-item @click="openWrite">
                          <write-icon class="menu-icon" :size="14" aria-hidden="true" focusable="false" />
                          {{ $t('skill.menu.write') }}
                        </el-dropdown-item>
                        <el-dropdown-item @click="openUpload">
                          <upload-icon class="menu-icon" :size="14" aria-hidden="true" focusable="false" />
                          {{ $t('skill.menu.upload') }}
                        </el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </header>

        <!-- Sections -->
        <div v-loading="loading" class="left-body">
          <!-- Personal skills -->
          <section class="section">
            <button class="section-header" @click="personalOpen = !personalOpen">
              <expand-down-icon
                v-if="personalOpen"
                class="section-chevron"
                :size="12"
                aria-hidden="true"
                focusable="false"
              />
              <expand-right-icon v-else class="section-chevron" :size="12" aria-hidden="true" focusable="false" />
              <span>{{ $t('skill.section.personal') }}</span>
            </button>
            <ul v-if="personalOpen" class="skill-list">
              <li v-if="!loading && filteredPersonal.length === 0" class="empty-row">
                {{ searchQuery ? $t('skill.empty.search') : $t('skill.message.noSkills') }}
              </li>
              <skill-row
                v-for="skill in filteredPersonal"
                :key="skill.id"
                :skill="skill"
                :selected-skill-id="selectedSkillId"
                :selected-path="selectedPath"
                :expanded="expandedSkillIds.includes(skill.id)"
                @toggle-expand="toggleExpand"
                @select-skill="selectSkill"
                @select-file="selectFile"
              />
            </ul>
          </section>

          <!-- Platform / Global skills (shown after Browse clicked or when present) -->
          <section v-if="globalSkills.length > 0" class="section">
            <button class="section-header" @click="globalsOpen = !globalsOpen">
              <expand-down-icon
                v-if="globalsOpen"
                class="section-chevron"
                :size="12"
                aria-hidden="true"
                focusable="false"
              />
              <expand-right-icon v-else class="section-chevron" :size="12" aria-hidden="true" focusable="false" />
              <span>{{ $t('skill.section.platform') }}</span>
            </button>
            <ul v-if="globalsOpen" class="skill-list">
              <skill-row
                v-for="skill in filteredGlobal"
                :key="skill.id"
                :skill="skill"
                :selected-skill-id="selectedSkillId"
                :selected-path="selectedPath"
                :expanded="expandedSkillIds.includes(skill.id)"
                @toggle-expand="toggleExpand"
                @select-skill="selectSkill"
                @select-file="selectFile"
              />
            </ul>
          </section>
        </div>
      </aside>

      <!-- Right pane: preview / detail -->
      <main class="right-pane">
        <template v-if="selectedSkill && !selectedPath">
          <!-- Skill root view: metadata + SKILL.md preview -->
          <header class="right-header">
            <h3 class="right-title">{{ selectedSkill.slug }}</h3>
            <div class="right-actions">
              <el-switch
                :model-value="selectedSkill.enabled"
                size="default"
                :loading="togglingId === selectedSkill.id"
                @change="(v: string | number | boolean) => onToggleSkill(selectedSkill!, Boolean(v))"
              />
              <el-dropdown v-if="selectedSkill.source !== 'global'" trigger="click" placement="bottom-end">
                <button class="icon-btn" :aria-label="$t('skill.button.more')" :title="$t('skill.button.more')">
                  <more-icon :size="16" aria-hidden="true" focusable="false" />
                </button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="onDelete(selectedSkill!)">
                      <delete-icon class="menu-icon" :size="14" aria-hidden="true" focusable="false" />
                      {{ $t('skill.button.delete') }}
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </header>

          <div class="meta-card">
            <div class="meta-grid">
              <div class="meta-cell">
                <span class="meta-label">{{ $t('skill.meta.addedBy') }}</span>
                <span class="meta-value">
                  {{ selectedSkill.source === 'global' ? $t('skill.meta.platform') : $t('skill.meta.you') }}
                </span>
              </div>
              <div class="meta-cell">
                <span class="meta-label">{{ $t('skill.meta.lastUpdated') }}</span>
                <span class="meta-value">{{ $dayjs.format(selectedSkill.updated_at) }}</span>
              </div>
              <div v-if="selectedSkill.required_connections.length" class="meta-cell">
                <span class="meta-label">{{ $t('skill.field.requiredConnections') }}</span>
                <div class="meta-tags">
                  <el-tag v-for="conn in selectedSkill.required_connections" :key="conn" size="small" type="info">
                    {{ conn }}
                  </el-tag>
                </div>
              </div>
            </div>

            <div v-if="selectedSkill.description" class="meta-description">
              <div class="meta-description-label">
                <span class="meta-label">{{ $t('skill.field.description') }}</span>
                <el-tooltip v-if="selectedSkill.when_to_use" :content="selectedSkill.when_to_use" placement="top">
                  <help-icon class="meta-info-icon" :size="12" aria-hidden="true" focusable="false" />
                </el-tooltip>
              </div>
              <p>{{ selectedSkill.description }}</p>
            </div>
          </div>

          <div class="preview-card">
            <skill-file-preview
              :key="`${selectedSkill.id}:SKILL.md`"
              :skill-id="selectedSkill.id"
              path="SKILL.md"
              :editable="selectedSkill.source === 'upload'"
              @save="onSaveContent"
            />
          </div>
        </template>

        <template v-else-if="selectedSkill && selectedPath">
          <!-- Sub-file view -->
          <skill-file-preview
            :key="`${selectedSkill.id}:${selectedPath}`"
            :skill-id="selectedSkill.id"
            :path="selectedPath"
            :editable="false"
          />
        </template>

        <template v-else>
          <div class="right-empty">
            <skill-icon class="right-empty-icon" size="1em" aria-hidden="true" focusable="false" />
            <p>{{ $t('skill.preview.selectSkill') }}</p>
          </div>
        </template>
      </main>
    </div>

    <!-- Dialogs -->
    <upload-skill-dialog v-model="uploadVisible" @created="onCreated" />
    <write-skill-dialog v-model="writeVisible" @created="onCreated" />
    <browse-skills-dialog v-model="browseVisible" @installed="onCreated" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import {
  ElInput,
  ElSwitch,
  ElTag,
  ElTooltip,
  ElDropdown,
  ElDropdownMenu,
  ElDropdownItem,
  ElMessage,
  ElMessageBox,
  vLoading
} from 'element-plus';
import {
  AddIcon,
  AiCreateIcon,
  DeleteIcon,
  ExpandDownIcon,
  ExpandRightIcon,
  HelpIcon,
  MarketplaceIcon,
  MoreIcon,
  SearchIcon,
  SkillIcon,
  UploadIcon,
  WriteIcon
} from '@acedatacloud/core/icons/components';
import { ISkill, skillOperator } from '@/operators/skill';
import BrowseSkillsDialog from '@/components/skill/BrowseSkillsDialog.vue';
import ConsolePageHeader from '@/components/console/PageHeader.vue';
import SkillFilePreview from '@/components/skill/SkillFilePreview.vue';
import SkillRow from '@/components/skill/SkillRow.vue';
import UploadSkillDialog from '@/components/skill/UploadSkillDialog.vue';
import WriteSkillDialog from '@/components/skill/WriteSkillDialog.vue';

interface IData {
  loading: boolean;
  skills: ISkill[];
  togglingId: string | null;

  selectedSkillId: string;
  selectedPath: string;
  expandedSkillIds: string[];

  personalOpen: boolean;
  globalsOpen: boolean;

  searchQuery: string;

  uploadVisible: boolean;
  writeVisible: boolean;
  browseVisible: boolean;
}

export default defineComponent({
  name: 'UserSkills',
  components: {
    ConsolePageHeader,
    ElInput,
    ElSwitch,
    ElTag,
    ElTooltip,
    ElDropdown,
    ElDropdownMenu,
    ElDropdownItem,
    AddIcon,
    AiCreateIcon,
    DeleteIcon,
    ExpandDownIcon,
    ExpandRightIcon,
    HelpIcon,
    MarketplaceIcon,
    MoreIcon,
    SearchIcon,
    SkillIcon,
    UploadIcon,
    WriteIcon,
    BrowseSkillsDialog,
    SkillFilePreview,
    SkillRow,
    UploadSkillDialog,
    WriteSkillDialog
  },
  directives: { loading: vLoading },
  data(): IData {
    return {
      loading: false,
      skills: [],
      togglingId: null,

      selectedSkillId: '',
      selectedPath: '',
      expandedSkillIds: [],

      personalOpen: true,
      globalsOpen: true,

      searchQuery: '',

      uploadVisible: false,
      writeVisible: false,
      browseVisible: false
    };
  },
  computed: {
    // Catalog-installed skills are owned by the user (backend sets user=request.user)
    // and therefore deletable, so they belong with uploads under Personal.
    personalSkills(): ISkill[] {
      return this.skills.filter((s) => s.source !== 'global');
    },
    globalSkills(): ISkill[] {
      return this.skills.filter((s) => s.source === 'global');
    },
    filteredPersonal(): ISkill[] {
      return this.applyFilter(this.personalSkills);
    },
    filteredGlobal(): ISkill[] {
      return this.applyFilter(this.globalSkills);
    },
    selectedSkill(): ISkill | null {
      return this.skills.find((s) => s.id === this.selectedSkillId) || null;
    }
  },
  mounted() {
    this.fetchSkills();
  },
  methods: {
    applyFilter(list: ISkill[]): ISkill[] {
      const q = this.searchQuery.trim().toLowerCase();
      if (!q) return list;
      return list.filter(
        (s) =>
          s.slug.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q)
      );
    },

    async fetchSkills() {
      this.loading = true;
      try {
        const { data } = await skillOperator.list();
        this.skills = data || [];
        if (!this.selectedSkillId && this.skills.length) {
          const first = this.personalSkills[0] || this.skills[0];
          this.selectedSkillId = first.id;
        } else if (this.selectedSkillId && !this.skills.find((s) => s.id === this.selectedSkillId)) {
          this.selectedSkillId = '';
          this.selectedPath = '';
        }
      } catch (err) {
        console.error(err);
        ElMessage.error(this.$t('skill.message.loadFailed'));
      } finally {
        this.loading = false;
      }
    },

    extractError(err: unknown): string {
      const e = err as { response?: { data?: { detail?: string; content?: string[] } } };
      return (
        e?.response?.data?.detail || (e?.response?.data?.content || []).join('; ') || String(err) || 'unknown error'
      );
    },

    selectSkill(skill: ISkill) {
      this.selectedSkillId = skill.id;
      this.selectedPath = '';
    },

    selectFile(skill: ISkill, path: string) {
      this.selectedSkillId = skill.id;
      this.selectedPath = path;
    },

    toggleExpand(skill: ISkill) {
      const idx = this.expandedSkillIds.indexOf(skill.id);
      if (idx >= 0) {
        this.expandedSkillIds.splice(idx, 1);
      } else {
        this.expandedSkillIds.push(skill.id);
      }
    },

    openUpload() {
      this.uploadVisible = true;
    },

    openWrite() {
      this.writeVisible = true;
    },

    onBrowse() {
      // Open the public skills directory dialog.
      this.browseVisible = true;
    },

    async onCreated(id: string) {
      await this.fetchSkills();
      const fresh = this.skills.find((s) => s.id === id);
      if (fresh) {
        this.selectedSkillId = fresh.id;
        this.selectedPath = '';
        this.personalOpen = true;
      }
    },

    async onSaveContent(content: string, callbacks: { resolve: () => void; reject: (err?: unknown) => void }) {
      if (!this.selectedSkill) {
        callbacks.reject();
        return;
      }
      try {
        const { data } = await skillOperator.update(this.selectedSkill.id, { content });
        ElMessage.success(this.$t('skill.message.updateSuccess'));
        const idx = this.skills.findIndex((s) => s.id === data.id);
        if (idx >= 0) this.skills.splice(idx, 1, data);
        callbacks.resolve();
      } catch (err) {
        ElMessage.error(this.$t('skill.message.createFailed', { detail: this.extractError(err) }));
        callbacks.reject(err);
      }
    },

    async onDelete(skill: ISkill) {
      try {
        await ElMessageBox.confirm(
          this.$t('skill.message.deleteConfirm', { slug: skill.slug }) as string,
          this.$t('skill.button.delete') as string,
          { type: 'warning' }
        );
      } catch {
        return;
      }
      try {
        await skillOperator.remove(skill.id);
        ElMessage.success(this.$t('skill.message.deleteSuccess'));
        if (this.selectedSkillId === skill.id) {
          this.selectedSkillId = '';
          this.selectedPath = '';
        }
        await this.fetchSkills();
      } catch (err) {
        ElMessage.error(this.extractError(err));
      }
    },

    async onToggleSkill(skill: ISkill, enabled: boolean) {
      this.togglingId = skill.id;
      try {
        if (enabled) {
          await skillOperator.enable(skill.id);
          ElMessage.success(this.$t('skill.message.enableSuccess'));
        } else {
          await skillOperator.disable(skill.id);
          ElMessage.success(this.$t('skill.message.disableSuccess'));
        }
        skill.enabled = enabled;
      } catch (err) {
        ElMessage.error(this.extractError(err));
      } finally {
        this.togglingId = null;
      }
    }
  }
});
</script>

<style scoped>
/* The full-height flex column comes from the layout (`.panel--workspace`,
   selected by this route's `meta.layout`), so the page only lays out its
   own content. */
.skills-page {
  display: contents;
}

.skills-shell {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  /* `--adc-radius-card` / `--app-border-subtle` are global tokens. The
     previous `--el-card-border-radius` was scoped inside Element Plus's
     `.el-card` rule, so this non-card element never inherited it and
     silently rendered square. */
  border: 1px solid var(--app-border-subtle);
  border-radius: var(--adc-radius-card);
  background: var(--el-card-bg-color);
  overflow: hidden;
  box-shadow: var(--app-shadow-xs);
}

/* el-card gets a glass treatment in dark mode (see _common.scss); mirror it
   here or the page reads flat next to Applications / Orders. */
html.dark .skills-shell {
  background: var(--app-glass-bg);
  backdrop-filter: blur(var(--app-glass-blur));
  border-color: var(--app-glass-border);
}

/* ---- Left pane ---- */
.left-pane {
  width: 320px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}

.left-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 14px 12px;
}

/* Matches the connector page's toolbar button so the two console pages read
   as one surface. */
.add-button {
  flex: 0 0 auto;
  width: 34px;
  height: 34px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-bg-color);
  color: var(--el-text-color-regular);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;

  &:hover {
    border-color: var(--el-color-primary);
    color: var(--el-color-primary);
  }
}

.icon-btn {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--el-text-color-regular);
  cursor: pointer;
  font-size: 14px;
  transition: background 0.15s;
}

.icon-btn:hover {
  background: var(--el-fill-color);
}

/* Styling comes from the global `.el-input__wrapper` rules in _common.scss,
   so the field matches every other input in the console. */
.search-input {
  flex: 1 1 auto;
}

.left-body {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0 16px;
  min-height: 0;
}

.section {
  margin-bottom: 8px;
}

.section-header {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  border: none;
  background: transparent;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  text-align: left;
}

.section-header:hover {
  color: var(--el-text-color-primary);
}

.section-chevron {
  font-size: 10px;
  width: 10px;
}

.skill-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.empty-row {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  padding: 12px 16px;
}

/* ---- Right pane ---- */
.right-pane {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 24px 32px;
  gap: 16px;
  background: var(--el-bg-color);
}

.right-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.right-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}

.right-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.meta-card {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-small);
  padding: 16px 20px;
  background: var(--el-fill-color-lighter);
}

.meta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px 24px;
}

.meta-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.meta-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-weight: 500;
}

.meta-value {
  font-size: 13px;
  color: var(--el-text-color-primary);
}

.meta-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.meta-description {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.meta-description-label {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.meta-info-icon {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  cursor: help;
}

.meta-description p {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--el-text-color-regular);
}

.preview-card {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-small);
  background: var(--el-bg-color);
  flex: 1;
  min-height: 360px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.preview-card :deep(.preview-root) {
  flex: 1;
  min-height: 0;
}

.right-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--el-text-color-secondary);
}

.right-empty-icon {
  width: 48px;
  height: 48px;
  color: var(--el-text-color-placeholder);
}

/* ---- Dropdown menu styling ---- */
.menu-icon {
  margin-right: 8px;
  width: 14px;
  text-align: center;
}

.submenu-trigger {
  display: inline-flex;
  align-items: center;
  width: 100%;
  cursor: pointer;
}

.submenu-arrow {
  margin-left: auto;
  padding-left: 16px;
  font-size: 10px;
  color: var(--el-text-color-secondary);
}

.badge-soon {
  margin-left: 8px;
  padding: 1px 6px;
  border-radius: 4px;
  background: var(--el-fill-color);
  color: var(--el-text-color-secondary);
  font-size: 10px;
}

/* ---- Responsive ---- */
@media screen and (max-width: 767px) {
  .skills-shell {
    flex-direction: column;
  }
  .left-pane {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--el-border-color-lighter);
    max-height: 50vh;
  }
  .right-pane {
    padding: 16px;
  }
}
</style>
