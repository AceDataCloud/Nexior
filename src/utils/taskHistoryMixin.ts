import { defineComponent } from 'vue';
import { Status } from '@/models/common';
import TaskHistoryToolbar from '@/components/common/TaskHistoryToolbar.vue';
import { loadPreviousPage } from './pagination';
import type { IGetTasksArgs } from '@/store/factories/createTaskActions';

// A calendar date means through the end of that day in the viewer's timezone.
// Construct the next local midnight so DST days do not assume 24 hours.
export function historyDateCutoff(value: string): number | undefined {
  if (!value) return undefined;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw new Error('Invalid history date');
  const [, year, month, day] = match.map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    throw new Error('Invalid history date');
  }
  date.setDate(date.getDate() + 1);
  return date.getTime() / 1000;
}

export function taskHistoryMixin(storeModule: string) {
  return defineComponent({
    components: { TaskHistoryToolbar },
    data() {
      return {
        historyDate: '',
        historyChanging: false,
        historyExhausted: false,
        historyError: false,
        historyPending: false
      };
    },
    computed: {
      historyBusy(): boolean {
        const self = this as any;
        return Boolean(
          self.loadingMore ||
          self.fetchingTasks ||
          self.tasksLoading ||
          self.applicationsLoading ||
          self.$store.state[storeModule]?.status?.getApplications === Status.Request ||
          self.loadingAll ||
          this.historyChanging
        );
      },
      historyHasMore(): boolean {
        return !this.historyExhausted && Boolean((this as any).tasks?.items?.length);
      }
    },
    watch: {
      async historyBusy(busy: boolean) {
        if (busy || !this.historyPending) return;
        this.historyPending = false;
        await this.$nextTick();
        const el = (this as any).getTasksScrollElement();
        if (!this.historyError && el && el.scrollTop <= Math.max(200, el.clientHeight)) {
          await this.onReachTop();
        }
      }
    },
    methods: {
      historyQuery(payload: IGetTasksArgs = {}): IGetTasksArgs {
        // Explicit replacement also handles clearing the date back to latest.
        if (payload.replace || payload.createdAtMin !== undefined || payload.createdAtMax !== undefined) return payload;
        return { ...payload, createdAtMax: historyDateCutoff(this.historyDate) };
      },
      async onHistoryDateChange(date: string) {
        if (this.historyBusy) return;
        const self = this as any;
        this.historyChanging = true;
        this.historyError = false;
        try {
          const items = await self.onGetTasks({ createdAtMax: historyDateCutoff(date), replace: true });
          // A page guard can defer a request (e.g. credentials still initializing).
          if (!Array.isArray(items)) return;
          this.historyDate = date;
          this.historyExhausted = items.length === 0;
          await self.onScrollDown();
        } catch {
          this.historyError = true;
        } finally {
          this.historyChanging = false;
        }
      },
      async onReachTop() {
        if (!this.historyHasMore) return;
        if (this.historyBusy) {
          if (!this.historyChanging) this.historyPending = true;
          return;
        }
        const self = this as any;
        this.historyError = false;
        try {
          const result = await loadPreviousPage({
            getTasks: () => self.$store.state[storeModule]?.tasks,
            loading: self.loadingMore,
            setLoading: (value) => (self.loadingMore = value),
            isBlocked: () => self.tasksLoading || self.applicationsLoading,
            fetch: (createdAtMax) => self.onGetTasks({ createdAtMax }),
            getScrollElement: () => self.getTasksScrollElement()
          });
          if (result === 'exhausted') this.historyExhausted = true;
        } catch {
          this.historyError = true;
        }
      }
    }
  });
}
