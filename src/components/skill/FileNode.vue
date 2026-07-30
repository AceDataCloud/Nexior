<template>
  <li>
    <div class="file-node" :class="{ active: isActive }" :style="{ paddingLeft: indent + 'px' }" @click="onClick">
      <button
        v-if="!node.isLeaf"
        class="node-chevron"
        :aria-label="$t(open ? 'common.button.collapse' : 'common.button.expand')"
        :title="$t(open ? 'common.button.collapse' : 'common.button.expand')"
        @click.stop="open = !open"
      >
        <expand-down-icon v-if="open" :size="14" aria-hidden="true" focusable="false" />
        <expand-right-icon v-else :size="14" aria-hidden="true" focusable="false" />
      </button>
      <span v-else class="node-chevron-spacer" />

      <font-awesome-icon v-if="isHtmlFile(node)" icon="fa-brands fa-html5" class="node-icon" />
      <component :is="iconFor(node)" v-else class="node-icon" size="1em" aria-hidden="true" focusable="false" />
      <span class="node-label">{{ node.label }}</span>
    </div>

    <ul v-if="!node.isLeaf && open" class="children">
      <file-node
        v-for="child in node.children || []"
        :key="child.path"
        :node="child"
        :selected-skill-id="selectedSkillId"
        :selected-path="selectedPath"
        :skill="skill"
        :depth="depth + 1"
        @select-file="(p: string) => $emit('select-file', p)"
      />
    </ul>
  </li>
</template>

<script lang="ts">
import { defineComponent, type Component, PropType } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  CodeFileIcon,
  DocsIcon,
  ExpandDownIcon,
  ExpandRightIcon,
  FileIcon,
  FileTextIcon,
  FolderIcon,
  ImageFileIcon
} from '@acedatacloud/core/icons/components';
import { ISkill } from '@/operators/skill';

export interface ITreeNode {
  label: string;
  path: string;
  isLeaf: boolean;
  children?: ITreeNode[];
}

const CODE_EXTENSIONS = new Set([
  'py',
  'ts',
  'tsx',
  'js',
  'jsx',
  'json',
  'yaml',
  'yml',
  'sh',
  'bash',
  'zsh',
  'css',
  'html',
  'sql',
  'go',
  'rs',
  'rb',
  'java',
  'cpp',
  'c',
  'h',
  'toml'
]);
const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg']);

function fileIconFor(path: string): Component {
  const base = path.split('/').pop() || path;
  const ext = (base.split('.').pop() || '').toLowerCase();
  if (base === 'SKILL.md') return DocsIcon;
  if (ext === 'md') return FileTextIcon;
  if (IMAGE_EXTENSIONS.has(ext)) return ImageFileIcon;
  if (CODE_EXTENSIONS.has(ext)) return CodeFileIcon;
  return FileIcon;
}

/** Convert a flat list of relative file paths into a nested tree. */
export function buildTree(files: string[]): ITreeNode[] {
  const childrenByParent = new Map<string, Map<string, ITreeNode>>();
  childrenByParent.set('', new Map());

  const ensureDir = (parentPath: string, segment: string): ITreeNode => {
    let parentMap = childrenByParent.get(parentPath);
    if (!parentMap) {
      parentMap = new Map();
      childrenByParent.set(parentPath, parentMap);
    }
    const myPath = parentPath ? `${parentPath}/${segment}` : segment;
    let node = parentMap.get(segment);
    if (!node) {
      node = { label: segment, path: myPath, isLeaf: false, children: [] };
      parentMap.set(segment, node);
      childrenByParent.set(myPath, new Map());
    }
    return node;
  };

  for (const path of files) {
    const segments = path.split('/').filter(Boolean);
    if (segments.length === 0) continue;
    const fileName = segments[segments.length - 1];
    const dirs = segments.slice(0, -1);

    let parentPath = '';
    for (const dir of dirs) {
      const node = ensureDir(parentPath, dir);
      parentPath = node.path;
    }
    const fileNode: ITreeNode = { label: fileName, path, isLeaf: true };
    let parentMap = childrenByParent.get(parentPath);
    if (!parentMap) {
      parentMap = new Map();
      childrenByParent.set(parentPath, parentMap);
    }
    parentMap.set(fileName, fileNode);
  }

  const assemble = (parentPath: string): ITreeNode[] => {
    const map = childrenByParent.get(parentPath);
    if (!map) return [];
    const nodes = Array.from(map.values());
    for (const n of nodes) {
      if (!n.isLeaf) n.children = assemble(n.path);
    }
    return nodes.sort((a, b) => {
      // SKILL.md always first.
      if (a.path === 'SKILL.md') return -1;
      if (b.path === 'SKILL.md') return 1;
      if (a.isLeaf !== b.isLeaf) return a.isLeaf ? 1 : -1;
      return a.label.localeCompare(b.label);
    });
  };

  return assemble('');
}

export default defineComponent({
  name: 'FileNode',
  components: { ExpandDownIcon, ExpandRightIcon, FontAwesomeIcon },
  props: {
    node: {
      type: Object as PropType<ITreeNode>,
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
    skill: {
      type: Object as PropType<ISkill>,
      required: true
    },
    depth: {
      type: Number,
      default: 1
    }
  },
  emits: ['select-file'],
  data() {
    return {
      open: true
    };
  },
  computed: {
    indent(): number {
      return 8 + this.depth * 16;
    },
    isActive(): boolean {
      return this.node.isLeaf && this.selectedSkillId === this.skill.id && this.selectedPath === this.node.path;
    }
  },
  methods: {
    isHtmlFile(node: ITreeNode): boolean {
      return node.isLeaf && node.path.toLowerCase().endsWith('.html');
    },
    iconFor(node: ITreeNode): Component {
      return node.isLeaf ? fileIconFor(node.path) : FolderIcon;
    },
    onClick() {
      if (this.node.isLeaf) {
        this.$emit('select-file', this.node.path);
      } else {
        this.open = !this.open;
      }
    }
  }
});
</script>

<style scoped>
.file-node {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px 4px 8px;
  margin: 1px 8px;
  /* Match the sibling skill rows and the console sidebar. */
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  color: var(--el-text-color-regular);
  user-select: none;
}

.file-node:hover {
  background: var(--el-fill-color-extra-light);
}

.file-node.active {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-weight: 500;
}

.node-chevron {
  width: 16px;
  height: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: 4px;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  font-size: 9px;
  flex-shrink: 0;
}

.node-chevron-spacer {
  display: inline-block;
  width: 16px;
  flex-shrink: 0;
}

.node-icon {
  color: var(--el-text-color-secondary);
  width: 12px;
  height: 12px;
  flex-shrink: 0;
}

.node-label {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
}

.children {
  list-style: none;
  margin: 0;
  padding: 0;
}
</style>
