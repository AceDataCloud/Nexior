<template>
  <el-dialog
    v-model="visible"
    :title="$t('chat.scheduledTemplates.title')"
    width="min(900px, 95vw)"
    top="4vh"
    :close-on-click-modal="false"
    class="scheduled-template-wizard"
  >
    <el-steps :active="step" finish-status="finish" align-center class="wizard-steps">
      <el-step :title="$t('chat.scheduledTemplates.step.choose')" />
      <el-step :title="$t('chat.scheduledTemplates.step.configure')" />
      <el-step :title="$t('chat.scheduledTemplates.step.connect')" />
      <el-step :title="$t('chat.scheduledTemplates.step.test')" />
      <el-step :title="$t('chat.scheduledTemplates.step.enable')" />
    </el-steps>

    <section v-if="step === 0" v-loading="loading" class="wizard-body">
      <div class="template-toolbar">
        <el-input
          v-model="query"
          clearable
          :placeholder="$t('chat.scheduledTemplates.search')"
          @input="filterTemplates"
        />
        <el-select v-model="category" @change="filterTemplates">
          <el-option :label="$t('chat.scheduledTemplates.category.all')" value="" />
          <el-option v-for="item in categories" :key="item" :label="categoryLabel(item)" :value="item" />
        </el-select>
      </div>
      <div class="template-grid">
        <button
          v-for="item in templates"
          :key="`${item.id}-${item.version}`"
          type="button"
          class="template-card"
          :class="{ selected: selected?.id === item.id && selected?.version === item.version }"
          @click="selectTemplate(item)"
        >
          <div class="template-card-top">
            <strong>{{ item.title }}</strong
            ><el-tag v-if="item.featured" size="small" type="warning">{{
              $t('chat.scheduledTemplates.featured')
            }}</el-tag>
          </div>
          <p>{{ item.summary }}</p>
          <div class="template-tags">
            <el-tag v-for="tag in item.categories" :key="tag" size="small" type="info">{{ categoryLabel(tag) }}</el-tag>
          </div>
          <div class="template-status">
            <el-tag size="small" :type="riskTag(item)">{{ riskLabel(item) }}</el-tag>
            <span :class="['availability', { ready: item.available }]">{{
              item.available
                ? $t('chat.scheduledTemplates.ready')
                : $t('chat.scheduledTemplates.missingCount', { count: item.missing_connections.length })
            }}</span>
          </div>
        </button>
      </div>
    </section>

    <section v-else-if="step === 1 && selected" class="wizard-body">
      <div class="template-intro">
        <h3>{{ selected.title }}</h3>
        <p>{{ selected.description }}</p>
      </div>
      <el-form label-position="top">
        <el-form-item
          v-for="field in selected.form_schema"
          :key="field.key"
          :label="field.label"
          :required="field.required"
        >
          <el-select v-if="field.type === 'select'" v-model="inputs[field.key]" style="width: 100%"
            ><el-option v-for="option in field.options" :key="option.value" :label="option.label" :value="option.value"
          /></el-select>
          <el-switch
            v-else-if="field.type === 'boolean'"
            :model-value="inputs[field.key] === true"
            @update:model-value="(value: string | number | boolean) => (inputs[field.key] = value === true)"
          />
          <el-time-picker
            v-else-if="field.type === 'time'"
            :model-value="String(inputs[field.key] ?? '')"
            value-format="HH:mm"
            @update:model-value="(value: string) => (inputs[field.key] = value)"
          />
          <el-input
            v-else
            :model-value="String(inputs[field.key] ?? '')"
            :type="field.type === 'textarea' ? 'textarea' : 'text'"
            :rows="4"
            @update:model-value="(value: string) => (inputs[field.key] = value)"
          />
        </el-form-item>
        <el-form-item :label="$t('chat.scheduledTemplates.schedule')"
          ><el-time-picker v-model="scheduleTime" value-format="HH:mm" format="HH:mm"
        /></el-form-item>
      </el-form>
    </section>

    <section v-else-if="step === 2 && selected" class="wizard-body">
      <div class="requirement-heading">
        <div>
          <h3>{{ $t('chat.scheduledTemplates.connectionTitle') }}</h3>
          <p>{{ $t('chat.scheduledTemplates.connectionDescription') }}</p>
        </div>
        <el-tag type="info">{{ requiredConnections.length }}</el-tag>
      </div>
      <div v-if="!requiredConnections.length" class="requirement-empty ready">
        <success-icon :size="20" />
        <div>
          <strong>{{ $t('chat.scheduledTemplates.noConnections') }}</strong>
          <p>{{ $t('chat.scheduledTemplates.noConnectionsHint') }}</p>
        </div>
      </div>
      <div class="requirement-list">
        <article
          v-for="connection in requiredConnections"
          :key="connection"
          :class="['requirement-card', { ready: connectionReady(connection) }]"
        >
          <connection-icon :size="22" />
          <div>
            <strong>{{ connectionName(connection) }}</strong>
            <p>{{ connectionDescription(connection) }}</p>
            <small v-if="connectionReady(connection)">{{ connectionAccountSummary(connection) }}</small>
          </div>
          <el-select
            v-if="bindableAccounts(connection).length > 1"
            v-model="connectionBindings[connection]"
            :placeholder="$t('chat.scheduledTemplates.chooseAccount')"
            ><el-option
              v-for="account in bindableAccounts(connection)"
              :key="account.connection_id"
              :label="account.label || account.account_name"
              :value="account.connection_id"
          /></el-select>
          <el-button v-else-if="!connectionReady(connection)" type="primary" plain @click="startConnection">{{
            $t('chat.scheduledTemplates.connect')
          }}</el-button
          ><success-icon v-else class="success" :size="22" />
        </article>
      </div>
      <div v-if="optionalConnections.length" class="optional-note">
        {{ $t('chat.scheduledTemplates.optionalConnections', { count: optionalConnections.length }) }}
      </div>
      <browse-connectors v-model="browseConnections" @installed="reloadTemplates" />
    </section>

    <section v-else-if="step === 3 && selected" class="wizard-body test-step">
      <h3>{{ $t('chat.scheduledTemplates.testTitle') }}</h3>
      <p>{{ $t('chat.scheduledTemplates.testDescription') }}</p>
      <div v-if="!task" class="test-panel">
        <el-button type="primary" :loading="working" @click="startTest">{{
          $t('chat.scheduledTemplates.startTest')
        }}</el-button>
      </div>
      <div v-else class="test-panel">
        <el-tag :type="runTagType">{{
          run ? $t(`chat.scheduledTasks.run.${run.status}`) : $t('chat.scheduledTemplates.testStarting')
        }}</el-tag>
        <p v-if="run?.outcome_reason">{{ run.outcome_reason }}</p>
        <p v-else-if="run?.error_message">{{ run.error_message }}</p>
        <p v-if="run?.conversation_preview">{{ run.conversation_preview }}</p>
        <div v-if="runTerminal" class="test-actions">
          <el-button @click="retryTest">{{ $t('chat.scheduledTemplates.retryTest') }}</el-button
          ><el-button @click="fixConfiguration">{{ $t('chat.scheduledTemplates.fixConfiguration') }}</el-button>
        </div>
      </div>
    </section>

    <section v-else-if="step === 4 && selected" class="wizard-body enable-step">
      <h3>{{ $t('chat.scheduledTemplates.enableTitle') }}</h3>
      <div class="summary-grid">
        <span>{{ $t('chat.scheduledTemplates.schedule') }}</span
        ><strong>{{ scheduleTime }} · {{ buildSchedule().tz }}</strong
        ><span>{{ $t('chat.scheduledTemplates.risk') }}</span
        ><strong>{{ riskLabel(selected) }}</strong
        ><span>{{ $t('chat.scheduledTemplates.estimatedBudget') }}</span
        ><strong
          >{{ activation?.budget?.estimated_upper_bound ?? selected.budget?.estimated_upper_bound ?? '—' }} Credits ·
          {{ $t('chat.scheduledTemplates.estimateOnly') }}</strong
        ><span>{{ $t('chat.scheduledTemplates.actions') }}</span
        ><strong>{{
          (activation?.side_effects ?? selected.side_effects ?? []).join(', ') || $t('chat.scheduledTemplates.readOnly')
        }}</strong>
      </div>
      <div v-if="backendBlocked" class="activation-blocker">{{ $t('chat.scheduledTemplates.backendRequired') }}</div>
      <div v-else-if="activation && !activation.ready" class="activation-blocker">
        {{ activation.blockers.map((b) => b.code).join(', ') }}
      </div>
      <div v-else-if="activation?.ready" class="activation-ready">
        <success-icon :size="20" /> {{ $t('chat.scheduledTemplates.readyToEnable') }}
      </div>
    </section>

    <template #footer>
      <el-button v-if="step > 0 && step < 3" :disabled="working" @click="step -= 1">{{
        $t('chat.scheduledTemplates.previous')
      }}</el-button>
      <el-button v-if="step < 2" type="primary" :disabled="!canContinue" @click="nextStep">{{
        $t('chat.scheduledTemplates.next')
      }}</el-button>
      <el-button v-if="step === 2" type="primary" :disabled="!canContinue" @click="step = 3">{{
        $t('chat.scheduledTemplates.next')
      }}</el-button>
      <el-button
        v-if="step === 3 && run?.status === 'success'"
        type="primary"
        :loading="working"
        @click="prepareEnable"
        >{{ $t('chat.scheduledTemplates.reviewEnable') }}</el-button
      >
      <el-button
        v-if="step === 4"
        type="primary"
        :loading="working"
        :disabled="!activation?.ready"
        @click="enableTask"
        >{{ $t('chat.scheduledTemplates.enableNow') }}</el-button
      >
    </template>
  </el-dialog>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import {
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElSelect,
  ElStep,
  ElSteps,
  ElSwitch,
  ElTag,
  ElTimePicker
} from 'element-plus';
import { ConnectionIcon, SuccessIcon } from '@acedatacloud/core/icons/components';
import BrowseConnectors from '@/components/connections/BrowseConnectors.vue';
import { track } from '@/plugins/telemetry';
import { getSurface } from '@/utils/surface';
import {
  scheduledTasksOperator,
  isRunWorthPolling,
  type IAuthorizableConnectionAccount,
  type IScheduledRun,
  type IScheduledTask,
  type IScheduledTaskTemplateDefinition,
  type IScheduledTemplateActivationStatus,
  type IScheduleSpec
} from '@/operators/scheduledTasks';

