<template>
  <div class="skill-picker">
    <el-input v-model="query" clearable :placeholder="$t('site.capabilityOverride.skillSearch')" />
    <div v-loading="loading" class="skill-picker-list">
      <label v-for="skill in filteredSkills" :key="skill.id" class="skill-option">
        <el-checkbox
          :model-value="selectedIds.includes(skill.id)"
          :disabled="!skill.enabled"
          @change="toggle(skill.id)"
        />
        <span class="skill-copy">
          <strong>{{ skill.name || skill.slug }}</strong>
          <small>{{ skill.description }}</small>
        </span>
        <el-tag v-if="!skill.enabled" size="small" type="info">{{
          $t('site.capabilityOverride.skillDisabled')
        }}</el-tag>
        <el-button
          v-if="skill.owner_scope === 'site'"
          link
          type="danger"
          :loading="deletingId === skill.id"
          :aria-label="$t('common.button.delete')"
          @click.prevent.stop="removeSkill(skill)"
        >
          {{ $t('common.button.delete') }}
        </el-button>
      </label>
      <el-empty v-if="!loading && filteredSkills.length === 0" :description="$t('site.capabilityOverride.noSkills')" />
    </div>
    <div class="skill-actions">
      <el-button size="small" @click="$emit('manage')">{{ $t('site.capabilityOverride.manageSkills') }}</el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import { ElButton, ElCheckbox, ElEmpty, ElInput, ElMessage, ElMessageBox, ElTag, vLoading } from 'element-plus';
import type { ISkill } from '@/operators/skill';
import { skillOperator } from '@/operators/skill';

export default defineComponent({
  name: 'SkillPicker',
  components: {
    ElButton,
    ElCheckbox,
    ElEmpty,
    ElInput,
    ElTag
  },
  directives: { loading: vLoading },
  props: {
    modelValue: { type: Array as PropType<Array<{ id: string }>>, default: () => [] },
    siteId: { type: String, required: true }
  },
  emits: ['update:modelValue', 'manage'],
  data() {
    return {
      skills: [] as ISkill[],
      loading: false,
      query: '',
      deletingId: ''
    };
  },
  computed: {
    selectedIds(): string[] {
      return this.modelValue.map((item) => item.id);
    },
    filteredSkills(): ISkill[] {
      const query = this.query.trim().toLowerCase();
      return this.skills.filter(
        (skill) =>
          skill.owner_scope !== 'personal' &&
          (!query || `${skill.name} ${skill.slug} ${skill.description}`.toLowerCase().includes(query))
      );
    }
  },
  mounted() {
    void this.refresh();
  },
  methods: {
    async refresh() {
      this.loading = true;
      try {
        this.skills = (await skillOperator.list(this.siteId)).data || [];
      } finally {
        this.loading = false;
      }
    },
    toggle(id: string) {
      const next = this.selectedIds.includes(id)
        ? this.modelValue.filter((item) => item.id !== id)
        : [...this.modelValue, { id }];
      this.$emit('update:modelValue', next);
    },
    async removeSkill(skill: ISkill) {
      try {
        await ElMessageBox.confirm(
          this.$t('skill.message.deleteConfirm', { slug: skill.slug }) as string,
          this.$t('common.button.delete') as string,
          { type: 'warning' }
        );
      } catch {
        return;
      }
      this.deletingId = skill.id;
      try {
        await skillOperator.remove(skill.id, this.siteId);
        this.skills = this.skills.filter((item) => item.id !== skill.id);
        this.$emit(
          'update:modelValue',
          this.modelValue.filter((item) => item.id !== skill.id)
        );
        ElMessage.success(this.$t('skill.message.deleteSuccess') as string);
      } finally {
        this.deletingId = '';
      }
    }
  }
});
</script>

<style scoped>
.skill-picker-list {
  max-height: 240px;
  overflow: auto;
  margin: 10px 0;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}
.skill-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--el-border-color-extra-light);
}
.skill-option:last-child {
  border-bottom: 0;
}
.skill-copy {
  display: grid;
  flex: 1;
  min-width: 0;
}
.skill-copy small {
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.skill-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
