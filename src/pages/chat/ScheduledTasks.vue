<template>
  <div class="scheduled-tasks">
    <div class="inner">
      <div class="header">
        <h2 class="title">{{ $t('chat.scheduledTasks.title') }}</h2>
        <el-button type="primary" round @click="showCreateDialog = true">
          <font-awesome-icon icon="fa-solid fa-plus" class="icon" />
          {{ $t('chat.scheduledTasks.create') }}
        </el-button>
      </div>

      <el-skeleton v-if="loading" :rows="4" animated class="loading-block" />

      <el-empty v-else-if="!tasks.length" :description="$t('chat.scheduledTasks.empty')" class="empty" />

      <template v-else>
        <div class="task-list">
          <el-card v-for="task in pagedTasks" :key="task.id" class="task-card" shadow="hover" @click="selectTask(task)">
            <div class="task-top">
              <div class="task-name">{{ task.name }}</div>
              <div class="task-actions" @click.stop>
                <el-switch
                  :model-value="task.state === 'enabled'"
                  @change="(v: string | number | boolean) => toggleState(task, v === true)"
                />
                <el-button text class="icon-action" @click="openEdit(task)">
                  <font-awesome-icon icon="fa-solid fa-pen" />
                </el-button>
                <el-button text type="danger" class="icon-action" @click="confirmDelete(task)">
                  <font-awesome-icon icon="fa-solid fa-trash" />
                </el-button>
              </div>
            </div>
            <div class="task-meta">
              <el-tag size="small" :type="stateTagType(task.state)" effect="dark" round>
                {{ $t(`chat.scheduledTasks.state.${task.state}`) }}
              </el-tag>
              <span class="meta-chip">
                <font-awesome-icon icon="fa-solid fa-clock" class="meta-icon" />
                {{ scheduleLabel(task.schedule) }}
              </span>
              <span class="meta-chip">
                <font-awesome-icon icon="fa-solid fa-brain" class="meta-icon" />
                {{ task.template.model }}
              </span>
            </div>
            <div class="task-prompt">{{ task.template.question }}</div>
            <div v-if="task.last_output_snippet" class="task-last-output">
              {{ task.last_output_snippet }}
            </div>
            <div class="task-footer">
              <span class="run-count">
                <font-awesome-icon icon="fa-solid fa-arrows-rotate" class="footer-icon" />
                {{ $t('chat.scheduledTasks.runCount', { count: task.run_count }) }}
              </span>
              <span v-if="task.last_error" class="error-hint">{{ task.last_error }}</span>
              <span class="open-hint">
                {{ $t('chat.scheduledTasks.viewRuns') }}
                <font-awesome-icon icon="fa-solid fa-chevron-right" />
              </span>
            </div>
          </el-card>
        </div>

        <div v-if="tasks.length > pageSize" class="pager">
          <pagination :current-page="page" :page-size="pageSize" :total="tasks.length" @change="onPageChange" />
        </div>
      </template>
    </div>

    <!-- Run history drawer -->
    <el-drawer
      v-model="showRunHistory"
      :title="selectedTask?.name"
      direction="rtl"
      size="min(560px, 92vw)"
      class="run-history-drawer"
    >
      <div v-if="selectedTask" class="run-context">
        <div class="run-context-meta">
          <span>{{ scheduleLabel(selectedTask.schedule) }}</span>
          <span>{{ selectedTask.template.model }}</span>
          <span>{{ $t('chat.scheduledTasks.runCount', { count: selectedTask.run_count }) }}</span>
        </div>
        <div class="run-context-prompt">{{ selectedTask.template.question }}</div>
      </div>
      <el-skeleton v-if="runsLoading" :rows="3" animated />
      <el-empty v-else-if="!runs.length" :description="$t('chat.scheduledTasks.noRuns')" />
      <div v-else class="run-list">
        <div
          v-for="run in pagedRuns"
          :key="run.id"
          class="run-item"
          :class="{ clickable: !!run.conversation_id }"
          :tabindex="run.conversation_id ? 0 : -1"
          :role="run.conversation_id ? 'button' : undefined"
          @click="openRun(run)"
          @keydown.enter="openRun(run)"
          @keydown.space.prevent="openRun(run)"
        >
          <div class="run-body">
            <div class="run-line">
              <span class="run-title">{{ run.conversation_title || formatTime(run.scheduled_at) }}</span>
              <el-tag size="small" :type="runTagType(run.status)" effect="dark" round class="run-tag">
                {{ $t(`chat.scheduledTasks.run.${run.status}`) }}
              </el-tag>
            </div>
            <div v-if="run.conversation_preview" class="run-preview">{{ run.conversation_preview }}</div>
            <div class="run-sub">
              <span class="run-time">{{ formatTime(run.scheduled_at) }}</span>
              <span v-if="run.error_code || run.error_message" class="run-error" :title="runErrorText(run)">
                {{ runErrorText(run) }}
              </span>
            </div>
          </div>
          <div class="run-action">
            <font-awesome-icon v-if="run.conversation_id" icon="fa-solid fa-chevron-right" class="run-arrow" />
            <span v-else class="run-noconv">{{ $t('chat.scheduledTasks.noConversation') }}</span>
          </div>
        </div>
      </div>
      <div v-if="!runsLoading && runs.length > runPageSize" class="pager run-pager">
        <pagination :current-page="runPage" :page-size="runPageSize" :total="runs.length" @change="onRunPageChange" />
      </div>
    </el-drawer>

    <!-- Create / edit dialog -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingTask ? $t('chat.scheduledTasks.edit') : $t('chat.scheduledTasks.create')"
      width="540px"
      :close-on-click-modal="false"
      class="scheduled-task-dialog"
    >
      <el-form :model="form" label-width="92px">
        <el-form-item :label="$t('chat.scheduledTasks.form.prompt')" required>
          <el-input
            v-model="form.question"
            type="textarea"
            :rows="6"
            :placeholder="$t('chat.scheduledTasks.form.promptPlaceholder')"
          />
          <div class="hint">{{ $t('chat.scheduledTasks.form.promptHint') }}</div>
        </el-form-item>

        <el-form-item :label="$t('chat.scheduledTasks.form.model')">
          <el-select v-model="form.model" style="width: 100%" filterable>
            <el-option-group v-for="g in modelGroups" :key="g.name" :label="g.getDisplayName()">
              <el-option v-for="m in g.models" :key="m.name" :label="m.getDisplayName()" :value="m.name" />
            </el-option-group>
          </el-select>
        </el-form-item>

        <el-form-item :label="$t('chat.scheduledTasks.form.schedule')">
          <el-radio-group v-model="form.scheduleType">
            <el-radio value="minutely">{{ $t('chat.scheduledTasks.scheduleType.minutely') }}</el-radio>
            <el-radio value="daily">{{ $t('chat.scheduledTasks.scheduleType.daily') }}</el-radio>
            <el-radio value="hourly">{{ $t('chat.scheduledTasks.scheduleType.hourly') }}</el-radio>
            <el-radio value="weekly">{{ $t('chat.scheduledTasks.scheduleType.weekly') }}</el-radio>
            <el-radio value="cron">{{ $t('chat.scheduledTasks.scheduleType.cron') }}</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item v-if="form.scheduleType === 'daily'" :label="$t('chat.scheduledTasks.form.time')">
          <el-time-picker v-model="form.dailyTime" format="HH:mm" value-format="HH:mm" />
          <span class="jitter-hint">{{ $t('chat.scheduledTasks.jitterHint') }}</span>
        </el-form-item>

        <el-form-item v-if="form.scheduleType === 'weekly'" :label="$t('chat.scheduledTasks.form.weekday')">
          <el-select v-model="form.weekday" style="width: 120px">
            <el-option v-for="(d, i) in weekdays" :key="i" :label="d" :value="i" />
          </el-select>
          <el-time-picker v-model="form.dailyTime" format="HH:mm" value-format="HH:mm" style="margin-left: 8px" />
        </el-form-item>

        <el-form-item v-if="form.scheduleType === 'cron'" :label="$t('chat.scheduledTasks.form.cron')">
          <el-input v-model="form.cronExpr" placeholder="0 9 * * *" />
        </el-form-item>

        <el-form-item :label="$t('chat.scheduledTasks.form.skills')">
          <el-select
            v-model="form.authorizedSkills"
            style="width: 100%"
            multiple
            filterable
            collapse-tags
            collapse-tags-tooltip
            :loading="skillsLoading"
            :placeholder="$t('chat.scheduledTasks.form.skillsPlaceholder')"
            @visible-change="onSkillSelectVisible"
          >
            <el-option
              v-for="skill in authorizableSkills"
              :key="skill.slug"
              :label="skillLabel(skill)"
              :value="skill.slug"
              :disabled="!skill.connected"
            >
              <div class="skill-option">
                <span class="skill-option-name">{{ skillLabel(skill) }}</span>
                <span v-if="!skill.connected" class="skill-option-missing">
                  {{ $t('chat.scheduledTasks.form.skillMissing') }}
                </span>
              </div>
            </el-option>
          </el-select>
          <div class="hint">{{ $t('chat.scheduledTasks.form.skillsHint') }}</div>
        </el-form-item>

        <el-form-item :label="$t('chat.scheduledTasks.form.mcpServers')">
          <el-select
            v-model="form.authorizedMcpServers"
            style="width: 100%"
            multiple
            filterable
            collapse-tags
            collapse-tags-tooltip
            :loading="skillsLoading"
            :placeholder="$t('chat.scheduledTasks.form.mcpServersPlaceholder')"
            @visible-change="onSkillSelectVisible"
          >
            <el-option
              v-for="server in authorizableMcpServers"
              :key="server.slug"
              :label="mcpServerLabel(server)"
              :value="server.slug"
            />
          </el-select>
          <div class="hint">{{ $t('chat.scheduledTasks.form.mcpServersHint') }}</div>
        </el-form-item>

        <el-form-item :label="$t('chat.scheduledTasks.form.maxTurns')">
          <el-input-number v-model="form.maxTurns" :min="1" :max="50" :step="1" controls-position="right" />
          <div class="hint">{{ $t('chat.scheduledTasks.form.maxTurnsHint') }}</div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showCreateDialog = false">{{ $t('common.button.cancel') }}</el-button>
        <el-button type="primary" :loading="saving" @click="saveTask">
          {{ $t('common.button.confirm') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  ElButton,
  ElCard,
  ElSkeleton,
  ElEmpty,
  ElSwitch,
  ElTag,
  ElDrawer,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElSelect,
  ElOption,
  ElOptionGroup,
  ElRadioGroup,
  ElRadio,
  ElTimePicker,
  ElInputNumber,
  ElMessage,
  ElMessageBox
} from 'element-plus';
import Pagination from '@/components/common/Pagination.vue';
import {
  scheduledTasksOperator,
  IScheduledTask,
  IScheduledRun,
  IScheduleSpec,
  IAuthorizableSkill,
  IAuthorizableMcpServer
} from '@/operators/scheduledTasks';
import { CHAT_MODEL_GROUPS, CHAT_MODEL_NAME_GPT_5_4_MINI } from '@/constants';
import { IChatModelGroup } from '@/models';

const USER_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Shanghai';

// Default agent turn budget for a scheduled task run. Mirrors the worker's
// DEFAULT_SCHEDULED_MAX_TURNS; the worker clamps to [1, 50] regardless.
const DEFAULT_SCHEDULED_MAX_TURNS = 50;

interface TaskForm {
  question: string;
  model: string;
  scheduleType: 'minutely' | 'daily' | 'hourly' | 'weekly' | 'cron';
  dailyTime: string;
  weekday: number;
  cronExpr: string;
  authorizedSkills: string[];
  authorizedMcpServers: string[];
  maxTurns: number;
}

export default defineComponent({
  name: 'ScheduledTasks',
  components: {
    FontAwesomeIcon,
    ElButton,
    ElCard,
    ElSkeleton,
    ElEmpty,
    ElSwitch,
    ElTag,
    ElDrawer,
    ElDialog,
    ElForm,
    ElFormItem,
    ElInput,
    ElSelect,
    ElOption,
    ElOptionGroup,
    ElRadioGroup,
    ElRadio,
    ElTimePicker,
    ElInputNumber,
    Pagination
  },
  data() {
    return {
      tasks: [] as IScheduledTask[],
      runs: [] as IScheduledRun[],
      loading: false,
      runsLoading: false,
      skillsLoading: false,
      saving: false,
      showCreateDialog: false,
      showRunHistory: false,
      selectedTask: null as IScheduledTask | null,
      editingTask: null as IScheduledTask | null,
      authorizableSkills: [] as IAuthorizableSkill[],
      authorizableMcpServers: [] as IAuthorizableMcpServer[],
      weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      page: 1,
      pageSize: 6,
      runPage: 1,
      runPageSize: 8,
      form: this.emptyForm() as TaskForm
    };
  },
  computed: {
    token(): string | undefined {
      return this.$store.state.chat?.credential?.token;
    },
    // Models from site-enabled chat services, grouped by provider (mirrors nav gating).
    modelGroups(): IChatModelGroup[] {
      const features = (this.$store.state.site?.features ?? {}) as Record<string, { enabled?: boolean }>;
      return CHAT_MODEL_GROUPS.filter((g) => features[g.name]?.enabled !== false)
        .map((g) => ({ ...g, models: g.models.filter((m) => m.enabled !== false) }))
        .filter((g) => g.models.length > 0);
    },
    pagedTasks(): IScheduledTask[] {
      const start = (this.page - 1) * this.pageSize;
      return this.tasks.slice(start, start + this.pageSize);
    },
    pagedRuns(): IScheduledRun[] {
      const start = (this.runPage - 1) * this.runPageSize;
      return this.runs.slice(start, start + this.runPageSize);
    }
  },
  async mounted() {
    await this.loadTasks();
  },
  methods: {
    emptyForm(): TaskForm {
      return {
        question: '',
        model: CHAT_MODEL_NAME_GPT_5_4_MINI,
        scheduleType: 'daily',
        dailyTime: '09:00',
        weekday: 1,
        cronExpr: '0 9 * * *',
        authorizedSkills: [],
        authorizedMcpServers: [],
        maxTurns: DEFAULT_SCHEDULED_MAX_TURNS
      };
    },
    // The task name is no longer a separate field — derive a short label from the prompt.
    deriveName(question: string): string {
      const firstLine = (question || '').trim().split('\n')[0].trim();
      return firstLine.length > 40 ? `${firstLine.slice(0, 40)}…` : firstLine || 'Scheduled Task';
    },
    async loadTasks() {
      if (!this.token) return;
      this.loading = true;
      try {
        this.tasks = await scheduledTasksOperator.listTasks(this.token);
        // Clamp the page in case deletions shrank the list past the current page.
        const maxPage = Math.max(1, Math.ceil(this.tasks.length / this.pageSize));
        if (this.page > maxPage) this.page = maxPage;
      } catch {
        ElMessage.error(this.$t('chat.scheduledTasks.loadError') as string);
      } finally {
        this.loading = false;
      }
    },
    async selectTask(task: IScheduledTask) {
      this.selectedTask = task;
      this.showRunHistory = true;
      this.runPage = 1;
      this.runsLoading = true;
      try {
        this.runs = await scheduledTasksOperator.listRuns(this.token!, task.id);
      } finally {
        this.runsLoading = false;
      }
    },
    onPageChange(p: number) {
      this.page = p;
    },
    onRunPageChange(p: number) {
      this.runPage = p;
    },
    openEdit(task: IScheduledTask) {
      this.editingTask = task;
      const s = task.schedule;
      let scheduleType: TaskForm['scheduleType'] = 'cron';
      let dailyTime = '09:00';
      let cronExpr = '0 9 * * *';
      let weekday = 1;
      if (s.type === 'cron') {
        cronExpr = s.cron;
        const parts = s.cron.split(' ');
        if (parts.length === 5) {
          const [min, hour, , , dow] = parts;
          if (dow === '*' && !isNaN(Number(hour))) {
            scheduleType = 'daily';
            dailyTime = `${hour.padStart(2, '0')}:${min.padStart(2, '0')}`;
          } else if (!isNaN(Number(dow))) {
            scheduleType = 'weekly';
            weekday = Number(dow);
            dailyTime = `${hour.padStart(2, '0')}:${min.padStart(2, '0')}`;
          }
        }
      } else if (s.type === 'interval') {
        if (s.interval_seconds === 60) scheduleType = 'minutely';
        else if (s.interval_seconds === 3600) scheduleType = 'hourly';
        else scheduleType = 'cron';
      }
      this.form = {
        question: task.template.question,
        model: task.template.model,
        scheduleType,
        dailyTime,
        weekday,
        cronExpr,
        authorizedSkills:
          task.unattended_policy?.mode === 'allow_selected' || task.unattended_policy?.mode === 'allow_selected_skills'
            ? task.unattended_policy.allowed_skills || []
            : [],
        authorizedMcpServers:
          task.unattended_policy?.mode === 'allow_selected' || task.unattended_policy?.mode === 'allow_selected_skills'
            ? task.unattended_policy.allowed_mcp_servers || []
            : [],
        maxTurns: task.template.max_turns ?? DEFAULT_SCHEDULED_MAX_TURNS
      };
      this.showCreateDialog = true;
      void this.loadAuthorizableSkills();
    },
    buildSchedule(): IScheduleSpec {
      const { scheduleType, dailyTime, weekday, cronExpr } = this.form;
      if (scheduleType === 'minutely') {
        return { type: 'interval', interval_seconds: 60, tz: USER_TZ };
      }
      if (scheduleType === 'hourly') {
        return { type: 'interval', interval_seconds: 3600, tz: USER_TZ };
      }
      if (scheduleType === 'daily') {
        const [h, m] = dailyTime.split(':');
        return { type: 'cron', cron: `${m} ${h} * * *`, tz: USER_TZ };
      }
      if (scheduleType === 'weekly') {
        const [h, m] = dailyTime.split(':');
        return { type: 'cron', cron: `${m} ${h} * * ${weekday}`, tz: USER_TZ };
      }
      return { type: 'cron', cron: cronExpr, tz: USER_TZ };
    },
    async saveTask() {
      if (!this.form.question.trim()) {
        ElMessage.warning(this.$t('chat.scheduledTasks.form.required') as string);
        return;
      }
      this.saving = true;
      try {
        if (this.form.authorizedSkills.length > 0 || this.form.authorizedMcpServers.length > 0) {
          await ElMessageBox.confirm(this.authorizationConfirmText(), this.$t('chat.scheduledTasks.form.skillsConfirmTitle') as string, {
            type: 'warning',
            confirmButtonText: this.$t('common.button.confirm') as string,
            cancelButtonText: this.$t('common.button.cancel') as string
          });
        }
        const authorizedSkills = [...this.form.authorizedSkills];
        const authorizedMcpServers = [...this.form.authorizedMcpServers];
        const payload = {
          name: this.deriveName(this.form.question),
          schedule: this.buildSchedule(),
          template: {
            model: this.form.model,
            question: this.form.question,
            skills: authorizedSkills,
            mcp_servers: authorizedMcpServers,
            max_turns: this.form.maxTurns
          },
          unattended_policy: authorizedSkills.length || authorizedMcpServers.length
            ? {
                mode: 'allow_selected' as const,
                allowed_skills: authorizedSkills,
                allowed_mcp_servers: authorizedMcpServers
              }
            : { mode: 'deny_all' as const, allowed_skills: [], allowed_mcp_servers: [] }
        };
        if (this.editingTask) {
          await scheduledTasksOperator.updateTask(this.token!, this.editingTask.id, payload);
        } else {
          await scheduledTasksOperator.createTask(this.token!, payload);
        }
        ElMessage.success(this.$t('chat.scheduledTasks.create') as string + ' OK');
        this.showCreateDialog = false;
        this.editingTask = null;
        this.form = this.emptyForm();
        await this.loadTasks();
      } catch {
        ElMessage.error(this.$t('chat.scheduledTasks.loadError') as string);
      } finally {
        this.saving = false;
      }
    },
    async loadAuthorizableSkills(force = false) {
      if (!this.token || this.skillsLoading || (!force && (this.authorizableSkills.length || this.authorizableMcpServers.length))) return;
      this.skillsLoading = true;
      try {
        const capabilities = await scheduledTasksOperator.listAuthorizableCapabilities(this.token);
        this.authorizableSkills = capabilities.skills;
        this.authorizableMcpServers = capabilities.mcp_servers;
      } catch {
        ElMessage.error(this.$t('chat.scheduledTasks.loadError') as string);
      } finally {
        this.skillsLoading = false;
      }
    },
    onSkillSelectVisible(visible: boolean) {
      if (visible) void this.loadAuthorizableSkills(true);
    },
    skillLabel(skill: IAuthorizableSkill) {
      return skill.name || skill.slug;
    },
    mcpServerLabel(server: IAuthorizableMcpServer) {
      return server.name || server.slug;
    },
    authorizationConfirmText() {
      const selected = new Set(this.form.authorizedSkills);
      const selectedMcp = new Set(this.form.authorizedMcpServers);
      const names = this.authorizableSkills
        .filter((skill) => selected.has(skill.slug))
        .map((skill) => this.skillLabel(skill));
      const mcpNames = this.authorizableMcpServers
        .filter((server) => selectedMcp.has(server.slug))
        .map((server) => this.mcpServerLabel(server));
      return this.$t('chat.scheduledTasks.form.skillsConfirm', {
        count: selected.size + selectedMcp.size,
        skills: [...names, ...mcpNames].length
          ? [...names, ...mcpNames].join(', ')
          : [...Array.from(selected), ...Array.from(selectedMcp)].join(', ')
      }) as string;
    },
    async toggleState(task: IScheduledTask, enabled: boolean) {
      await scheduledTasksOperator.updateTask(this.token!, task.id, {
        state: enabled ? 'enabled' : 'disabled'
      });
      await this.loadTasks();
    },
    async confirmDelete(task: IScheduledTask) {
      await ElMessageBox.confirm(
        this.$t('chat.scheduledTasks.deleteConfirm', { name: task.name }) as string,
        { type: 'warning' }
      );
      await scheduledTasksOperator.deleteTask(this.token!, task.id);
      await this.loadTasks();
    },
    openRun(run: IScheduledRun) {
      if (!run.conversation_id) return;
      // The route prefix must be a chat group that actually owns a
      // /<group>/conversations/:id route. Prefer the run's own conversation
      // group when it is one we can open; otherwise fall back to the current
      // chat group (a modelGroup object — use its `.name`), then to chatgpt.
      const known: string[] = this.modelGroups.map((g) => g.name);
      const runGroup = run.conversation_model_group;
      const fallback = this.$store.state.chat?.modelGroup?.name || 'chatgpt';
      const modelGroup = runGroup && (known.length === 0 || known.includes(runGroup)) ? runGroup : fallback;
      this.$router.push(`/${modelGroup}/conversations/${run.conversation_id}`);
    },
    stateTagType(state: string) {
      return state === 'enabled' ? 'success' : state === 'error' ? 'danger' : 'info';
    },
    runTagType(status: string) {
      return status === 'success' ? 'success' : status === 'failed' ? 'danger' : 'warning';
    },
    runErrorText(run: IScheduledRun) {
      return run.error_message || run.error_code?.replace(/_/g, ' ') || '';
    },
    scheduleLabel(s: IScheduleSpec) {
      if (s.type === 'interval') return `每 ${s.interval_seconds / 60} 分钟`;
      if (s.type === 'cron') return `Cron: ${s.cron}`;
      return `一次性: ${new Date(s.at * 1000).toLocaleString()}`;
    },
    formatTime(ts: number) {
      return new Date(ts * 1000).toLocaleString();
    }
  }
});
</script>

<style lang="scss" scoped>
.scheduled-tasks {
  height: 100%;
  overflow-y: auto;
  background: var(--app-bg-section);
}
.inner {
  max-width: 880px;
  margin: 0 auto;
  padding: 24px 20px 48px;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.title {
  font-size: 20px;
  font-weight: 700;
  margin: 0;
  color: var(--el-text-color-primary);
}
.header .icon {
  margin-right: 6px;
}
.loading-block {
  padding: 12px 4px;
}
.task-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.task-card {
  border-radius: 16px;
  border: 1px solid var(--app-border-subtle, var(--el-border-color-light));
  cursor: pointer;
  transition:
    transform 0.16s ease,
    box-shadow 0.16s ease,
    border-color 0.16s ease;
  :deep(.el-card__body) {
    padding: 16px 18px;
  }
  &:hover {
    transform: translateY(-2px);
    border-color: var(--el-border-color);
  }
}
.task-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 10px;
}
.task-name {
  font-weight: 600;
  font-size: 15px;
  line-height: 1.4;
  color: var(--el-text-color-primary);
  word-break: break-word;
}
.task-actions {
  display: flex;
  gap: 2px;
  align-items: center;
  flex-shrink: 0;
}
.icon-action {
  padding: 6px 8px;
}
.task-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 10px;
}
.meta-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  border-radius: 8px;
  padding: 3px 9px;
}
.meta-icon {
  font-size: 11px;
  opacity: 0.85;
}
.task-prompt {
  font-size: 13px;
  line-height: 1.55;
  color: var(--el-text-color-regular);
  white-space: pre-line;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.task-last-output {
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
  margin-top: 10px;
  padding: 10px 12px;
  background: var(--el-fill-color-lighter);
  border-radius: 10px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.task-footer {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 12px;
}
.run-count {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.footer-icon {
  font-size: 11px;
  opacity: 0.85;
}
.error-hint {
  color: var(--el-color-danger);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.open-hint {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--el-color-primary);
  flex-shrink: 0;
}
.empty {
  padding: 60px 0;
}
.pager {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
.run-pager {
  margin-top: 8px;
}
.run-context {
  margin-bottom: 14px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--app-border-subtle, var(--el-border-color-lighter));
}
.run-context-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.run-context-meta span + span::before {
  content: '·';
  margin-right: 8px;
  color: var(--el-text-color-placeholder);
}
.run-context-prompt {
  margin-top: 8px;
  font-size: 12px;
  line-height: 1.55;
  color: var(--el-text-color-secondary);
  white-space: pre-line;
  max-height: 48px;
  overflow: hidden;
}
.run-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.run-item {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px 14px;
  border: 1px solid var(--app-border-subtle, var(--el-border-color-lighter));
  border-radius: 14px;
  background: var(--app-bg-surface, var(--el-bg-color-overlay));
  transition:
    background 0.16s,
    border-color 0.16s;
}
.run-item.clickable {
  cursor: pointer;
}
.run-item.clickable:hover,
.run-item.clickable:focus-visible {
  background: var(--el-fill-color-lighter);
  border-color: var(--el-border-color);
  outline: none;
}
.run-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.run-line {
  display: flex;
  gap: 8px;
  align-items: center;
}
.run-title {
  min-width: 0;
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.run-tag {
  flex-shrink: 0;
}
.run-preview {
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.run-sub {
  display: flex;
  gap: 10px;
  align-items: center;
  min-width: 0;
}
.run-time {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.run-error {
  min-width: 0;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.run-action {
  display: flex;
  align-items: center;
  align-self: center;
  flex-shrink: 0;
}
.run-arrow {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  flex-shrink: 0;
}
.run-noconv {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  flex-shrink: 0;
}
.hint {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}
.jitter-hint {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  margin-left: 8px;
}
.skill-option { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-width: 0; }
.skill-option-name { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.skill-option-missing { flex-shrink: 0; font-size: 11px; color: var(--el-text-color-secondary); }
</style>

<style lang="scss">
/* Teleported overlays (drawer / dialog) — larger, softer corners.
   Non-scoped + uniquely-named classes so the rules reach the panels. */
.run-history-drawer.el-drawer,
.run-history-drawer .el-drawer {
  border-top-left-radius: 18px;
  border-bottom-left-radius: 18px;
  overflow: hidden;
}
.scheduled-task-dialog.el-dialog,
.scheduled-task-dialog .el-dialog {
  border-radius: 16px;
  overflow: hidden;
}
</style>
