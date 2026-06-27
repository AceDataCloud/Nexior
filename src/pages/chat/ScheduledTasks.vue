<template>
  <div class="scheduled-tasks">
    <div class="header">
      <h2 class="title">{{ $t('chat.scheduledTasks.title') }}</h2>
      <el-button type="primary" size="small" @click="showCreateDialog = true">
        <font-awesome-icon icon="fa-solid fa-plus" class="icon" />
        {{ $t('chat.scheduledTasks.create') }}
      </el-button>
    </div>

    <el-skeleton v-if="loading" :rows="4" animated />

    <el-empty
      v-else-if="!tasks.length"
      :description="$t('chat.scheduledTasks.empty')"
      class="empty"
    />

    <div v-else class="task-list">
      <div v-for="task in tasks" :key="task.id" class="task-card" @click="selectTask(task)">
        <div class="task-header">
          <div class="task-name">{{ task.name }}</div>
          <div class="task-actions" @click.stop>
            <el-switch
              :model-value="task.state === 'enabled'"
              size="small"
              @change="(v: string | number | boolean) => toggleState(task, v === true)"
            />
            <el-button size="small" text @click="openEdit(task)">
              <font-awesome-icon icon="fa-solid fa-pen" />
            </el-button>
            <el-button size="small" text type="danger" @click="confirmDelete(task)">
              <font-awesome-icon icon="fa-solid fa-trash" />
            </el-button>
          </div>
        </div>
        <div class="task-meta">
          <el-tag size="small" :type="stateTagType(task.state)">
            {{ $t(`chat.scheduledTasks.state.${task.state}`) }}
          </el-tag>
          <span class="schedule-label">{{ scheduleLabel(task.schedule) }}</span>
          <span class="model-label">{{ task.template.model }}</span>
        </div>
        <div class="task-prompt">{{ task.template.question }}</div>
        <div v-if="task.last_output_snippet" class="task-last-output">
          {{ task.last_output_snippet }}
        </div>
        <div class="task-footer">
          <span>{{ $t('chat.scheduledTasks.runCount', { count: task.run_count }) }}</span>
          <span v-if="task.last_error" class="error-hint">{{ task.last_error }}</span>
        </div>
      </div>
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
          v-for="run in runs"
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
              <el-tag size="small" :type="runTagType(run.status)" effect="light" class="run-tag">
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
            <font-awesome-icon
              v-if="run.conversation_id"
              icon="fa-solid fa-chevron-right"
              class="run-arrow"
            />
            <span v-else class="run-noconv">{{ $t('chat.scheduledTasks.noConversation') }}</span>
          </div>
        </div>
      </div>
    </el-drawer>

    <!-- Create / edit dialog -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingTask ? $t('chat.scheduledTasks.edit') : $t('chat.scheduledTasks.create')"
      width="540px"
      :close-on-click-modal="false"
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
  ElMessage,
  ElMessageBox
} from 'element-plus';
import { scheduledTasksOperator, IScheduledTask, IScheduledRun, IScheduleSpec } from '@/operators/scheduledTasks';
import { CHAT_MODEL_GROUPS, CHAT_MODEL_NAME_GPT_5_4_MINI } from '@/constants';
import { IChatModelGroup } from '@/models';

const USER_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Shanghai';

interface TaskForm {
  question: string;
  model: string;
  scheduleType: 'daily' | 'hourly' | 'weekly' | 'cron';
  dailyTime: string;
  weekday: number;
  cronExpr: string;
}

