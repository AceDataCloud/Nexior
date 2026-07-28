<template>
  <div class="scheduled-tasks">
    <div class="inner">
      <div class="header">
        <h2 class="title">{{ $t('chat.scheduledTasks.title') }}</h2>
        <el-button v-if="activeTab === 'tasks'" type="primary" round :disabled="saving" @click="openCreate">
          <add-icon :size="16" class="icon" aria-hidden="true" focusable="false" />
          {{ $t('chat.scheduledTasks.create') }}
        </el-button>
      </div>

      <div class="tabs" role="tablist" :aria-label="$t('chat.scheduledTasks.title')">
        <button
          v-for="tab in tabs"
          :key="tab"
          type="button"
          role="tab"
          class="tab"
          :class="{ active: activeTab === tab }"
          :aria-selected="activeTab === tab"
          @click="switchTab(tab)"
        >
          {{ $t(`chat.scheduledTasks.tab.${tab}`) }}
        </button>
      </div>

      <template v-if="activeTab === 'tasks'">
        <el-skeleton v-if="loading" :rows="4" animated class="loading-block" />

        <el-empty v-else-if="!tasks.length" :description="$t('chat.scheduledTasks.empty')" class="empty" />

        <template v-else>
          <div class="task-list">
            <el-card
              v-for="task in pagedTasks"
              :key="task.id"
              class="task-card"
              shadow="hover"
              @click="selectTask(task)"
            >
              <div class="task-top">
                <div class="task-name">{{ task.name }}</div>
                <div class="task-actions" @click.stop>
                  <el-switch
                    :model-value="task.state === 'enabled'"
                    @change="(v: string | number | boolean) => toggleState(task, v === true)"
                  />
                  <el-tooltip :content="$t('chat.scheduledTasks.triggerNow')" placement="top">
                    <el-button
                      text
                      class="icon-action"
                      :loading="triggeringId === task.id"
                      :aria-label="$t('chat.scheduledTasks.triggerNow')"
                      :title="$t('chat.scheduledTasks.triggerNow')"
                      @click="triggerNow(task)"
                    >
                      <play-icon
                        v-if="triggeringId !== task.id"
                        :size="'1em' as any"
                        aria-hidden="true"
                        focusable="false"
                      />
                    </el-button>
                  </el-tooltip>
                  <el-tooltip :content="$t('common.button.edit')" placement="top">
                    <el-button text class="icon-action" :aria-label="$t('common.button.edit')" @click="openEdit(task)">
                      <edit-icon :size="16" aria-hidden="true" focusable="false" />
                    </el-button>
                  </el-tooltip>
                  <el-tooltip :content="$t('common.button.delete')" placement="top">
                    <el-button
                      text
                      type="danger"
                      class="icon-action"
                      :aria-label="$t('common.button.delete')"
                      @click="confirmDelete(task)"
                    >
                      <delete-icon :size="16" aria-hidden="true" focusable="false" />
                    </el-button>
                  </el-tooltip>
                </div>
              </div>
              <div class="task-meta">
                <el-tag size="small" :type="stateTagType(task.state)" effect="dark" round>
                  {{ $t(`chat.scheduledTasks.state.${task.state}`) }}
                </el-tag>
                <span class="meta-chip">
                  <time-icon class="meta-icon" :size="'1em' as any" aria-hidden="true" focusable="false" />
                  {{ scheduleLabel(task.schedule) }}
                </span>
                <span class="meta-chip">
                  <ai-icon class="meta-icon" :size="'1em' as any" aria-hidden="true" focusable="false" />
                  {{ task.template.model }}
                </span>
              </div>
              <div class="task-prompt">{{ task.template.question }}</div>
              <div v-if="task.last_output_snippet" class="task-last-output">
                {{ task.last_output_snippet }}
              </div>
              <div class="task-footer">
                <span class="run-count">
                  <refresh-icon :size="16" class="footer-icon" aria-hidden="true" focusable="false" />
                  {{ $t('chat.scheduledTasks.runCount', { count: task.run_count }) }}
                </span>
                <span v-if="task.last_error" class="error-hint">{{ errorCodeText(task.last_error) }}</span>
                <span class="open-hint">
                  {{ $t('chat.scheduledTasks.viewRuns') }}
                  <expand-right-icon :size="'1em' as any" aria-hidden="true" focusable="false" />
                </span>
              </div>
            </el-card>
          </div>

          <div v-if="tasks.length > pageSize" class="pager">
            <pagination :current-page="page" :page-size="pageSize" :total="tasks.length" @change="onPageChange" />
          </div>
        </template>
      </template>

      <template v-else>
        <div class="filters" role="group" :aria-label="$t('chat.scheduledTasks.tab.runs')">
          <button
            v-for="opt in statusFilters"
            :key="opt"
            type="button"
            class="filter-chip"
            :class="{ active: allRunsStatus === opt }"
            :aria-pressed="allRunsStatus === opt"
            @click="onStatusFilter(opt)"
          >
            {{ opt === 'all' ? $t('chat.scheduledTasks.filterAll') : $t(`chat.scheduledTasks.run.${opt}`) }}
          </button>
        </div>

        <el-skeleton v-if="allRunsLoading" :rows="4" animated class="loading-block" />

        <el-empty v-else-if="!allRuns.length" :description="$t('chat.scheduledTasks.noRuns')" class="empty" />

        <template v-else>
          <div class="run-list">
            <div
              v-for="run in allRuns"
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
                  <el-tag v-if="run.task_name" size="small" type="info" round class="run-task-tag">
                    {{ run.task_name }}
                  </el-tag>
                  <el-tag
                    v-for="(account, index) in run.run_accounts"
                    :key="`${account.connector_identifier}-${index}`"
                    size="small"
                    type="info"
                    round
                    class="run-account-tag"
                  >
                    {{ accountTagText(account) }}
                  </el-tag>
                  <span class="run-time">{{ formatTime(run.scheduled_at) }}</span>
                  <span
                    v-if="runOutcomeText(run)"
                    :class="run.status === 'success' ? 'run-outcome' : 'run-error'"
                    :title="runOutcomeText(run)"
                  >
                    {{ runOutcomeText(run) }}
                  </span>
                </div>
              </div>
              <div class="run-action">
                <expand-right-icon
                  v-if="run.conversation_id"
                  class="run-arrow"
                  :size="'1em' as any"
                  aria-hidden="true"
                  focusable="false"
                />
                <span v-else class="run-noconv">{{ $t('chat.scheduledTasks.noConversation') }}</span>
              </div>
            </div>
          </div>

          <div v-if="allRunsCount > allRunsPageSize" class="pager">
            <pagination
              :current-page="allRunsPage"
              :page-size="allRunsPageSize"
              :total="allRunsCount"
              @change="onAllRunsPageChange"
            />
          </div>
        </template>
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
              <el-tag
                v-for="(account, index) in run.run_accounts"
                :key="`${account.connector_identifier}-${index}`"
                size="small"
                type="info"
                round
                class="run-account-tag"
              >
                {{ accountTagText(account) }}
              </el-tag>
              <span class="run-time">{{ formatTime(run.scheduled_at) }}</span>
              <span
                v-if="runOutcomeText(run)"
                :class="run.status === 'success' ? 'run-outcome' : 'run-error'"
                :title="runOutcomeText(run)"
              >
                {{ runOutcomeText(run) }}
              </span>
            </div>
          </div>
          <div class="run-action">
            <expand-right-icon
              v-if="run.conversation_id"
              class="run-arrow"
              :size="'1em' as any"
              aria-hidden="true"
              focusable="false"
            />
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
      :close-on-press-escape="!saving"
      :show-close="!saving"
      class="scheduled-task-dialog"
    >
      <el-form :model="form" label-width="92px">
        <el-form-item :label="$t('chat.scheduledTasks.form.name')">
          <el-input v-model="form.name" :placeholder="$t('chat.scheduledTasks.form.namePlaceholder')" maxlength="80" />
        </el-form-item>

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
            <el-radio value="interval">{{ $t('chat.scheduledTasks.scheduleType.interval') }}</el-radio>
            <el-radio value="hourly">{{ $t('chat.scheduledTasks.scheduleType.hourly') }}</el-radio>
            <el-radio value="daily">{{ $t('chat.scheduledTasks.scheduleType.daily') }}</el-radio>
            <el-radio value="weekly">{{ $t('chat.scheduledTasks.scheduleType.weekly') }}</el-radio>
            <el-radio value="cron">{{ $t('chat.scheduledTasks.scheduleType.cron') }}</el-radio>
          </el-radio-group>
          <div v-if="schedulePreview" class="schedule-preview">
            <time-icon class="preview-icon" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('chat.scheduledTasks.form.schedulePreview', { text: schedulePreview }) }}
          </div>
        </el-form-item>

        <el-form-item v-if="form.scheduleType === 'interval'" :label="$t('chat.scheduledTasks.scheduleType.interval')">
          <el-input-number
            v-model="form.intervalValue"
            :min="1"
            :max="intervalMax"
            :step="1"
            controls-position="right"
          />
          <el-select v-model="form.intervalUnit" style="width: 110px; margin-left: 8px">
            <el-option :label="$t('chat.scheduledTasks.form.intervalUnit.minute')" value="minute" />
            <el-option :label="$t('chat.scheduledTasks.form.intervalUnit.hour')" value="hour" />
            <el-option :label="$t('chat.scheduledTasks.form.intervalUnit.day')" value="day" />
          </el-select>
          <div class="hint">{{ $t('chat.scheduledTasks.form.intervalHint') }}</div>
        </el-form-item>

        <el-form-item v-if="form.scheduleType === 'hourly'" :label="$t('chat.scheduledTasks.form.hourlyMinute')">
          <el-input-number v-model="form.hourlyMinute" :min="0" :max="59" :step="1" controls-position="right" />
          <div class="hint">{{ $t('chat.scheduledTasks.form.hourlyMinuteHint') }}</div>
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
          <div class="hint">{{ $t('chat.scheduledTasks.form.cronHint') }}</div>
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

        <el-form-item
          v-if="selectedBrowserSkills.length"
          :label="$t('chat.scheduledTasks.form.browserConnection')"
          required
        >
          <el-select v-model="form.browserConnectionId" style="width: 100%">
            <el-option
              v-for="connection in selectedBrowserConnections"
              :key="connection.connection_id"
              :label="`${connection.name} · ${connection.device_name}`"
              :value="connection.connection_id"
              :disabled="!connection.online || !connection.compatible"
            />
          </el-select>
          <div v-if="selectedBrowserConnection" class="browser-binding-summary">
            <div>{{ selectedBrowserConnection.allowed_origins.join(', ') }}</div>
            <div>
              {{
                $t('chat.scheduledTasks.form.browserEffects', {
                  effects: selectedBrowserConnection.side_effects.join(', ')
                })
              }}
            </div>
            <div>
              {{
                $t('chat.scheduledTasks.form.authorizationExpires', { time: formatTime(form.authorizationExpiresAt) })
              }}
            </div>
          </div>
        </el-form-item>

        <!-- Only rendered for connectors the user holds several accounts of;
             everything else silently uses that connector's default account. -->
        <el-form-item
          v-for="choice in accountChoices"
          :key="choice.identifier"
          :label="$t('chat.scheduledTasks.form.connectionAccount', { connector: choice.label })"
        >
          <el-select
            v-model="form.connectionAccounts[choice.identifier]"
            clearable
            :placeholder="$t('chat.scheduledTasks.form.connectionAccountDefault')"
            style="width: 100%"
          >
            <el-option
              v-for="account in choice.accounts"
              :key="account.connection_id"
              :label="
                account.is_default
                  ? `${account.label || account.account_name} · ${$t('chat.scheduledTasks.form.accountIsDefault')}`
                  : account.label || account.account_name
              "
              :value="account.connection_id"
            />
          </el-select>
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
        <el-button :disabled="saving" @click="closeTaskDialog">{{ $t('common.button.cancel') }}</el-button>
        <el-button type="primary" :loading="saving" @click="saveTask">
          {{ $t('common.button.confirm') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { AiIcon, ExpandRightIcon, PlayIcon, TimeIcon } from '@acedatacloud/core/icons/components';
import { defineComponent } from 'vue';
import {
  ElButton,
  ElCard,
  ElSkeleton,
  ElEmpty,
  ElSwitch,
  ElTag,
  ElTooltip,
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
import { Pagination } from '@acedatacloud/core/components';
import { AddIcon } from '@acedatacloud/core/icons/add';
import { DeleteIcon } from '@acedatacloud/core/icons/delete';
import { EditIcon } from '@acedatacloud/core/icons/edit';
import { RefreshIcon } from '@acedatacloud/core/icons/refresh';
import {
  scheduledTasksOperator,
  IScheduledTask,
  IScheduledRun,
  IScheduledRunStatus,
  IScheduleSpec,
  IAuthorizableSkill,
  IAuthorizableMcpServer,
  ScheduledTaskPayload,
  IScheduledTaskCapabilityDetail,
  extractSkillNotActive,
  isRunWorthPolling
} from '@/operators/scheduledTasks';
import type {
  IAuthorizableBrowserConnection,
  IAuthorizableConnectionAccount,
  IRunConnectionAccount,
  IScheduledBrowserBinding
} from '@/operators/scheduledTasks';
import { CHAT_MODEL_GROUPS, CHAT_MODEL_NAME_GPT_5_6_SOL } from '@/constants';
import { IChatModelGroup } from '@/models';

const USER_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Shanghai';

type ScheduledTab = 'tasks' | 'runs';
type RunStatusFilter = 'all' | IScheduledRunStatus;

// Default agent turn budget for a scheduled task run. Mirrors the worker's
// DEFAULT_SCHEDULED_MAX_TURNS; the worker clamps to [1, 50] regardless.
const DEFAULT_SCHEDULED_MAX_TURNS = 50;

// A run holds no `conversation_id` until the worker backfills it after the
// agent loop returns, so a pending row is neither clickable nor accurate until
// then. Nothing pushes that transition to the client, so poll while any
// pending row is on screen. The give-up rule lives with `isRunWorthPolling`.
const RUN_POLL_INTERVAL_MS = 12 * 1000;
// Stop after this many consecutive failures. A poll is silent by design, so
// without a circuit breaker an expired token would retry unseen every 12s for
// as long as the pending rows stay within the give-up window.
const RUN_POLL_MAX_FAILURES = 3;

interface TaskForm {
  name: string;
  question: string;
  model: string;
  scheduleType: 'interval' | 'hourly' | 'daily' | 'weekly' | 'cron';
  intervalValue: number;
  intervalUnit: 'minute' | 'hour' | 'day';
  hourlyMinute: number;
  dailyTime: string;
  weekday: number;
  cronExpr: string;
  authorizedSkills: string[];
  authorizedMcpServers: string[];
  browserConnectionId: string;
  /** connector_identifier → chosen connection_id. Empty value = use that
   *  connector's default account. */
  connectionAccounts: Record<string, string>;
  authorizationExpiresAt: number;
  maxTurns: number;
}

export default defineComponent({
  name: 'ScheduledTasks',
  components: {
    AiIcon,
    ExpandRightIcon,
    PlayIcon,
    TimeIcon,
    AddIcon,
    DeleteIcon,
    EditIcon,
    RefreshIcon,
    ElButton,
    ElCard,
    ElSkeleton,
    ElEmpty,
    ElSwitch,
    ElTag,
    ElTooltip,
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
      activeTab: 'tasks' as ScheduledTab,
      tabs: ['tasks', 'runs'] as ScheduledTab[],
      statusFilters: ['all', 'success', 'failed', 'running', 'queued'] as RunStatusFilter[],
      allRuns: [] as IScheduledRun[],
      allRunsCount: 0,
      allRunsLoading: false,
      allRunsStatus: 'all' as RunStatusFilter,
      allRunsPage: 1,
      allRunsPageSize: 20,
      // Bumped on every all-runs request so a slow response from a stale
      // filter/page can't overwrite the newest one.
      allRunsRequestId: 0,
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
      triggeringId: '' as string,
      weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      page: 1,
      pageSize: 6,
      runPage: 1,
      runPageSize: 8,
      // One timer serves both run lists; whichever is on screen refreshes.
      runPollTimer: null as ReturnType<typeof setInterval> | null,
      runPollInFlight: false,
      // Identifies the current poll so an abandoned one can't release the
      // in-flight guard belonging to its successor.
      runPollSeq: 0,
      // Consecutive failed refreshes. An expired token fails every poll while
      // leaving the pending rows on screen, which would otherwise keep the
      // timer armed forever on an error nobody is being told about.
      runPollFailures: 0,
      // Bumped per drawer request so a stale response can't clear the skeleton
      // or overwrite rows belonging to a task the user has since moved on from.
      runsRequestId: 0,
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
    },
    // Sensible upper bound for the interval number input, per selected unit.
    intervalMax(): number {
      return this.form.intervalUnit === 'minute' ? 1440 : this.form.intervalUnit === 'hour' ? 720 : 365;
    },
    // Live human-readable summary of the schedule the form currently builds.
    schedulePreview(): string {
      try {
        return this.humanizeSchedule(this.buildSchedule());
      } catch {
        return '';
      }
    },
    selectedBrowserConnections(): IAuthorizableBrowserConnection[] {
      const selected = new Set(this.form.authorizedSkills);
      return this.authorizableSkills
        .filter((skill) => selected.has(skill.slug))
        .flatMap((skill) => skill.browser_connections ?? []);
    },
    selectedBrowserSkills(): IAuthorizableSkill[] {
      const selected = new Set(this.form.authorizedSkills);
      return this.authorizableSkills.filter(
        (skill) => selected.has(skill.slug) && skill.browser_connections !== undefined
      );
    },
    selectedBrowserConnection(): IAuthorizableBrowserConnection | undefined {
      return this.selectedBrowserConnections.find(
        (connection) => connection.connection_id === this.form.browserConnectionId
      );
    },
    /** Connectors the selected skills need where the user holds MORE THAN ONE
     *  account — only those need a picker; a single account needs no choice
     *  and stays on the connector's default. */
    accountChoices(): Array<{ identifier: string; label: string; accounts: IAuthorizableConnectionAccount[] }> {
      const selected = new Set(this.form.authorizedSkills);
      // Key on the account's own `connector_identifier`, NOT the map key.
      // Skills declare bare names in their frontmatter (`connections: [zhihu]`)
      // so that's what the map is keyed by, but the server validates a binding
      // against the canonical identifier (`zhihu/zhihu`) — posting the bare
      // key back would fail every save.
      const byConnector = new Map<string, { label: string; accounts: IAuthorizableConnectionAccount[] }>();
      for (const skill of this.authorizableSkills) {
        if (!selected.has(skill.slug)) continue;
        for (const [key, accounts] of Object.entries(skill.connection_accounts ?? {})) {
          if ((accounts?.length ?? 0) < 2) continue;
          const identifier = accounts[0].connector_identifier || key;
          if (!byConnector.has(identifier)) byConnector.set(identifier, { label: key, accounts });
        }
      }
      return [...byConnector.entries()].map(([identifier, { label, accounts }]) => ({ identifier, label, accounts }));
    }
  },
  watch: {
    // The drawer sits above the feed, so closing it hands polling back to
    // whatever the feed shows (or stops it on the tasks tab). Keyed on
    // `showRunHistory` rather than the drawer's `@closed` transition event:
    // every visibility decision reads this flag, and a close path that skips
    // the transition would strand `selectedTask` and keep polling a drawer
    // nobody can see.
    showRunHistory(open: boolean) {
      if (open) return;
      this.selectedTask = null;
      // Belt-and-braces: the `showRunHistory` / task-id checks already reject a
      // response that lands after this, and reopening bumps the id anyway.
      this.runsRequestId += 1;
      this.runsLoading = false;
      // The breaker is shared with the feed, so a task whose runs endpoint is
      // failing must not leave the healthy feed stuck when the drawer closes.
      this.runPollFailures = 0;
      this.syncRunPolling();
    }
  },
  async mounted() {
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    await this.loadTasks();
  },
  unmounted() {
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.stopRunPolling();
  },
  methods: {
    emptyForm(): TaskForm {
      return {
        name: '',
        question: '',
        model: CHAT_MODEL_NAME_GPT_5_6_SOL,
        scheduleType: 'daily',
        intervalValue: 4,
        intervalUnit: 'hour',
        hourlyMinute: 0,
        dailyTime: '09:00',
        weekday: 1,
        cronExpr: '0 9 * * *',
        authorizedSkills: [],
        authorizedMcpServers: [],
        browserConnectionId: '',
        connectionAccounts: {},
        authorizationExpiresAt: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        maxTurns: DEFAULT_SCHEDULED_MAX_TURNS
      };
    },
    // Fallback label when the user leaves the name field blank — derive from the prompt.
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
      await this.loadTaskRuns(task.id);
    },
    /** @param silent background poll refresh — see `loadAllRuns`. */
    async loadTaskRuns(taskId: string, silent = false) {
      if (!this.token) return;
      const requestId = ++this.runsRequestId;
      // A deliberate load is the user retrying; give the breaker a fresh start.
      if (!silent) {
        this.runsLoading = true;
        this.runPollFailures = 0;
      }
      try {
        const items = await scheduledTasksOperator.listRuns(this.token, taskId);
        // Drop the response if the drawer closed, moved to another task, or a
        // newer request overtook this one mid-flight.
        if (requestId !== this.runsRequestId) return;
        if (!this.showRunHistory || this.selectedTask?.id !== taskId) return;
        this.runs = items;
        this.runPollFailures = 0;
      } catch {
        if (requestId !== this.runsRequestId) return;
        this.runPollFailures += 1;
        if (!silent) ElMessage.error(this.$t('chat.scheduledTasks.loadError') as string);
      } finally {
        // Guarded: a stale response must not clear the skeleton or re-evaluate
        // polling on behalf of the request that superseded it.
        if (requestId === this.runsRequestId) {
          this.runsLoading = false;
          this.syncRunPolling();
        }
      }
    },
    onPageChange(p: number) {
      this.page = p;
    },
    switchTab(tab: ScheduledTab) {
      if (this.activeTab === tab) return;
      this.activeTab = tab;
      // Always refetch on entry: runs land in the background from the scheduler,
      // and task renames/deletes change the task_name tag on existing rows.
      if (tab === 'runs') void this.loadAllRuns();
      else this.stopRunPolling();
    },
    onStatusFilter(status: RunStatusFilter) {
      if (this.allRunsStatus === status) return;
      this.allRunsStatus = status;
      this.allRunsPage = 1;
      void this.loadAllRuns();
    },
    onAllRunsPageChange(p: number) {
      this.allRunsPage = p;
      void this.loadAllRuns();
    },
    /** @param silent background poll refresh — keep the current rows visible
     *  instead of flashing the skeleton, and stay quiet on failure. */
    async loadAllRuns(silent = false) {
      if (!this.token) return;
      const requestId = ++this.allRunsRequestId;
      // A deliberate load is the user retrying; give the breaker a fresh start.
      if (!silent) {
        this.allRunsLoading = true;
        this.runPollFailures = 0;
      }
      try {
        const { items, count } = await scheduledTasksOperator.listAllRuns(this.token, {
          status: this.allRunsStatus === 'all' ? undefined : this.allRunsStatus,
          offset: (this.allRunsPage - 1) * this.allRunsPageSize,
          limit: this.allRunsPageSize
        });
        // Drop the response if the user changed filter/page mid-flight.
        if (requestId !== this.allRunsRequestId) return;
        this.allRuns = items;
        this.allRunsCount = count;
        this.runPollFailures = 0;
      } catch {
        if (requestId !== this.allRunsRequestId) return;
        this.runPollFailures += 1;
        // A poll runs unattended; a transient network blip shouldn't spray
        // toasts at a user who never asked for this request.
        if (!silent) ElMessage.error(this.$t('chat.scheduledTasks.loadError') as string);
      } finally {
        if (requestId === this.allRunsRequestId) {
          this.allRunsLoading = false;
          this.syncRunPolling();
        }
      }
    },
    onRunPageChange(p: number) {
      this.runPage = p;
    },
    /** Rows currently on screen — the drawer wins when open, since it sits
     *  above the feed. */
    visibleRuns(): IScheduledRun[] {
      return this.showRunHistory ? this.runs : this.activeTab === 'runs' ? this.allRuns : [];
    },
    /** Start or stop polling to match what's on screen. Safe to call often —
     *  it's the single owner of the timer's lifecycle. */
    syncRunPolling() {
      const now = Date.now();
      const wanted =
        !!this.token &&
        this.runPollFailures < RUN_POLL_MAX_FAILURES &&
        this.visibleRuns().some((run) => isRunWorthPolling(run, now));
      if (!wanted || document.hidden) {
        this.stopRunPolling();
        return;
      }
      if (this.runPollTimer) return;
      this.runPollTimer = setInterval(() => void this.pollRuns(), RUN_POLL_INTERVAL_MS);
    },
    stopRunPolling() {
      if (!this.runPollTimer) return;
      clearInterval(this.runPollTimer);
      this.runPollTimer = null;
    },
    async pollRuns() {
      // No token (session ended, logged out in another tab) means every load
      // returns before its `try`, so nothing downstream would ever disarm the
      // timer or trip the breaker — stop here instead of spinning.
      if (!this.token) {
        this.stopRunPolling();
        return;
      }
      // Skip this tick rather than queue a second request behind a slow one.
      // Tracked separately from the `loading` flags, which a silent poll
      // deliberately leaves alone — so they can't serve as the in-flight guard.
      if (this.runPollInFlight) return;
      const seq = ++this.runPollSeq;
      this.runPollInFlight = true;
      try {
        if (this.showRunHistory && this.selectedTask) {
          await this.loadTaskRuns(this.selectedTask.id, true);
        } else if (this.activeTab === 'runs') {
          await this.loadAllRuns(true);
        } else {
          this.stopRunPolling();
        }
      } finally {
        // Only the newest poll may release the guard. A stalled poll that was
        // abandoned on refocus settles later, and would otherwise unlock on
        // behalf of the poll that replaced it — letting requests stack up.
        if (seq === this.runPollSeq) this.runPollInFlight = false;
      }
    },
    onVisibilityChange() {
      // Pause in a background tab; on return, refresh at once rather than
      // waiting out a full interval on rows that may be stale by minutes.
      if (document.hidden) this.stopRunPolling();
      else {
        // Coming back is a fresh start: whatever failed while away may well
        // have been the sleeping tab itself. Clearing the in-flight guard too
        // means a request that never settled despite its timeout can't wedge
        // the poller for the life of the page.
        this.runPollFailures = 0;
        this.runPollInFlight = false;
        void this.pollRuns();
        // `pollRuns` re-arms via its load call, but only if it reaches one —
        // an early return (no token, wrong tab) would otherwise leave the
        // timer disarmed with no path back.
        this.syncRunPolling();
      }
    },
    openCreate() {
      if (this.saving) return;
      this.editingTask = null;
      this.form = this.emptyForm();
      this.showCreateDialog = true;
    },
    closeTaskDialog() {
      if (this.saving) return;
      this.showCreateDialog = false;
    },
    openEdit(task: IScheduledTask) {
      this.editingTask = task;
      const s = task.schedule;
      let scheduleType: TaskForm['scheduleType'] = 'cron';
      let intervalValue = 4;
      let intervalUnit: TaskForm['intervalUnit'] = 'hour';
      let hourlyMinute = 0;
      let dailyTime = '09:00';
      let cronExpr = '0 9 * * *';
      let weekday = 1;
      if (s.type === 'cron') {
        cronExpr = s.cron;
        const [min, hour, dom, mon, dow] = s.cron.split(/\s+/);
        const isNum = (v: string) => /^\d+$/.test(v);
        if (dom === '*' && mon === '*' && dow === '*' && hour === '*' && isNum(min)) {
          // "M * * * *" → at minute M of every hour.
          scheduleType = 'hourly';
          hourlyMinute = Number(min);
        } else if (dom === '*' && mon === '*' && dow === '*' && isNum(hour) && isNum(min)) {
          scheduleType = 'daily';
          dailyTime = `${hour.padStart(2, '0')}:${min.padStart(2, '0')}`;
        } else if (dom === '*' && mon === '*' && isNum(dow) && isNum(hour) && isNum(min)) {
          scheduleType = 'weekly';
          weekday = Number(dow);
          dailyTime = `${hour.padStart(2, '0')}:${min.padStart(2, '0')}`;
        }
      } else if (s.type === 'interval') {
        scheduleType = 'interval';
        const sec = s.interval_seconds;
        if (sec % 86400 === 0) {
          intervalUnit = 'day';
          intervalValue = sec / 86400;
        } else if (sec % 3600 === 0) {
          intervalUnit = 'hour';
          intervalValue = sec / 3600;
        } else {
          intervalUnit = 'minute';
          intervalValue = Math.max(1, Math.round(sec / 60));
        }
      }
      this.form = {
        name: task.name,
        question: task.template.question,
        model: task.template.model,
        scheduleType,
        intervalValue,
        intervalUnit,
        hourlyMinute,
        dailyTime,
        weekday,
        cronExpr,
        authorizedSkills:
          task.unattended_policy?.mode === 'allow_selected_skills' ? task.unattended_policy.allowed_skills || [] : [],
        authorizedMcpServers:
          task.unattended_policy?.mode === 'allow_selected_skills'
            ? task.unattended_policy.allowed_mcp_servers || []
            : [],
        browserConnectionId: task.unattended_policy?.browser_connections?.[0]?.connection_id ?? '',
        connectionAccounts: Object.fromEntries(
          (task.unattended_policy?.connection_bindings ?? []).map((b) => [b.connector_identifier, b.connection_id])
        ),
        authorizationExpiresAt: task.unattended_policy?.expires_at ?? Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        maxTurns: task.template.max_turns ?? DEFAULT_SCHEDULED_MAX_TURNS
      };
      this.showCreateDialog = true;
      void this.loadAuthorizableSkills();
    },
    buildSchedule(): IScheduleSpec {
      const { scheduleType, intervalValue, intervalUnit, hourlyMinute, dailyTime, weekday, cronExpr } = this.form;
      if (scheduleType === 'interval') {
        const unitSeconds = intervalUnit === 'day' ? 86400 : intervalUnit === 'hour' ? 3600 : 60;
        // Scheduler's finest cadence is 60s; guard against sub-minute intervals.
        const seconds = Math.max(60, Math.round(intervalValue) * unitSeconds);
        return { type: 'interval', interval_seconds: seconds, tz: USER_TZ };
      }
      if (scheduleType === 'hourly') {
        const m = Math.min(59, Math.max(0, Math.round(hourlyMinute)));
        return { type: 'cron', cron: `${m} * * * *`, tz: USER_TZ };
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
      if (this.form.authorizedSkills.length > 0 || this.form.authorizedMcpServers.length > 0) {
        try {
          await ElMessageBox.confirm(
            this.authorizationConfirmText(),
            this.$t('chat.scheduledTasks.form.skillsConfirmTitle') as string,
            {
              type: 'warning',
              confirmButtonText: this.$t('common.button.confirm') as string,
              cancelButtonText: this.$t('common.button.cancel') as string
            }
          );
        } catch {
          // User declined the skill/MCP authorization warning — abort quietly,
          // it is a cancellation, not an error.
          return;
        }
      }
      const authorizedSkills = [...this.form.authorizedSkills];
      const authorizedMcpServers = [...this.form.authorizedMcpServers];
      let browserConnections: IScheduledBrowserBinding[] | undefined;
      if (this.selectedBrowserSkills.length) {
        const connection = this.selectedBrowserConnection;
        if (!connection || !connection.online || !connection.compatible) {
          ElMessage.error(this.$t('chat.scheduledTasks.form.browserBindingInvalid') as string);
          return;
        }
        browserConnections = [
          {
            connection_id: connection.connection_id,
            connection_revision: connection.connection_revision,
            device_id: connection.device_id,
            wire_contract_digest: connection.wire_contract_digest,
            policy_digest: connection.policy_digest
          }
        ];
      }
      // Which account of each connector this task runs as. Left empty for
      // connectors where the user only has one account (or hasn't picked),
      // which makes the run fall back to that connector's default account.
      // Derived from the currently-relevant choices, not the raw form map, so
      // deselecting a skill drops its binding instead of shipping a stale one.
      // Also drops a saved account that no longer exists — otherwise the task
      // would be unsavable with no picker rendered to clear it.
      const connectionBindings = this.accountChoices
        .map((choice) => ({
          connector_identifier: choice.identifier,
          connection_id: this.form.connectionAccounts[choice.identifier] || ''
        }))
        .filter(
          (binding) =>
            !!binding.connection_id &&
            this.accountChoices
              .find((choice) => choice.identifier === binding.connector_identifier)
              ?.accounts.some((account) => account.connection_id === binding.connection_id)
        );
      const payload: ScheduledTaskPayload = {
        name: this.form.name.trim() || this.deriveName(this.form.question),
        schedule: this.buildSchedule(),
        template: {
          model: this.form.model,
          question: this.form.question,
          skills: authorizedSkills,
          mcp_servers: authorizedMcpServers,
          max_turns: this.form.maxTurns
        },
        unattended_policy:
          authorizedSkills.length || authorizedMcpServers.length
            ? {
                mode: 'allow_selected_skills' as const,
                allowed_skills: authorizedSkills,
                allowed_mcp_servers: authorizedMcpServers,
                browser_connections: browserConnections,
                connection_bindings: connectionBindings.length ? connectionBindings : undefined,
                expires_at: this.form.authorizationExpiresAt
              }
            : { mode: 'deny_all' as const, allowed_skills: [], allowed_mcp_servers: [] }
      };
      await this.submitTask(payload, false);
    },
    async submitTask(payload: ScheduledTaskPayload, force: boolean) {
      this.saving = true;
      // A pending "skill not bound" prompt to raise AFTER `saving` is reset,
      // so the confirm dialog is interactive rather than stuck behind a spinner.
      let notActive: IScheduledTaskCapabilityDetail | null = null;
      try {
        if (this.editingTask) {
          const editId = this.editingTask.id;
          const updated = await scheduledTasksOperator.updateTask(this.token!, editId, payload, force);
          // Patch the edited row in place — no full reload / skeleton flash.
          const idx = this.tasks.findIndex((t) => t.id === editId);
          if (idx !== -1) this.tasks[idx] = updated;
        } else {
          const created = await scheduledTasksOperator.createTask(this.token!, payload, force);
          // Prepend the newcomer (backend lists newest-first) and jump to page 1.
          this.tasks = [created, ...this.tasks];
          this.page = 1;
        }
        ElMessage.success((this.$t('chat.scheduledTasks.create') as string) + ' OK');
        this.showCreateDialog = false;
        this.editingTask = null;
        this.form = this.emptyForm();
      } catch (error) {
        // On an already-forced retry, don't loop on the same gate — surface it.
        notActive = force ? null : extractSkillNotActive(error);
        if (!notActive) {
          ElMessage.error(this.$t('chat.scheduledTasks.loadError') as string);
        }
      } finally {
        this.saving = false;
      }
      if (notActive) {
        if (this.selectedBrowserSkills.length) return;
        const proceed = await this.confirmForceSkill(notActive);
        if (proceed) await this.submitTask(payload, true);
      }
    },
    async confirmForceSkill(detail: IScheduledTaskCapabilityDetail): Promise<boolean> {
      const name = this.capabilityLabel(detail.slug);
      try {
        await ElMessageBox.confirm(
          this.$t('chat.scheduledTasks.form.skillNotActiveMessage', { name }) as string,
          this.$t('chat.scheduledTasks.form.skillNotActiveTitle') as string,
          {
            type: 'warning',
            confirmButtonText: this.$t('chat.scheduledTasks.form.skillNotActiveForce') as string,
            cancelButtonText: this.$t('common.button.cancel') as string
          }
        );
        return true;
      } catch {
        return false;
      }
    },
    // Resolve a capability slug to a human label, falling back to the raw slug
    // (a not-bound skill won't be in the authorizable lists).
    capabilityLabel(slug: string): string {
      const skill = this.authorizableSkills.find((s) => s.slug === slug);
      if (skill) return skill.name || skill.slug;
      const mcp = this.authorizableMcpServers.find((s) => s.slug === slug);
      if (mcp) return mcp.name || mcp.slug;
      return slug;
    },
    async loadAuthorizableSkills(force = false) {
      if (
        !this.token ||
        this.skillsLoading ||
        (!force && (this.authorizableSkills.length || this.authorizableMcpServers.length))
      )
        return;
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
      const idx = this.tasks.findIndex((t) => t.id === task.id);
      const nextState = enabled ? 'enabled' : 'disabled';
      // Reflect the switch immediately and patch just this row in place — no
      // full-list reload / skeleton flash. Revert if the backend rejects it.
      if (idx !== -1) this.tasks[idx] = { ...task, state: nextState };
      try {
        const updated = await scheduledTasksOperator.updateTask(this.token!, task.id, { state: nextState });
        if (idx !== -1) this.tasks[idx] = updated;
      } catch {
        if (idx !== -1) this.tasks[idx] = { ...task, state: task.state };
        ElMessage.error(this.$t('chat.scheduledTasks.loadError') as string);
      }
    },
    async triggerNow(task: IScheduledTask) {
      if (this.triggeringId) return;
      this.triggeringId = task.id;
      try {
        await scheduledTasksOperator.triggerTask(this.token!, task.id);
        ElMessage.success(this.$t('chat.scheduledTasks.triggerSuccess') as string);
        // If the run-history drawer is open on this task, refresh it so the
        // freshly-queued run shows up right away.
        if (this.showRunHistory && this.selectedTask?.id === task.id) {
          this.runPage = 1;
          await this.loadTaskRuns(task.id);
        } else if (this.activeTab === 'runs') {
          // Same for the global feed — the new run belongs at its top.
          await this.loadAllRuns(true);
        }
      } catch {
        ElMessage.error(this.$t('chat.scheduledTasks.triggerError') as string);
      } finally {
        this.triggeringId = '';
      }
    },
    async confirmDelete(task: IScheduledTask) {
      await ElMessageBox.confirm(this.$t('chat.scheduledTasks.deleteConfirm', { name: task.name }) as string, {
        type: 'warning'
      });
      try {
        await scheduledTasksOperator.deleteTask(this.token!, task.id);
        // Drop the row locally — no full reload / skeleton flash.
        this.tasks = this.tasks.filter((t) => t.id !== task.id);
        const maxPage = Math.max(1, Math.ceil(this.tasks.length / this.pageSize));
        if (this.page > maxPage) this.page = maxPage;
      } catch {
        ElMessage.error(this.$t('chat.scheduledTasks.loadError') as string);
      }
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
    // Which account the run posted as, e.g. `zhihu · Germey`. The name half is
    // resolved server-side and disappears once the account is deleted, so fall
    // back to the connector alone rather than rendering a dangling separator.
    accountTagText(account: IRunConnectionAccount) {
      const connector = account.provider_alias || account.connector_identifier;
      const name = account.label || account.account_name;
      return name ? `${connector} · ${name}` : connector;
    },
    // The judge's own sentence beats a bare code like `goal_not_achieved`, and
    // it is shown for successes too — so it is NOT read from `error_message`.
    runOutcomeText(run: IScheduledRun) {
      if (run.outcome_reason) return run.outcome_reason;
      return this.runErrorText(run);
    },
    runErrorText(run: IScheduledRun) {
      if (run.error_message) return run.error_message;
      const code = run.error_code;
      if (!code) return '';
      return this.errorCodeText(code);
    },
    errorCodeText(code: string) {
      const key = `chat.scheduledTasks.run.reason.${code}`;
      return (this as any).$te(key) ? (this.$t(key) as string) : code.replace(/_/g, ' ');
    },
    // Turn any backend schedule spec into a localized, human-readable phrase.
    humanizeSchedule(s: IScheduleSpec): string {
      const t = (k: string, p?: Record<string, unknown>) =>
        this.$t(`chat.scheduledTasks.humanize.${k}`, p ?? {}) as string;
      if (s.type === 'interval') {
        const sec = s.interval_seconds;
        if (sec % 86400 === 0) return t('everyNDays', { n: sec / 86400 });
        if (sec % 3600 === 0) return t('everyNHours', { n: sec / 3600 });
        return t('everyNMinutes', { n: Math.round(sec / 60) });
      }
      if (s.type === 'cron') {
        const [min, hour, dom, mon, dow] = s.cron.split(/\s+/);
        const isNum = (v: string) => /^\d+$/.test(v);
        if (dom === '*' && mon === '*' && dow === '*' && hour === '*' && isNum(min)) {
          return t('hourlyAtMinute', { n: Number(min) });
        }
        const time = isNum(hour) && isNum(min) ? `${hour.padStart(2, '0')}:${min.padStart(2, '0')}` : '';
        if (time && dom === '*' && mon === '*' && dow === '*') return t('dailyAt', { time });
        if (time && dom === '*' && mon === '*' && isNum(dow)) {
          return t('weeklyAt', { weekday: this.weekdays[Number(dow)] ?? dow, time });
        }
        return t('cronRaw', { cron: s.cron });
      }
      return t('once', { time: new Date(s.at * 1000).toLocaleString() });
    },
    scheduleLabel(s: IScheduleSpec) {
      return this.humanizeSchedule(s);
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
  background-color: var(--el-bg-color-page) !important;
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
.tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--app-border-subtle, var(--el-border-color-lighter));
}
.tab {
  appearance: none;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  padding: 8px 12px;
  margin-bottom: -1px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition:
    color 0.16s,
    border-color 0.16s;
}
.tab:hover {
  color: var(--el-text-color-primary);
}
.tab:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 2px;
  border-radius: 4px;
}
.tab.active {
  color: var(--el-color-primary);
  border-bottom-color: var(--el-color-primary);
}
.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}
.filter-chip {
  appearance: none;
  border: 1px solid var(--app-border-subtle, var(--el-border-color-lighter));
  background: var(--app-bg-surface, var(--el-bg-color-overlay));
  border-radius: 999px;
  padding: 5px 14px;
  font-size: 13px;
  color: var(--el-text-color-regular);
  cursor: pointer;
  transition:
    background 0.16s,
    border-color 0.16s,
    color 0.16s;
}
.filter-chip:hover:not(.active) {
  background: var(--el-fill-color-lighter);
}
.filter-chip:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 2px;
}
.filter-chip.active {
  background: var(--el-color-primary);
  border-color: var(--el-color-primary);
  color: #fff;
}
.run-task-tag,
.run-account-tag {
  flex-shrink: 0;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
}
@media (max-width: 767px) {
  .inner {
    padding-top: 56px;
  }
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
  border: none;
  cursor: pointer;
  :deep(.el-card__body) {
    padding: 16px 18px;
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
  font-size: 16px;
  line-height: 1.4;
  color: var(--el-text-color-primary);
  word-break: break-word;
}
.task-actions {
  display: flex;
  gap: 0;
  align-items: center;
  flex-shrink: 0;
}
/* Element Plus adds a 12px left margin between adjacent buttons; drop it so the
   row is driven purely by the flex gap above. */
.task-actions .el-button + .el-button {
  margin-left: 0;
}
.icon-action {
  padding: 6px 5px;
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
  /* The runs tab adds a task tag to this row; on narrow screens let the
     time / error drop to a second line instead of squeezing to ellipsis. */
  flex-wrap: wrap;
}
.run-time {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.run-error,
.run-outcome {
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
  margin-top: 6px;
  line-height: 1.5;
  /* el-form-item content is flex-wrap; force the hint onto its own line
     instead of cramming beside a narrow number input. */
  flex-basis: 100%;
}
.jitter-hint {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  margin-left: 8px;
}
.schedule-preview {
  flex-basis: 100%;
  width: fit-content;
  margin-top: 12px;
  padding: 7px 12px;
  border-radius: 8px;
  background: var(--el-fill-color-light);
  font-size: 12px;
  color: var(--el-text-color-regular);
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.preview-icon {
  color: var(--el-color-primary);
}
.skill-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}
.skill-option-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.skill-option-missing {
  flex-shrink: 0;
  font-size: 11px;
  color: var(--el-text-color-secondary);
}
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
