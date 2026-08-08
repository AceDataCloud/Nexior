<template>
  <el-dialog
    v-model="visible"
    :title="$t('chat.scheduledTemplates.title')"
    width="min(820px, 94vw)"
    top="6vh"
    :close-on-click-modal="false"
    class="scheduled-template-wizard"
  >
    <el-steps :active="step" finish-status="finish" align-center class="wizard-steps">
      <el-step :title="$t('chat.scheduledTemplates.step.choose')" />
      <el-step :title="$t('chat.scheduledTemplates.step.configure')" />
      <el-step :title="$t('chat.scheduledTemplates.step.connect')" />
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
          :class="{ selected: selected?.id === item.id }"
          @click="selectTemplate(item)"
        >
          <div class="template-card-top">
            <strong>{{ item.title }}</strong>
            <el-tag v-if="item.featured" size="small" type="warning">{{
              $t('chat.scheduledTemplates.featured')
            }}</el-tag>
          </div>
          <p>{{ item.summary }}</p>
          <div class="template-tags">
            <el-tag v-for="tag in item.categories" :key="tag" size="small" type="info">{{ categoryLabel(tag) }}</el-tag>
          </div>
          <span :class="['availability', { ready: item.available }]">
            {{
              item.available
                ? $t('chat.scheduledTemplates.ready')
                : $t('chat.scheduledTemplates.missingCount', { count: item.missing_connections.length })
            }}
          </span>
        </button>
      </div>
    </section>

    <section v-else-if="step === 1 && selected" class="wizard-body configure-step">
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
          <el-select v-if="field.type === 'select'" v-model="inputs[field.key]" style="width: 100%">
            <el-option
              v-for="option in field.options"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
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
        <el-form-item :label="$t('chat.scheduledTemplates.schedule')">
          <el-time-picker v-model="scheduleTime" value-format="HH:mm" format="HH:mm" />
        </el-form-item>
      </el-form>
    </section>

    <section v-else-if="step === 2 && selected" class="wizard-body">
      <div class="requirement-heading">
        <div>
          <h3>{{ $t('chat.scheduledTemplates.connectionTitle') }}</h3>
          <p>{{ $t('chat.scheduledTemplates.connectionDescription') }}</p>
        </div>
        <el-tag type="info" round>{{ selected.requirements.connections.length }}</el-tag>
      </div>
      <div v-if="!selected.requirements.connections.length" class="requirement-empty ready">
        <success-icon :size="20" />
        <div>
          <strong>{{ $t('chat.scheduledTemplates.noConnections') }}</strong>
          <p>{{ $t('chat.scheduledTemplates.noConnectionsHint') }}</p>
        </div>
      </div>
      <div class="requirement-list">
        <article
          v-for="connection in selected.requirements.connections"
          :key="connection"
          :class="['requirement-card', { ready: connectionReady(connection) }]"
        >
          <div class="requirement-icon">
            <connection-icon :size="22" aria-hidden="true" focusable="false" />
          </div>
          <div class="requirement-content">
            <div class="requirement-title-row">
              <strong>{{ connectionName(connection) }}</strong>
              <el-tag :type="connectionReady(connection) ? 'success' : 'warning'" size="small" round>
                {{
                  connectionReady(connection)
                    ? $t('chat.scheduledTemplates.connected')
                    : $t('chat.scheduledTemplates.notConnected')
                }}
              </el-tag>
            </div>
            <p>{{ connectionDescription(connection) }}</p>
            <div v-if="connectionReady(connection)" class="account-summary">
              {{ connectionAccountSummary(connection) }}
            </div>
          </div>
          <div class="requirement-action">
            <el-select
              v-if="bindableAccounts(connection).length > 1"
              v-model="connectionBindings[connection]"
              :placeholder="$t('chat.scheduledTemplates.chooseAccount')"
            >
              <el-option
                v-for="account in bindableAccounts(connection)"
                :key="account.connection_id"
                :label="account.label || account.account_name"
                :value="account.connection_id"
              />
            </el-select>
            <el-button v-else-if="!connectionReady(connection)" type="primary" plain @click="browseConnections = true">
              {{ $t('chat.scheduledTemplates.connect') }}
            </el-button>
            <success-icon v-else class="success" :size="22" />
          </div>
        </article>
      </div>
      <browse-connectors v-model="browseConnections" @installed="reloadTemplates" />
    </section>

    <template #footer>
      <el-button v-if="step > 0" :disabled="working" @click="step -= 1">
        {{ $t('chat.scheduledTemplates.previous') }}
      </el-button>
      <el-button v-if="step < 2" type="primary" :disabled="!canContinue" @click="step += 1">
        {{ $t('chat.scheduledTemplates.next') }}
      </el-button>
      <el-button v-if="step === 2" type="primary" :loading="working" :disabled="!canContinue" @click="createTask">
        {{ $t('chat.scheduledTemplates.create') }}
      </el-button>
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
import {
  scheduledTasksOperator,
  type IAuthorizableConnectionAccount,
  type IScheduledTaskTemplateDefinition,
  type IScheduleSpec
} from '@/operators/scheduledTasks';