export default defineComponent({
  name: 'ScheduledTasks',
  components: {
    FontAwesomeIcon,
    ElButton,
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
    ElTimePicker
  },
  data() {
    return {
      tasks: [] as IScheduledTask[],
      runs: [] as IScheduledRun[],
      loading: false,
      runsLoading: false,
      saving: false,
      showCreateDialog: false,
      showRunHistory: false,
      selectedTask: null as IScheduledTask | null,
      editingTask: null as IScheduledTask | null,
      weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
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
        cronExpr: '0 9 * * *'
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
      } catch {
        ElMessage.error(this.$t('chat.scheduledTasks.loadError') as string);
      } finally {
        this.loading = false;
      }
    },
    async selectTask(task: IScheduledTask) {
      this.selectedTask = task;
      this.showRunHistory = true;
      this.runsLoading = true;
      try {
        this.runs = await scheduledTasksOperator.listRuns(this.token!, task.id);
      } finally {
        this.runsLoading = false;
      }
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
        scheduleType = s.interval_seconds === 3600 ? 'hourly' : 'cron';
      }
      this.form = {
        question: task.template.question,
        model: task.template.model,
        scheduleType,
        dailyTime,
        weekday,
        cronExpr
      };
      this.showCreateDialog = true;
    },
    buildSchedule(): IScheduleSpec {
      const { scheduleType, dailyTime, weekday, cronExpr } = this.form;
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
        const payload = {
          name: this.deriveName(this.form.question),
          schedule: this.buildSchedule(),
          template: { model: this.form.model, question: this.form.question }
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
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.title { font-size: 18px; font-weight: 600; margin: 0; }
.task-list { display: flex; flex-direction: column; gap: 12px; }
.task-card {
  background: var(--app-bg-surface, var(--el-bg-color-overlay));
  border: 1px solid var(--app-border-subtle, var(--el-border-color-light));
  border-radius: 8px;
  padding: 14px 16px;
  cursor: pointer;
  transition: background 0.16s, border-color 0.16s;
  &:hover {
    background: var(--el-fill-color-lighter);
    border-color: var(--el-border-color);
  }
}
.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.task-name { font-weight: 600; font-size: 14px; }
.task-actions { display: flex; gap: 6px; align-items: center; }
.task-meta { display: flex; gap: 8px; align-items: center; margin-bottom: 6px; font-size: 12px; color: var(--el-text-color-secondary); }
.task-prompt { font-size: 13px; color: var(--el-text-color-regular); white-space: pre-line; max-height: 48px; overflow: hidden; }
.task-last-output { font-size: 12px; color: var(--el-text-color-secondary); margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--app-border-subtle, var(--el-border-color-lighter)); }
.task-footer { display: flex; justify-content: space-between; font-size: 11px; color: var(--el-text-color-secondary); margin-top: 8px; }
.error-hint { color: var(--el-color-danger); }
.empty { padding: 60px 0; }
.run-context { margin-bottom: 14px; padding-bottom: 14px; border-bottom: 1px solid var(--app-border-subtle, var(--el-border-color-lighter)); }
.run-context-meta { display: flex; flex-wrap: wrap; gap: 8px; font-size: 12px; color: var(--el-text-color-secondary); }
.run-context-meta span + span::before { content: '·'; margin-right: 8px; color: var(--el-text-color-placeholder); }
.run-context-prompt { margin-top: 8px; font-size: 12px; line-height: 1.55; color: var(--el-text-color-secondary); white-space: pre-line; max-height: 48px; overflow: hidden; }
.run-list { display: flex; flex-direction: column; gap: 10px; }
.run-item { display: flex; gap: 12px; align-items: center; padding: 12px 14px; border: 1px solid var(--app-border-subtle, var(--el-border-color-lighter)); border-radius: 8px; background: var(--app-bg-surface, var(--el-bg-color-overlay)); transition: background 0.16s, border-color 0.16s; }
.run-item.clickable { cursor: pointer; }
.run-item.clickable:hover, .run-item.clickable:focus-visible { background: var(--el-fill-color-lighter); border-color: var(--el-border-color); outline: none; }
.run-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
.run-line { display: flex; gap: 8px; align-items: center; }
.run-title { min-width: 0; flex: 1; font-size: 14px; font-weight: 600; color: var(--el-text-color-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.run-tag { flex-shrink: 0; }
.run-preview { font-size: 12px; line-height: 1.5; color: var(--el-text-color-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.run-sub { display: flex; gap: 10px; align-items: center; min-width: 0; }
.run-time { font-size: 12px; color: var(--el-text-color-secondary); }
.run-error { min-width: 0; font-size: 11px; color: var(--el-text-color-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.run-action { display: flex; align-items: center; align-self: center; flex-shrink: 0; }
.run-arrow { color: var(--el-text-color-secondary); font-size: 12px; flex-shrink: 0; }
.run-noconv { font-size: 11px; color: var(--el-text-color-secondary); flex-shrink: 0; }
.hint { font-size: 11px; color: var(--el-text-color-secondary); margin-top: 4px; }
.jitter-hint { font-size: 11px; color: var(--el-text-color-secondary); margin-left: 8px; }
</style>
