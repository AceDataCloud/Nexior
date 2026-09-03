import { defineComponent } from 'vue';

const HISTORY_INTERVAL_MS = 60000;

export function taskPollingMixin(storeModule: string, targeted = true) {
  return defineComponent({
    data() {
      return { taskPollRunning: false, taskHistoryPolledAt: Date.now() };
    },
    methods: {
      async onPollTasks() {
        if (this.taskPollRunning) return;
        this.taskPollRunning = true;
        try {
          const self = this as any;
          const walletMode = Boolean(self.walletMode && !self.credential?.token);
          const now = Date.now();
          const requests: Promise<unknown>[] = [];
          if (targeted && !walletMode) {
            requests.push(self.$store.dispatch(`${storeModule}/refreshPendingTasks`, { mode: 'credits' }));
          }
          if (now - this.taskHistoryPolledAt >= HISTORY_INTERVAL_MS) {
            this.taskHistoryPolledAt = now;
            requests.push(self.onGetTasks());
          }
          const results = await Promise.allSettled(requests);
          results.forEach((result) => {
            if (result.status === 'rejected') console.warn(`${storeModule} task poll failed`, result.reason);
          });
        } finally {
          this.taskPollRunning = false;
        }
      }
    }
  });
}
