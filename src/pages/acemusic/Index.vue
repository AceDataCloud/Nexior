<template>
  <layout>
    <template #config>
      <config-panel v-if="enabled" :submitting="submitting" @generate="generate" />
      <el-alert v-else class="m-3 !w-auto" :closable="false" :title="$t('acemusic.message.disabled')" type="info" />
    </template>
    <template #result>
      <showcase-result-tabs service="acemusic">
        <template #task-actions>
          <task-history-toolbar
            :date="historyDate"
            :busy="historyBusy"
            :has-more="historyHasMore"
            :error="historyError"
            @date-change="onHistoryDateChange"
            @load-more="onReachTop"
          />
        </template>
        <template #tasks>
          <el-alert
            v-if="!enabled"
            class="m-3 !w-auto"
            :closable="false"
            :title="$t('acemusic.message.disabled')"
            type="info"
          />
          <div v-if="pendingGeneration && !submitting" class="m-3 p-3 rounded-lg bg-[var(--el-color-warning-light-9)]">
            <p class="text-sm mb-2">{{ $t('acemusic.message.recover') }}</p>
            <el-button size="small" :loading="submitting" @click="generate(true)">{{
              $t('acemusic.button.recoverAudio')
            }}</el-button>
          </div>
          <recent-panel
            ref="recentPanel"
            :loading="fetchingTasks || historyChanging"
            @reach-top="onReachTop"
            @reuse="reuse"
          />
        </template>
      </showcase-result-tabs>
    </template>
    <template #preview>
      <preview-panel namespace="acemusic" />
    </template>
  </layout>
</template>
<script lang="ts">
import { defineComponent } from 'vue';
import { ElAlert, ElButton, ElMessage } from 'element-plus';
import Layout from '@/layouts/Suno.vue';
import ShowcaseResultTabs from '@/components/common/ShowcaseResultTabs.vue';
import PreviewPanel from '@/components/suno/PreviewPanel.vue';
import ConfigPanel from '@/components/acemusic/ConfigPanel.vue';
import RecentPanel from '@/components/acemusic/RecentPanel.vue';
import { acemusicOperator, buildAcemusicAudioRequest } from '@/operators/acemusic';
import type { IAcemusicTask } from '@/models';
import { Status } from '@/models';
import { ensureLoggedIn } from '@/utils';
import { mergeAcemusicTasks } from '@/utils/acemusic';
import { taskHistoryMixin } from '@/utils/taskHistoryMixin';
import { taskPollingMixin } from '@/utils/taskPollingMixin';
import taskDrawerMixin from '@/utils/taskDrawerMixin';
import { showcaseRecreateMixin } from '@/utils/showcaseRecreateMixin';
import { instrumentGeneration } from '@/plugins/telemetry';
import {
  pendingAcemusicSubmission,
  prepareAcemusicSubmission,
  settleAcemusicSubmission,
  isDefiniteAcemusicRejection
} from '@/utils/acemusicSubmission';

