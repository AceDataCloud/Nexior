<template>
  <li class="skill-row-wrapper">
    <div class="skill-row" :class="{ active: isSkillSelected }" @click="$emit('select-skill', skill)">
      <button
        v-if="hasChildren"
        class="row-chevron"
        :aria-label="$t(expanded ? 'common.button.collapse' : 'common.button.expand')"
        :title="$t(expanded ? 'common.button.collapse' : 'common.button.expand')"
        @click.stop="$emit('toggle-expand', skill)"
      >
        <expand-down-icon v-if="expanded" :size="14" aria-hidden="true" focusable="false" />
        <expand-right-icon v-else :size="14" aria-hidden="true" focusable="false" />
      </button>
      <span v-else class="row-chevron-spacer" />

      <skill-icon class="row-icon" :size="16" aria-hidden="true" focusable="false" />
      <span class="row-label" :title="skill.name">{{ skill.slug }}</span>
    </div>

    <ul v-if="expanded && hasChildren" class="file-list">
      <file-node
        v-for="node in tree"
        :key="node.path"
        :node="node"
        :selected-skill-id="selectedSkillId"
        :selected-path="selectedPath"
        :skill="skill"
        :depth="1"
        @select-file="onSelectFile"
      />
    </ul>
  </li>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { ExpandDownIcon, ExpandRightIcon, SkillIcon } from '@acedatacloud/core/icons/components';
import { ISkill } from '@/operators/skill';
import FileNode, { ITreeNode, buildTree } from './FileNode.vue';

export default defineComponent({
  name: 'SkillRow',
  components: { ExpandDownIcon, ExpandRightIcon, SkillIcon, FileNode },
  props: {
    skill: {
      type: Object as PropType<ISkill>,
      required: true
    },
    selectedSkillId: {
      type: String,
      required: true
    },
    selectedPath: {
      type: String,
      required: true
    },
    expanded: {
      type: Boolean,
      default: false
    }
  },
  emits: ['toggle-expand', 'select-skill', 'select-file'],
  computed: {
    tree(): ITreeNode[] {
      return buildTree(this.skill.asset_bundle_files);
    },
    hasChildren(): boolean {
      // SKILL.md is always present, but show chevron only when there are
      // additional files to browse.
      return this.skill.asset_bundle_files.length > 1;
    },
    isSkillSelected(): boolean {
      return this.selectedSkillId === this.skill.id && !this.selectedPath;
    }
  },
  methods: {
    onSelectFile(path: string) {
      this.$emit('select-file', this.skill, path);
    }
  }
});
</script>

<style scoped>
.skill-row-wrapper {
  list-style: none;
}

.skill-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px 6px 8px;
  margin: 1px 8px;
  /* Match the console sidebar's nav rows (SidePanel.vue) and the connectors
     list, which sit right next to this one. */
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  color: var(--el-text-color-regular);
  user-select: none;
}

.skill-row:hover {
  background: var(--el-fill-color-extra-light);
}

/* Selection used a grey fill, dropping the brand accent every other list in
   the console uses. */
.skill-row.active {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-weight: 500;
}

.row-chevron {
  width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: 4px;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  font-size: 10px;
  flex-shrink: 0;
}

.row-chevron:hover {
  background: var(--el-fill-color-dark);
  color: var(--el-text-color-primary);
}

.row-chevron-spacer {
  display: inline-block;
  width: 18px;
  flex-shrink: 0;
}

.row-icon {
  color: var(--el-text-color-secondary);
  font-size: 13px;
  flex-shrink: 0;
}

.row-label {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}

.file-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
</style>