const POLL_MS = 3000;
export default defineComponent({
  name: 'ScheduledTemplateWizard',
  components: {
    BrowseConnectors,
    ConnectionIcon,
    SuccessIcon,
    ElButton,
    ElDialog,
    ElForm,
    ElFormItem,
    ElInput,
    ElOption,
    ElSelect,
    ElStep,
    ElSteps,
    ElSwitch,
    ElTag,
    ElTimePicker
  },
  props: {
    modelValue: { type: Boolean as PropType<boolean>, default: false },
    token: { type: String, required: true },
    initialCategory: { type: String, default: '' }
  },
  emits: ['update:modelValue', 'created'],
  data() {
    return {
      visible: this.modelValue,
      step: 0,
      loading: false,
      working: false,
      templates: [] as IScheduledTaskTemplateDefinition[],
      categories: [] as string[],
      selected: null as IScheduledTaskTemplateDefinition | null,
      query: '',
      category: this.initialCategory,
      inputs: {} as Record<string, string | number | boolean>,
      scheduleTime: '09:00',
      connectionBindings: {} as Record<string, string>,
      browseConnections: false,
      task: null as IScheduledTask | null,
      run: null as IScheduledRun | null,
      runId: '',
      activation: null as IScheduledTemplateActivationStatus | null,
      backendBlocked: false,
      pollTimer: null as ReturnType<typeof setTimeout> | null,
      pollGeneration: 0
    };
  },
  computed: {
    requiredConnections(): string[] {
      return this.selected?.dependencies?.required.connections ?? this.selected?.requirements.connections ?? [];
    },
    optionalConnections(): string[] {
      return this.selected?.dependencies?.optional.connections ?? [];
    },
    canContinue(): boolean {
      if (this.step === 0) return !!this.selected;
      if (this.step === 1 && this.selected)
        return this.selected.form_schema.every(
          (f) =>
            !f.required ||
            (f.type === 'boolean' ? typeof this.inputs[f.key] === 'boolean' : String(this.inputs[f.key] ?? '').trim())
        );
      if (this.step === 2) return this.requiredConnections.every(this.connectionReady);
      return true;
    },
    runTerminal(): boolean {
      return !!this.run && !isRunWorthPolling(this.run, Date.now());
    },
    runTagType(): 'success' | 'danger' | 'warning' | 'info' {
      return this.run?.status === 'success'
        ? 'success'
        : this.run?.status === 'failed'
          ? 'danger'
          : this.run?.status === 'indeterminate'
            ? 'warning'
            : 'info';
    }
  },
  watch: {
    modelValue(v: boolean) {
      this.visible = v;
      if (v) {
        void this.loadTemplates();
        track('scheduled_template_gallery_viewed', { surface: getSurface(), category: this.category });
      }
    },
    visible(v: boolean) {
      this.$emit('update:modelValue', v);
      if (!v) this.stopPolling();
    }
  },
  unmounted() {
    this.stopPolling();
  },
  methods: {
    safeTrack(name: string, extra: Record<string, string | number | boolean> = {}) {
      if (!this.selected) return;
      track(name, {
        template: this.selected.id,
        version: this.selected.version,
        category: this.selected.categories[0] ?? '',
        surface: getSurface(),
        ...extra
      });
    },
    async loadTemplates() {
      this.loading = true;
      try {
        const data = await scheduledTasksOperator.listTemplates(this.token, {
          category: this.category,
          query: this.query
        });
        this.templates = data.items;
        this.categories = data.categories;
      } catch {
        ElMessage.error(this.$t('chat.scheduledTemplates.loadError') as string);
      } finally {
        this.loading = false;
      }
    },
    filterTemplates() {
      void this.loadTemplates();
    },
    categoryLabel(c: string) {
      const key = `chat.scheduledTemplates.category.${c}`;
      const t = String(this.$t(key));
      return t === key ? c : t;
    },
    selectTemplate(t: IScheduledTaskTemplateDefinition) {
      this.selected = t;
      this.inputs = Object.fromEntries(
        t.form_schema.filter((f) => f.default !== undefined).map((f) => [f.key, f.default!])
      );
      this.scheduleTime = this.scheduleTimeFromSpec(t.defaults.schedule);
      this.connectionBindings = {};
      this.safeTrack('scheduled_template_selected', { risk: t.risk?.level ?? 'unknown' });
    },
    riskLabel(t: IScheduledTaskTemplateDefinition) {
      return this.$t(`chat.scheduledTemplates.risk.${t.risk?.level ?? 'high'}`) as string;
    },
    riskTag(t: IScheduledTaskTemplateDefinition) {
      return t.risk?.level === 'low' ? 'success' : t.risk?.level === 'medium' ? 'warning' : 'danger';
    },
    connectionAccounts(c: string): IAuthorizableConnectionAccount[] {
      return this.selected?.connection_accounts?.[c] ?? [];
    },
    bindableAccounts(c: string) {
      return this.connectionAccounts(c).filter((a) => a.supports_task_binding);
    },
    connectionReady(c: string) {
      const all = this.connectionAccounts(c),
        bindable = this.bindableAccounts(c);
      return !!all.length && (!bindable.length || bindable.length === 1 || !!this.connectionBindings[c]);
    },
    connectionName(c: string) {
      const a = this.connectionAccounts(c)[0];
      return a?.account_name || a?.label || c.split('/').pop() || c;
    },
    connectionDescription(c: string) {
      const a = this.connectionAccounts(c);
      return !a.length
        ? (this.$t('chat.scheduledTemplates.connectionMissingHint') as string)
        : a[0].supports_task_binding
          ? (this.$t('chat.scheduledTemplates.connectionBoundHint') as string)
          : (this.$t('chat.scheduledTemplates.connectionMcpHint') as string);
    },
    connectionAccountSummary(c: string) {
      const a = this.connectionAccounts(c),
        chosen = a.find((x) => x.connection_id === this.connectionBindings[c]) ?? a[0];
      return chosen?.label || chosen?.account_name || '';
    },
    startConnection() {
      this.safeTrack('scheduled_template_connection_started');
      this.browseConnections = true;
    },
    async reloadTemplates() {
      this.browseConnections = false;
      await this.loadTemplates();
      this.safeTrack('scheduled_template_connection_completed');
    },
    scheduleTimeFromSpec(s: IScheduleSpec) {
      if (s.type !== 'cron') return '09:00';
      const [m, h] = s.cron.split(' ');
      return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
    },
    buildSchedule(): IScheduleSpec {
      const [h, m] = this.scheduleTime.split(':');
      const original = this.selected?.defaults.schedule;
      if (original?.type === 'cron') {
        const parts = original.cron.split(' ');
        parts[0] = m;
        parts[1] = h;
        return { ...original, cron: parts.join(' '), tz: Intl.DateTimeFormat().resolvedOptions().timeZone };
      }
      return { type: 'cron', cron: `${m} ${h} * * *`, tz: Intl.DateTimeFormat().resolvedOptions().timeZone };
    },
    bindings() {
      return this.requiredConnections.flatMap((c) => {
        const accounts = this.bindableAccounts(c),
          id = this.connectionBindings[c] || accounts[0]?.connection_id,
          account = accounts.find((a) => a.connection_id === id);
        return account
          ? [{ connector_identifier: account.connector_identifier, connection_id: account.connection_id }]
          : [];
      });
    },
    async nextStep() {
      if (this.step === 1 && this.selected) {
        this.working = true;
        try {
          await scheduledTasksOperator.previewTemplate(
            this.token,
            this.selected.id,
            this.selected.version,
            this.inputs
          );
          this.safeTrack('scheduled_template_preview_completed');
        } catch (e) {
          ElMessage.error(this.errorMessage(e));
          return;
        } finally {
          this.working = false;
        }
      }
      this.step += 1;
    },
    async startTest() {
      if (!this.selected) return;
      this.working = true;
      this.safeTrack('scheduled_template_test_started');
      try {
        if (this.task) {
          await this.reconfigureExisting();
        } else {
          this.task = await scheduledTasksOperator.instantiateTemplate(this.token, {
            template_id: this.selected.id,
            version: this.selected.version,
            inputs: this.inputs,
            schedule: this.buildSchedule(),
            connection_bindings: this.bindings()
          });
          this.$emit('created', this.task);
        }
        await this.triggerAndPoll();
      } catch (e) {
        ElMessage.error(this.errorMessage(e));
      } finally {
        this.working = false;
      }
    },
    async triggerAndPoll() {
      if (!this.task) return;
      const result = await scheduledTasksOperator.triggerTask(this.token, this.task.id);
      if (!result.run_id) throw new Error('run_id missing');
      this.runId = result.run_id;
      this.run = null;
      const generation = ++this.pollGeneration;
      await this.pollRun(generation);
    },
    async pollRun(generation: number) {
      if (!this.task || generation !== this.pollGeneration) return;
      try {
        const run = await scheduledTasksOperator.retrieveRun(this.token, this.task.id, this.runId);
        if (generation !== this.pollGeneration) return;
        this.run = run;
        if (isRunWorthPolling(run, Date.now()))
          this.pollTimer = setTimeout(() => void this.pollRun(generation), POLL_MS);
        else this.safeTrack('scheduled_template_test_completed', { result: run.status });
      } catch {
        this.pollTimer = setTimeout(() => void this.pollRun(generation), POLL_MS);
      }
    },
    stopPolling() {
      this.pollGeneration += 1;
      if (this.pollTimer) clearTimeout(this.pollTimer);
      this.pollTimer = null;
    },
    async retryTest() {
      this.stopPolling();
      this.safeTrack('scheduled_template_test_retried');
      await this.triggerAndPoll();
    },
    async fixConfiguration() {
      this.stopPolling();
      this.safeTrack('scheduled_template_fix_returned');
      this.step = 1;
    },
    async prepareEnable() {
      if (!this.task) return;
      this.working = true;
      try {
        this.activation = await scheduledTasksOperator.activationStatus(this.token, this.task.id);
        this.backendBlocked = false;
        this.step = 4;
      } catch {
        this.backendBlocked = true;
        this.activation = null;
        this.step = 4;
      } finally {
        this.working = false;
      }
    },
    async enableTask() {
      if (!this.task || !this.activation?.ready) return;
      this.working = true;
      try {
        const enabled = await scheduledTasksOperator.enableTemplateTask(this.token, this.task.id);
        this.$emit('created', enabled);
        this.safeTrack('scheduled_template_enabled');
        ElMessage.success(this.$t('chat.scheduledTemplates.enabled') as string);
        this.visible = false;
      } catch (e) {
        ElMessage.error(this.errorMessage(e));
        await this.prepareEnable();
      } finally {
        this.working = false;
      }
    },
    async reconfigureExisting() {
      if (!this.task) return;
      this.task = await scheduledTasksOperator.reconfigureTemplate(this.token, this.task.id, {
        inputs: this.inputs,
        schedule: this.buildSchedule(),
        connection_bindings: this.bindings()
      });
      this.$emit('created', this.task);
      this.run = null;
      this.activation = null;
    },
    errorMessage(e: unknown) {
      const d = (e as { response?: { data?: { message?: string; error?: string } } })?.response?.data;
      return d?.message || d?.error || (e as Error)?.message || String(this.$t('chat.scheduledTemplates.createFailed'));
    }
  }
});
</script>

