<template>
  <el-dialog
    v-model="visible"
    :title="$t('chat.scheduledTemplates.title')"
    width="min(980px, 94vw)"
    top="4vh"
    :close-on-click-modal="false"
  >
    <el-steps :active="step" finish-status="success" align-center class="wizard-steps">
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
      <h3>{{ $t('chat.scheduledTemplates.connectionTitle') }}</h3>
      <div v-if="!selected.requirements.connections.length" class="requirement-row ready">
        <success-icon :size="18" /> {{ $t('chat.scheduledTemplates.noConnections') }}
      </div>
      <div v-for="connection in selected.requirements.connections" :key="connection" class="requirement-row">
        <div>
          <strong>{{ connection }}</strong>
          <p>
            {{
              connectionReady(connection)
                ? $t('chat.scheduledTemplates.connected')
                : $t('chat.scheduledTemplates.notConnected')
            }}
          </p>
        </div>
        <el-select
          v-if="connectionAccounts(connection).length > 1"
          v-model="connectionBindings[connection]"
          :placeholder="$t('chat.scheduledTemplates.chooseAccount')"
        >
          <el-option
            v-for="account in connectionAccounts(connection)"
            :key="account.connection_id"
            :label="account.label || account.account_name"
            :value="account.connection_id"
          />
        </el-select>
        <el-button v-else-if="!connectionReady(connection)" type="primary" plain @click="browseConnections = true">
          {{ $t('chat.scheduledTemplates.connect') }}
        </el-button>
        <success-icon v-else class="success" :size="20" />
      </div>
      <browse-connectors v-model="browseConnections" @installed="reloadTemplates" />
    </section>

    <section v-else-if="step === 3 && selected" class="wizard-body test-step">
      <h3>{{ $t('chat.scheduledTemplates.testTitle') }}</h3>
      <p>{{ $t('chat.scheduledTemplates.testHint') }}</p>
      <el-input v-if="preview" :model-value="preview" type="textarea" :rows="9" readonly />
      <div v-if="testTask" class="test-status">
        <el-alert
          :title="
            testSucceeded ? $t('chat.scheduledTemplates.testSucceeded') : $t('chat.scheduledTemplates.testRunning')
          "
          :type="testSucceeded ? 'success' : 'info'"
          :closable="false"
        />
      </div>
      <el-button v-if="!testTask" type="primary" :loading="working" @click="runTest">
        {{ $t('chat.scheduledTemplates.runTest') }}
      </el-button>
      <el-button v-else-if="!testSucceeded" :loading="working" @click="refreshTest">
        {{ $t('chat.scheduledTemplates.refreshTest') }}
      </el-button>
    </section>

    <section v-else-if="step === 4 && selected && testTask" class="wizard-body enable-step">
      <h3>{{ $t('chat.scheduledTemplates.enableTitle') }}</h3>
      <dl>
        <div>
          <dt>{{ $t('chat.scheduledTemplates.template') }}</dt>
          <dd>{{ selected.title }}</dd>
        </div>
        <div>
          <dt>{{ $t('chat.scheduledTemplates.schedule') }}</dt>
          <dd>{{ scheduleTime }}</dd>
        </div>
        <div>
          <dt>{{ $t('chat.scheduledTemplates.permissions') }}</dt>
          <dd>{{ selected.requirements.skills.join(', ') || $t('chat.scheduledTemplates.none') }}</dd>
        </div>
      </dl>
      <el-alert :title="$t('chat.scheduledTemplates.enableHint')" type="warning" :closable="false" />
    </section>

    <template #footer>
      <el-button v-if="step > 0 && step < 4" :disabled="working" @click="step -= 1">{{
        $t('common.button.previous')
      }}</el-button>
      <el-button v-if="step < 3" type="primary" :disabled="!canContinue" @click="step += 1">{{
        $t('common.button.next')
      }}</el-button>
      <el-button v-if="step === 3 && testSucceeded" type="primary" @click="step = 4">{{
        $t('common.button.next')
      }}</el-button>
      <el-button v-if="step === 4" type="primary" :loading="working" @click="enableTask">
        {{ $t('chat.scheduledTemplates.enable') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import {
  ElAlert,
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
import { SuccessIcon } from '@acedatacloud/core/icons/components';
import BrowseConnectors from '@/components/connections/BrowseConnectors.vue';
import {
  scheduledTasksOperator,
  type IAuthorizableConnectionAccount,
  type IScheduledRun,
  type IScheduledTask,
  type IScheduledTaskTemplateDefinition,
  type IScheduleSpec
} from '@/operators/scheduledTasks';

export default defineComponent({
  name: 'ScheduledTemplateWizard',
  components: {
    BrowseConnectors,
    ElAlert,
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
      browseConnections: false,
      preview: '',
      testTask: null as IScheduledTask | null,
      testRun: null as IScheduledRun | null
    };
  },
  computed: {
    testSucceeded(): boolean {
      return this.testRun?.status === 'success';
    },
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
        const accounts = this.connectionAccounts(connection);
        const account = accounts.find((item) => item.is_default) ?? accounts[0];
        if (account) this.connectionBindings[connection] = account.connection_id;
      }
    },
    connectionAccounts(connection: string): IAuthorizableConnectionAccount[] {
      return this.selected?.connection_accounts?.[connection] ?? [];
    },
    connectionReady(connection: string): boolean {
      const accounts = this.connectionAccounts(connection);
      return accounts.length === 1 || !!this.connectionBindings[connection];
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
        const accounts = this.connectionAccounts(connection);
        const id = this.connectionBindings[connection] || accounts[0]?.connection_id;
        const account = accounts.find((item) => item.connection_id === id);
        return account
          ? [{ connector_identifier: account.connector_identifier, connection_id: account.connection_id }]
          : [];
      });
    },
    async runTest() {
      if (!this.selected) return;
      this.working = true;
      try {
        const preview = await scheduledTasksOperator.previewTemplate(
          this.token,
          this.selected.id,
          this.selected.version,
          this.inputs
        );
        this.preview = preview.question;
        this.testTask = await scheduledTasksOperator.instantiateTemplate(this.token, {
          template_id: this.selected.id,
          version: this.selected.version,
          inputs: this.inputs,
          schedule: this.buildSchedule(),
          connection_bindings: this.bindings()
        });
        await scheduledTasksOperator.triggerTask(this.token, this.testTask.id);
        await this.refreshTest();
      } catch {
        ElMessage.error(this.$t('chat.scheduledTemplates.testFailed') as string);
      } finally {
        this.working = false;
      }
    },
    async refreshTest() {
      if (!this.testTask) return;
      this.working = true;
      try {
        const runs = await scheduledTasksOperator.listRuns(this.token, this.testTask.id);
        this.testRun = runs[0] ?? null;
      } finally {
        this.working = false;
      }
    },
    async enableTask() {
      if (!this.testTask) return;
      this.working = true;
      try {
        const task = await scheduledTasksOperator.enableTemplateTask(this.token, this.testTask.id);
        this.$emit('created', task);
        this.visible = false;
        ElMessage.success(this.$t('chat.scheduledTemplates.enabled') as string);
      } catch {
        ElMessage.error(this.$t('chat.scheduledTemplates.enableFailed') as string);
      } finally {
        this.working = false;
      }
    }
  }
});
</script>

<style scoped lang="scss">
.wizard-steps {
  margin-bottom: 24px;
}
.wizard-body {
  min-height: 420px;
  max-height: 66vh;
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
.requirement-row p {
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
.requirement-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.test-step > .el-button,
.test-status {
  margin-top: 16px;
}
dl > div {
  display: grid;
  grid-template-columns: 140px 1fr;
  padding: 12px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
dt {
  color: var(--el-text-color-secondary);
}
dd {
  margin: 0;
}
@media (max-width: 720px) {
  .template-grid,
  .template-toolbar {
    grid-template-columns: 1fr;
  }
}
</style>
