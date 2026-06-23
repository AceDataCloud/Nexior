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
      size="50%"
    >
      <el-skeleton v-if="runsLoading" :rows="3" animated />
      <el-empty v-else-if="!runs.length" :description="$t('chat.scheduledTasks.noRuns')" />
      <div v-else class="run-list">
        <div v-for="run in runs" :key="run.id" class="run-item">
          <div class="run-status">
            <el-tag size="small" :type="runTagType(run.status)">
              {{ $t(`chat.scheduledTasks.run.${run.status}`) }}
            </el-tag>
          </div>
          <div class="run-time">{{ formatTime(run.scheduled_at) }}</div>
          <div v-if="run.conversation_id" class="run-link">
            <el-button text size="small" @click="goToConversation(run.conversation_id)">
              {{ $t('chat.scheduledTasks.viewResult') }}
            </el-button>
          </div>
          <div v-if="run.error_code" class="run-error">{{ run.error_code }}</div>
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
      <el-form :model="form" label-width="100px" size="small">
        <el-form-item :label="$t('chat.scheduledTasks.form.name')" required>
          <el-input v-model="form.name" :placeholder="$t('chat.scheduledTasks.form.namePlaceholder')" />
        </el-form-item>

        <el-form-item :label="$t('chat.scheduledTasks.form.model')">
          <el-select v-model="form.model" style="width: 100%">
            <el-option v-for="m in availableModels" :key="m" :label="m" :value="m" />
          </el-select>
        </el-form-item>

        <el-form-item :label="$t('chat.scheduledTasks.form.prompt')" required>
          <el-input
            v-model="form.question"
            type="textarea"
            :rows="4"
            :placeholder="$t('chat.scheduledTasks.form.promptPlaceholder')"
          />
          <div class="hint">{{ $t('chat.scheduledTasks.form.promptHint') }}</div>
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
  ElRadioGroup,
  ElRadio,
  ElTimePicker,
  ElMessage,
  ElMessageBox
} from 'element-plus';
import { scheduledTasksOperator, IScheduledTask, IScheduledRun, IScheduleSpec } from '@/operators/scheduledTasks';

const COMMON_CHAT_MODELS = [
  'gpt-4o', 'gpt-4o-mini', 'gpt-4.1', 'gpt-4.1-mini',
  'claude-opus-4-8', 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001',
  'gemini-2.5-flash', 'gemini-2.5-pro',
  'deepseek-v3', 'deepseek-r1',
];

const USER_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Shanghai';

interface TaskForm {
  name: string;
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
      availableModels: COMMON_CHAT_MODELS,
      weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      form: this.emptyForm() as TaskForm
    };
  },
  computed: {
    token(): string | undefined {
      return this.$store.state.chat?.credential?.token;
    }
  },
  async mounted() {
    await this.loadTasks();
  },
  methods: {
    emptyForm(): TaskForm {
      return {
        name: '',
        question: '',
        model: 'gpt-4o-mini',
        scheduleType: 'daily',
        dailyTime: '09:00',
        weekday: 1,
        cronExpr: '0 9 * * *'
      };
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
        name: task.name,
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
      if (!this.form.name.trim() || !this.form.question.trim()) {
        ElMessage.warning(this.$t('chat.scheduledTasks.form.required') as string);
        return;
      }
      this.saving = true;
      try {
        const payload = {
          name: this.form.name,
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
    goToConversation(id: string) {
      const modelGroup = this.$store.state.chat?.modelGroup ?? 'chatgpt';
      this.$router.push(`/${modelGroup}/conversations/${id}`);
    },
    stateTagType(state: string) {
      return state === 'enabled' ? 'success' : state === 'error' ? 'danger' : 'info';
    },
    runTagType(status: string) {
      return status === 'success' ? 'success' : status === 'failed' ? 'danger' : 'warning';
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
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  padding: 14px 16px;
  cursor: pointer;
  transition: box-shadow 0.2s;
  &:hover { box-shadow: 0 2px 8px rgba(0,0,0,.08); }
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
.task-last-output { font-size: 12px; color: var(--el-text-color-secondary); margin-top: 6px; font-style: italic; }
.task-footer { display: flex; justify-content: space-between; font-size: 11px; color: var(--el-text-color-secondary); margin-top: 8px; }
.error-hint { color: var(--el-color-danger); }
.empty { padding: 60px 0; }
.run-list { display: flex; flex-direction: column; gap: 10px; }
.run-item { display: flex; gap: 12px; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--el-border-color-lighter); }
.run-time { font-size: 12px; color: var(--el-text-color-secondary); }
.run-error { font-size: 11px; color: var(--el-color-danger); }
.hint { font-size: 11px; color: var(--el-text-color-secondary); margin-top: 4px; }
.jitter-hint { font-size: 11px; color: var(--el-text-color-secondary); margin-left: 8px; }
</style>