export default defineComponent({
  name: 'ScheduledTemplateWizard',
  components: {
    BrowseConnectors,
    ConnectionIcon,
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
    ElTimePicker,
    SuccessIcon
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
      browseConnections: false
    };
  },
  computed: {
    canContinue(): boolean {
      if (this.step === 0) return !!this.selected;
      if (this.step === 1 && this.selected) {
        return this.selected.form_schema.every(
          (field) => !field.required || String(this.inputs[field.key] ?? '').trim()
        );
      }
      if (this.step === 2 && this.selected) return this.selected.requirements.connections.every(this.connectionReady);
      return true;
    }
  },
  watch: {
    modelValue(value: boolean) {
      this.visible = value;
      if (value) void this.loadTemplates();
    },
    visible(value: boolean) {
      this.$emit('update:modelValue', value);
    }
  },
  methods: {
    async loadTemplates() {
      this.loading = true;
      try {
        const data = await scheduledTasksOperator.listTemplates(this.token, {
          category: this.category,
          query: this.query
        });
        this.templates = data.items;
        this.categories = data.categories;
        if (this.selected) this.selected = data.items.find((item) => item.id === this.selected?.id) ?? this.selected;
      } catch {
        ElMessage.error(this.$t('chat.scheduledTemplates.loadError') as string);
      } finally {
        this.loading = false;
      }
    },
    filterTemplates() {
      void this.loadTemplates();
    },
    categoryLabel(category: string) {
      const key = `chat.scheduledTemplates.category.${category}`;
      const translated = String(this.$t(key));
      return translated === key ? category : translated;
    },
    selectTemplate(template: IScheduledTaskTemplateDefinition) {
      this.selected = template;
      this.inputs = Object.fromEntries(
        template.form_schema.filter((field) => field.default !== undefined).map((field) => [field.key, field.default!])
      );
      this.scheduleTime = this.scheduleTimeFromSpec(template.defaults.schedule);
      this.connectionBindings = {};
      for (const connection of template.requirements.connections) {
        const accounts = this.bindableAccounts(connection);
        const account = accounts.find((item) => item.is_default) ?? accounts[0];
        if (account) this.connectionBindings[connection] = account.connection_id;
      }
    },
    connectionAccounts(connection: string): IAuthorizableConnectionAccount[] {
      return this.selected?.connection_accounts?.[connection] ?? [];
    },
    bindableAccounts(connection: string): IAuthorizableConnectionAccount[] {
      return this.connectionAccounts(connection).filter((account) => account.supports_task_binding);
    },
    connectionReady(connection: string): boolean {
      const accounts = this.connectionAccounts(connection);
      const bindable = accounts.filter((account) => account.supports_task_binding);
      if (!accounts.length) return false;
      if (!bindable.length) return true;
      return bindable.length === 1 || !!this.connectionBindings[connection];
    },
    connectionName(connection: string): string {
      const account = this.connectionAccounts(connection)[0];
      return account?.account_name || account?.label || connection.split('/').pop() || connection;
    },
    connectionDescription(connection: string): string {
      const accounts = this.connectionAccounts(connection);
      if (!accounts.length) return this.$t('chat.scheduledTemplates.connectionMissingHint') as string;
      return accounts[0].supports_task_binding
        ? (this.$t('chat.scheduledTemplates.connectionBoundHint') as string)
        : (this.$t('chat.scheduledTemplates.connectionMcpHint') as string);
    },
    connectionAccountSummary(connection: string): string {
      const accounts = this.connectionAccounts(connection);
      const selectedId = this.connectionBindings[connection];
      const selected = accounts.find((account) => account.connection_id === selectedId) ?? accounts[0];
      return selected?.label || selected?.account_name || this.$t('chat.scheduledTemplates.connected');
    },
    async reloadTemplates() {
      this.browseConnections = false;
      await this.loadTemplates();
      if (this.selected) this.selectTemplate(this.selected);
    },
    scheduleTimeFromSpec(schedule: IScheduleSpec) {
      if (schedule.type !== 'cron') return '09:00';
      const [minute, hour] = schedule.cron.split(' ');
      return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
    },
    buildSchedule(): IScheduleSpec {
      const [hour, minute] = this.scheduleTime.split(':');
      return { type: 'cron', cron: `${minute} ${hour} * * *`, tz: Intl.DateTimeFormat().resolvedOptions().timeZone };
    },
    bindings() {
      if (!this.selected) return [];
      return this.selected.requirements.connections.flatMap((connection) => {
        const accounts = this.bindableAccounts(connection);
        const id = this.connectionBindings[connection] || accounts[0]?.connection_id;
        const account = accounts.find((item) => item.connection_id === id);
        return account
          ? [{ connector_identifier: account.connector_identifier, connection_id: account.connection_id }]
          : [];
      });
    },
    errorMessage(error: unknown): string {
      const response = (error as { response?: { data?: { message?: string; error?: string } } })?.response?.data;
      return (
        response?.message ||
        response?.error ||
        (error as Error)?.message ||
        String(this.$t('chat.scheduledTemplates.createFailed'))
      );
    },
    resetWizard() {
      this.step = 0;
      this.selected = null;
      this.inputs = {};
      this.scheduleTime = '09:00';
      this.connectionBindings = {};
      this.browseConnections = false;
    },
    async createTask() {
      if (!this.selected || !this.canContinue) return;
      this.working = true;
      try {
        const task = await scheduledTasksOperator.instantiateTemplate(this.token, {
          template_id: this.selected.id,
          version: this.selected.version,
          inputs: this.inputs,
          schedule: this.buildSchedule(),
          connection_bindings: this.bindings()
        });
        this.$emit('created', task);
        this.visible = false;
        this.resetWizard();
        ElMessage.success(this.$t('chat.scheduledTemplates.createdDisabled') as string);
      } catch (error) {
        ElMessage.error(this.errorMessage(error));
      } finally {
        this.working = false;
      }
    }
  }
});
</script>