<style scoped lang="scss">
:deep(.scheduled-template-wizard) {
  .el-dialog__body {
    padding-top: 8px;
  }
}
.wizard-steps {
  margin-bottom: 20px;
}
.wizard-body {
  min-height: 360px;
  max-height: 65vh;
  overflow-y: auto;
  padding: 4px;
}
.template-toolbar {
  display: grid;
  grid-template-columns: 1fr 220px;
  gap: 12px;
  margin-bottom: 16px;
}
.template-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}
.template-card {
  text-align: left;
  padding: 18px;
  border: 1px solid var(--el-border-color);
  border-radius: 14px;
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
  cursor: pointer;
}
.template-card:hover,
.template-card.selected {
  border-color: var(--el-color-primary);
  box-shadow: var(--app-shadow-md);
}
.template-card-top,
.template-status,
.requirement-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.template-card p,
.requirement-card p,
.requirement-heading p {
  color: var(--el-text-color-secondary);
}
.template-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 10px 0;
}
.availability {
  color: var(--el-color-warning);
  font-size: 13px;
}
.availability.ready,
.success,
.activation-ready {
  color: var(--el-color-success);
}
.requirement-list {
  display: grid;
  gap: 12px;
}
.requirement-card,
.requirement-empty,
.test-panel,
.activation-blocker,
.activation-ready {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
  padding: 18px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
  margin: 12px 0;
}
.requirement-card.ready,
.activation-ready {
  background: var(--el-color-success-light-9);
}
.optional-note {
  color: var(--el-text-color-secondary);
  margin-top: 14px;
}
.test-panel {
  grid-template-columns: 1fr;
}
.test-actions {
  display: flex;
  gap: 10px;
}
.summary-grid {
  display: grid;
  grid-template-columns: minmax(140px, auto) 1fr;
  gap: 12px;
  padding: 18px;
  background: var(--el-fill-color-light);
  border-radius: 14px;
}
.summary-grid span {
  color: var(--el-text-color-secondary);
}
.activation-blocker {
  grid-template-columns: 1fr;
  color: var(--el-color-warning);
}
@media (max-width: 720px) {
  .template-grid,
  .template-toolbar {
    grid-template-columns: 1fr;
  }
  .wizard-steps:deep(.el-step__title) {
    font-size: 11px;
  }
  .requirement-card {
    grid-template-columns: auto 1fr;
  }
  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
