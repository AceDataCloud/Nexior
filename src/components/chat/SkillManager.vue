<template>
  <el-dialog v-model="visible" :title="$t('chat.skill.title')" width="560px" :close-on-click-modal="false">
    <div v-loading="loading" class="skill-manager">
      <div v-for="skill in skills" :key="skill.id" class="skill-item">
        <div class="skill-header">
          <span class="skill-icon">{{ skill.icon }}</span>
          <div class="skill-info">
            <span class="skill-name">{{ skill.display_name }}</span>
            <el-tag v-if="skill.is_builtin" size="small" type="info" class="skill-tag">
              {{ $t('chat.skill.builtin') }}
            </el-tag>
            <el-tag v-for="tag in skill.tags.slice(0, 2)" :key="tag" size="small" class="skill-tag">{{ tag }}</el-tag>
          </div>
          <el-switch :model-value="isActive(skill.id)" @change="(val: boolean) => onToggle(skill.id, val)" />
        </div>
        <p class="skill-description">{{ skill.description }}</p>
      </div>
      <div v-if="!loading && skills.length === 0" class="empty-state">
        <p>{{ $t('chat.skill.empty') }}</p>
      </div>
    </div>
  </el-dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElDialog, ElSwitch, ElTag, ElMessage } from 'element-plus';
import { skillOperator } from '@/operators';
import { ISkill } from '@/models';

export default defineComponent({
  name: 'SkillManager',
  components: { ElDialog, ElSwitch, ElTag },
  props: {
    modelValue: { type: Boolean, default: false },
    activeSkills: { type: Array as () => string[], default: () => [] },
    token: { type: String, default: undefined }
  },
  emits: ['update:modelValue', 'change'],
  data() {
    return {
      loading: false,
      skills: [] as ISkill[]
    };
  },
  computed: {
    visible: {
      get() {
        return this.modelValue;
      },
      set(val: boolean) {
        this.$emit('update:modelValue', val);
      }
    }
  },
  watch: {
    modelValue(val: boolean) {
      if (val) {
        this.loadData();
      }
    }
  },
  methods: {
    isActive(skillId: string): boolean {
      return this.activeSkills.includes(skillId);
    },
    async loadData() {
      const token = this.token;
      if (!token) return;
      this.loading = true;
      try {
        const { data } = await skillOperator.list(token);
        this.skills = data.items || [];
      } catch {
        ElMessage.error(this.$t('chat.skill.loadError'));
      } finally {
        this.loading = false;
      }
    },
    onToggle(skillId: string, active: boolean) {
      const updated = active ? [...this.activeSkills, skillId] : this.activeSkills.filter((id) => id !== skillId);
      this.$emit('change', updated);
    }
  }
});
</script>

<style scoped lang="scss">
.skill-manager {
  min-height: 120px;
}

.skill-item {
  padding: 12px;
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
  margin-bottom: 10px;
  transition: border-color 0.2s;

  &:hover {
    border-color: var(--el-color-primary-light-5);
  }
}

.skill-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.skill-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.skill-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.skill-name {
  font-weight: 600;
  font-size: 14px;
}

.skill-tag {
  font-size: 11px;
}

.skill-description {
  margin: 8px 0 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
}

.empty-state {
  text-align: center;
  padding: 40px 0;
  color: var(--el-text-color-secondary);
}
</style>