<style scoped lang="scss">
:deep(.scheduled-template-wizard) {
  .el-dialog__header {
    padding-bottom: 14px;
  }
  .el-dialog__body {
    padding-top: 8px;
  }
  .el-dialog__footer {
    padding-top: 14px;
  }
}
.wizard-steps {
  margin-bottom: 18px;

  :deep(.el-step__head.is-finish) {
    color: var(--el-color-primary);
    border-color: var(--el-color-primary);
  }
  :deep(.el-step__title.is-finish) {
    color: var(--el-color-primary);
  }
  :deep(.el-step__line) {
    top: 13px;
  }
  :deep(.el-step__icon) {
    width: 28px;
    height: 28px;
    font-size: 14px;
  }
  :deep(.el-step__title) {
    font-size: 14px;
    line-height: 28px;
  }
}
.wizard-body {
  min-height: 340px;
  max-height: 62vh;
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
  box-shadow: 0 8px 24px rgb(39 113 134 / 10%);
}
.template-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.template-card p,
.requirement-card p,
.requirement-heading p,
.requirement-empty p {
  color: var(--el-text-color-secondary);
  margin: 8px 0;
}
.template-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}
.availability {
  color: var(--el-color-warning);
  font-size: 13px;
}
.availability.ready,
.success {
  color: var(--el-color-success);
}
.template-intro {
  margin-bottom: 22px;
}
.requirement-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 18px;
}
.requirement-heading h3 {
  margin: 0;
}
.requirement-list {
  display: grid;
  gap: 12px;
}
.requirement-card,
.requirement-empty {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
  padding: 18px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
  background: var(--el-fill-color-blank);
}
.requirement-card.ready {
  border-color: var(--el-color-success-light-5);
  background: var(--el-color-success-light-9);
}
.requirement-empty {
  grid-template-columns: auto 1fr;
}
.requirement-icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.requirement-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.account-summary {
  color: var(--el-text-color-regular);
  font-size: 13px;
}
.requirement-action {
  min-width: 160px;
  text-align: right;
}
.requirement-action .el-select {
  width: 200px;
}
@media (max-width: 720px) {
  .template-grid,
  .template-toolbar {
    grid-template-columns: 1fr;
  }
  .requirement-card {
    grid-template-columns: auto 1fr;
  }
  .requirement-action {
    grid-column: 1 / -1;
    width: 100%;
  }
  .requirement-action .el-select,
  .requirement-action .el-button {
    width: 100%;
  }
}
</style>
