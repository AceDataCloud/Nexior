<template>
  <div class="acemusic-page">
    <aside v-if="enabled && !mobile" class="config-column">
      <config-panel :submitting="submitting" @generate="generate" />
    </aside>
    <section class="results-column">
      <el-alert
        v-if="!enabled"
        class="m-3 !w-auto"
        :closable="false"
        :title="$t('acemusic.message.disabled')"
        type="info"
      />
      <div class="history-header">
        <task-history-toolbar
          :date="historyDate"
          :busy="historyBusy"
          :has-more="historyHasMore"
          :error="historyError"
          @date-change="onHistoryDateChange"
          @load-more="onReachTop"
        />
        <el-button v-if="enabled" class="mobile-create" type="primary" @click="drawer = true">{{
          $t('acemusic.button.create')
        }}</el-button>
      </div>
      <recent-panel
        ref="recentPanel"
        :loading="fetchingTasks || historyChanging"
        @reach-top="onReachTop"
        @reuse="reuse"
      />
      <div v-show="Boolean(audio?.audio_url)" class="player">
        <audio-player namespace="acemusic" :tracks="playableTracks" />
      </div>
    </section>
    <el-drawer
      v-if="enabled && mobile"
      v-model="drawer"
      :title="displayName"
      direction="ltr"
      size="min(360px, 94vw)"
      class="generator-drawer"
    >
      <config-panel :submitting="submitting" @generate="generate" />
    </el-drawer>
  </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue';
import { ElAlert, ElButton, ElDrawer, ElMessage } from 'element-plus';
import ConfigPanel from '@/components/acemusic/ConfigPanel.vue';
import RecentPanel from '@/components/acemusic/RecentPanel.vue';
import AudioPlayer from '@/components/common/player/Player.vue';
import { acemusicOperator, buildAcemusicAudioRequest } from '@/operators/acemusic';
import type { IAcemusicAudio, IAcemusicTask } from '@/models';
import { Status } from '@/models';
import { ensureLoggedIn } from '@/utils';
import { isAcemusicAudioPlayable, mergeAcemusicTasks } from '@/utils/acemusic';
import { resolveCapabilityPresentation } from '@/utils/capabilityPresentation';
import { taskHistoryMixin } from '@/utils/taskHistoryMixin';
import { taskPollingMixin } from '@/utils/taskPollingMixin';
import taskDrawerMixin from '@/utils/taskDrawerMixin';
import { showcaseRecreateMixin } from '@/utils/showcaseRecreateMixin';
import { instrumentGeneration } from '@/plugins/telemetry';

export default defineComponent({
  name: 'AcemusicIndex',
  components: { ConfigPanel, RecentPanel, AudioPlayer, ElAlert, ElButton, ElDrawer },
  mixins: [
    taskHistoryMixin('acemusic'),
    taskPollingMixin('acemusic'),
    showcaseRecreateMixin('acemusic'),
    taskDrawerMixin
  ],
  inject: ['initialized'],
  data() {
    return {
      mobile: typeof window !== 'undefined' && window.innerWidth < 768,
      submitting: false,
      fetchingTasks: false,
      loadingMore: false,
      job: 0
    };
  },
  computed: {
    enabled(): boolean {
      return Boolean(this.$store.state.site?.features?.acemusic?.enabled);
    },
    displayName(): string {
      return resolveCapabilityPresentation(this.$store.state.site, 'acemusic', 'ACE Music', '').displayName;
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
    },
    playableTracks(): IAcemusicAudio[] {
      return (this.tasks?.items || [])
        .flatMap((task: IAcemusicTask) => task.response?.data || [])
        .filter(isAcemusicAudioPlayable);
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
    window.addEventListener('resize', this.onResize);
    void this.$store.dispatch('acemusic/getService');
    this.job = window.setInterval(() => {
      if (this.credential?.token && !document.hidden) void this.onPollTasks();
    }, 5000);
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.onResize);
    window.clearInterval(this.job);
    this.$store.commit('acemusic/setAudio', { id: '', volume: 100 });
  },
  methods: {
    onResize() {
      this.mobile = window.innerWidth < 768;
    },
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
    async generate() {
      if (this.submitting || !this.enabled || !ensureLoggedIn()) return;
      const token = this.credential?.token;
      if (!token) {
        ElMessage.warning(this.$t('acemusic.message.credential'));
        return;
      }
      const request = buildAcemusicAudioRequest(this.$store.state.acemusic.config);
      if (request.custom ? !(request.lyric && request.style && request.title) : !request.prompt) return;
      this.submitting = true;
      try {
        const { data } = await instrumentGeneration('acemusic', acemusicOperator.audio(request, { token }));
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
      } catch {
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
<style scoped>
.acemusic-page {
  display: flex;
  flex: 1;
  min-height: 0;
  height: 100%;
  background: var(--app-content-bg);
}
.config-column {
  width: 340px;
  flex-shrink: 0;
  min-height: 0;
  background: var(--app-sidebar-bg);
  border-right: 1px solid var(--app-border-subtle);
}
.results-column {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  min-height: 0;
}
.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.player {
  flex-shrink: 0;
  border-top: 1px solid var(--app-border-subtle);
  background: var(--app-sidebar-bg);
}
.mobile-create {
  display: none;
}
@media (max-width: 767px) {
  .config-column {
    display: none;
  }
  .mobile-create {
    display: inline-flex;
    margin: 8px 12px;
  }
  .history-header {
    min-height: 48px;
  }
}
</style>
