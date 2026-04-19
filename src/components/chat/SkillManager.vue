<template>
  <el-dialog v-model="visible" :title="$t('chat.skill.title')" width="620px" :close-on-click-modal="false">
    <!-- List view -->
    <div v-if="mode === 'list'" v-loading="loading" class="skill-manager">
      <div class="toolbar-row">
        <el-button type="primary" size="small" @click="openCreate">
          <font-awesome-icon icon="fa-solid fa-plus" class="btn-icon" />
          {{ $t('chat.skill.add') }}
        </el-button>
      </div>
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
          <el-switch
            :model-value="isActive(skill.id)"
            @change="(val: string | number | boolean) => onToggle(skill.id, !!val)"
          />
          <el-button
            v-if="!skill.is_builtin"
            text
            size="small"
            class="skill-delete"
            :title="$t('chat.skill.delete')"
            @click="onDelete(skill)"
          >
            <font-awesome-icon icon="fa-solid fa-trash" />
          </el-button>
        </div>
        <p class="skill-description">{{ skill.description }}</p>
      </div>
      <div v-if="!loading && skills.length === 0" class="empty-state">
        <p>{{ $t('chat.skill.empty') }}</p>
      </div>
    </div>

    <!-- Create view -->
    <div v-else class="skill-form">
      <el-form label-position="top" :model="form" @submit.prevent>
        <el-form-item :label="$t('chat.skill.form.name')" required>
          <el-input v-model="form.name" :placeholder="$t('chat.skill.form.namePlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('chat.skill.form.displayName')">
          <el-input v-model="form.display_name" :placeholder="$t('chat.skill.form.displayNamePlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('chat.skill.form.icon')">
          <el-input v-model="form.icon" maxlength="4" style="width: 120px" />
        </el-form-item>
        <el-form-item :label="$t('chat.skill.form.description')">
          <el-input v-model="form.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item :label="$t('chat.skill.form.type')">
          <el-radio-group v-model="form.type">
            <el-radio value="prompt">{{ $t('chat.skill.form.typePrompt') }}</el-radio>
            <el-radio value="code">{{ $t('chat.skill.form.typeCode') }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="form.type === 'prompt'" :label="$t('chat.skill.form.instructions')" required>
          <el-input
            v-model="form.instructions"
            type="textarea"
            :rows="6"
            :placeholder="$t('chat.skill.form.instructionsPlaceholder')"
          />
          <div class="upload-hint">
            <el-button size="small" @click="onPickFile">
              <font-awesome-icon icon="fa-solid fa-upload" class="btn-icon" />
              {{ $t('chat.skill.form.uploadText') }}
            </el-button>
            <input ref="fileInput" type="file" accept=".txt,.md,.prompt" style="display: none" @change="onFilePicked" />
          </div>
        </el-form-item>
        <el-form-item v-else :label="$t('chat.skill.form.code')" required>
          <el-input
            v-model="form.code"
            type="textarea"
            :rows="8"
            :placeholder="$t('chat.skill.form.codePlaceholder')"
          />
          <div class="upload-hint">
            <el-button size="small" @click="onPickFile">
              <font-awesome-icon icon="fa-solid fa-upload" class="btn-icon" />
              {{ $t('chat.skill.form.uploadCode') }}
            </el-button>
            <input ref="fileInput" type="file" accept=".js,.ts,.py,.txt" style="display: none" @change="onFilePicked" />
          </div>
        </el-form-item>
        <el-form-item :label="$t('chat.skill.form.tags')">
          <el-input v-model="form.tagsText" :placeholder="$t('chat.skill.form.tagsPlaceholder')" />
        </el-form-item>
      </el-form>
    </div>

    <template v-if="mode === 'create'" #footer>
      <el-button @click="mode = 'list'">{{ $t('common.button.cancel') }}</el-button>
      <el-button type="primary" :loading="saving" @click="onSave">
        {{ $t('common.button.create') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import {
  ElDialog,
  ElSwitch,
  ElTag,
  ElButton,
  ElMessage,
  ElMessageBox,
  ElForm,
  ElFormItem,
  ElInput,
  ElRadioGroup,
  ElRadio
} from 'element-plus';
import { skillOperator } from '@/operators';
import { ISkill, ISkillType } from '@/models';

interface CreateForm {
  name: string;
  display_name: string;
  icon: string;
  description: string;
  type: ISkillType;
  instructions: string;
  code: string;
  tagsText: string;
}

function emptyForm(): CreateForm {
  return {
    name: '',
    display_name: '',
    icon: '⚡',
    description: '',
    type: 'prompt',
    instructions: '',
    code: '',
    tagsText: ''
  };
}

export default defineComponent({
  name: 'SkillManager',
  components: {
    ElDialog,
    ElSwitch,
    ElTag,
    ElButton,
    ElForm,
    ElFormItem,
    ElInput,
    ElRadioGroup,
    ElRadio
  },
  props: {
    modelValue: { type: Boolean, default: false },
    activeSkills: { type: Array as () => string[], default: () => [] },
    token: { type: String, default: undefined }
  },
  emits: ['update:modelValue', 'change'],
  data() {
    return {
      loading: false,
      saving: false,
      skills: [] as ISkill[],
      mode: 'list' as 'list' | 'create',
      form: emptyForm()
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
    modelValue: {
      immediate: true,
      handler(val: boolean) {
        if (val) {
          this.mode = 'list';
          this.loadData();
        }
      }
    }
  },
  mounted() {
    if (this.modelValue) {
      this.loadData();
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
    },
    openCreate() {
      this.form = emptyForm();
      this.mode = 'create';
    },
    onPickFile() {
      const el = this.$refs.fileInput as HTMLInputElement | undefined;
      el?.click();
    },
    onFilePicked(ev: Event) {
      const input = ev.target as HTMLInputElement;
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result ?? '');
        if (this.form.type === 'prompt') {
          this.form.instructions = text;
        } else {
          this.form.code = text;
        }
        if (!this.form.name) {
          this.form.name = file.name.replace(/\.[^.]+$/, '');
        }
      };
      reader.readAsText(file);
      input.value = '';
    },
    async onSave() {
      const token = this.token;
      if (!token) return;
      const f = this.form;
      if (!f.name.trim()) {
        ElMessage.warning(this.$t('chat.skill.form.nameRequired'));
        return;
      }
      if (f.type === 'prompt' && !f.instructions.trim()) {
        ElMessage.warning(this.$t('chat.skill.form.instructionsRequired'));
        return;
      }
      if (f.type === 'code' && !f.code.trim()) {
        ElMessage.warning(this.$t('chat.skill.form.codeRequired'));
        return;
      }
      const tags = f.tagsText
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      const payload: Partial<ISkill> = {
        name: f.name.trim(),
        display_name: f.display_name.trim() || f.name.trim(),
        description: f.description.trim(),
        icon: f.icon.trim() || '⚡',
        type: f.type,
        tags
      };
      if (f.type === 'prompt') payload.instructions = f.instructions;
      else payload.code = f.code;

      this.saving = true;
      try {
        await skillOperator.create(payload, token);
        ElMessage.success(this.$t('chat.skill.createSuccess'));
        this.mode = 'list';
        await this.loadData();
      } catch {
        ElMessage.error(this.$t('chat.skill.createError'));
      } finally {
        this.saving = false;
      }
    },
    async onDelete(skill: ISkill) {
      const token = this.token;
      if (!token) return;
      try {
        await ElMessageBox.confirm(
          this.$t('chat.skill.deleteConfirm', { name: skill.display_name }) as string,
          this.$t('chat.skill.delete') as string,
          { type: 'warning' }
        );
      } catch {
        return;
      }
      try {
        await skillOperator.remove(skill.id, token);
        ElMessage.success(this.$t('chat.skill.deleteSuccess'));
        if (this.activeSkills.includes(skill.id)) {
          this.$emit(
            'change',
            this.activeSkills.filter((id) => id !== skill.id)
          );
        }
        await this.loadData();
      } catch {
        ElMessage.error(this.$t('chat.skill.deleteError'));
      }
    }
  }
});
</script>

<style scoped lang="scss">
.skill-manager {
  min-height: 120px;
}

.toolbar-row {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}

.btn-icon {
  margin-right: 4px;
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

.skill-delete {
  color: var(--el-color-danger);
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

.skill-form {
  .upload-hint {
    margin-top: 6px;
  }
}
</style>