export default defineComponent({
  name: 'AcemusicIndex',
  components: { Layout, ConfigPanel, RecentPanel, ShowcaseResultTabs, PreviewPanel, ElAlert, ElButton },
  mixins: [
    taskHistoryMixin('acemusic'),
    taskPollingMixin('acemusic'),
    showcaseRecreateMixin('acemusic'),
    taskDrawerMixin
  ],
  inject: ['initialized'],
  data() {
    return {
      submitting: false,
      fetchingTasks: false,
      loadingMore: false,
      job: 0
    };
  },
  computed: {
    pendingGeneration() {
      return pendingAcemusicSubmission(this.$store, 'audios');
    },
    enabled(): boolean {
      return Boolean(this.$store.state.site?.features?.acemusic?.enabled);
    },
    credential() {
      return this.$store.state.acemusic?.credential;
    },
    tasks() {
      return this.$store.state.acemusic?.tasks;
    },
    audio() {
      return this.$store.state.acemusic?.audio;
    },
    applicationsLoading(): boolean {
      return this.$store.state.acemusic?.status.getApplications === Status.Request;
    },
    tasksLoading(): boolean {
      return this.$store.state.acemusic?.status.getTasks === Status.Request;
    }
  },
  watch: {
    initialized: {
      immediate: true,
      handler(value: boolean) {
        if (value) void this.loadHistory();
      }
    },
    'credential.token'(value: string | undefined, previous: string | undefined) {
      if (value === previous) return;
      this.$store.commit('acemusic/setTasks', undefined);
      this.$store.commit('acemusic/setAudio', { id: '', volume: 100 });
      this.historyDate = '';
      this.historyExhausted = false;
      if (value) void this.loadHistory();
    }
  },
  mounted() {
    void this.$store.dispatch('acemusic/getService');
    this.job = window.setInterval(() => {
      if (this.credential?.token && !document.hidden) void this.onPollTasks();
    }, 5000);
  },
  beforeUnmount() {
    window.clearInterval(this.job);
    this.$store.commit('acemusic/setAudio', { id: '', volume: 100 });
  },
  methods: {
    async loadHistory() {
      try {
        await this.onGetTasks({ replace: true });
        await this.onScrollDown();
      } catch {
        this.historyError = true;
      }
    },
    async onGetTasks(payload?: { limit?: number; createdAtMin?: number; createdAtMax?: number; replace?: boolean }) {
      if (!this.credential?.token || this.applicationsLoading || this.fetchingTasks) return;
      this.fetchingTasks = true;
      try {
        return await this.$store.dispatch('acemusic/getTasks', { limit: 10, ...this.historyQuery(payload) });
      } finally {
        this.fetchingTasks = false;
      }
    },
    getTasksScrollElement(): HTMLElement | undefined {
      return (this.$refs.recentPanel as any)?.getScrollElement();
    },
    async onScrollDown() {
      await this.$nextTick();
      const el = this.getTasksScrollElement();
      if (el) el.scrollTop = el.scrollHeight;
    },
    reuse(task: IAcemusicTask) {
      if (!this.enabled || !task.request) return;
      const { model = 'acemusic-v1.1', custom = false, prompt, lyric, title, style } = task.request;
      this.$store.commit('acemusic/setConfig', { model, custom, prompt, lyric, title, style });
      if (window.innerWidth < 768) this.drawer = true;
      ElMessage.success(this.$t('acemusic.message.reused'));
    },
    async generate(recover = false) {
      if (this.submitting || (!this.enabled && !recover) || (!recover && this.pendingGeneration) || !ensureLoggedIn())
        return;
      const token = this.credential?.token;
      if (!token || !this.$store.state.user?.id || !this.$store.state.acemusic.application?.id) {
        ElMessage.warning(this.$t('acemusic.message.credential'));
        return;
      }
      const request =
        recover && this.pendingGeneration
          ? (this.pendingGeneration.request as import('@/models').IAcemusicAudioRequest)
          : buildAcemusicAudioRequest(this.$store.state.acemusic.config);
      if (request.custom ? !(request.lyric && request.style && request.title) : !request.prompt) return;
      const submission = prepareAcemusicSubmission(this.$store, 'audios', request);
      this.submitting = true;
      try {
        const { data } = await instrumentGeneration(
          'acemusic',
          acemusicOperator.audio(request, { token, idempotencyKey: submission.key })
        );
        if (data.task_id) settleAcemusicSubmission(this.$store, submission);
        if (token !== this.credential?.token) return;
        if (!data.task_id || data.success === false) throw new Error(this.$t('acemusic.message.failed'));
        const task: IAcemusicTask = {
          id: data.task_id,
          trace_id: data.trace_id,
          created_at: Date.now() / 1000,
          state: data.state || data.status || 'processing',
          request,
          ...(data.data ? { response: data } : {})
        };
        this.$store.commit('acemusic/setTasksItems', mergeAcemusicTasks(this.tasks?.items || [], [task]));
        this.historyDate = '';
        this.historyExhausted = false;
        this.drawer = false;
        ElMessage.success(this.$t('acemusic.message.accepted'));
        await this.onScrollDown();
      } catch (error: any) {
        if (error?.response?.data?.task_id || isDefiniteAcemusicRejection(error))
          settleAcemusicSubmission(this.$store, submission);
        ElMessage.error(this.$t('acemusic.message.failed'));
      } finally {
        this.submitting = false;
        void this.onGetTasks().catch(() => {
          this.historyError = true;
        });
      }
    }
  }
});
</script>
