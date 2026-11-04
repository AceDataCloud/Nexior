const jobs: Array<{ run: () => Promise<void>; signal: AbortSignal }> = [];
let running = false;

async function drain(): Promise<void> {
  if (running) return;
  running = true;
  try {
    while (jobs.length) {
      const job = jobs.shift()!;
      if (!job.signal.aborted) await job.run();
    }
  } finally {
    running = false;
  }
}

export function queueImageTaskDetail(run: () => Promise<void>, signal: AbortSignal): void {
  jobs.push({ run, signal });
  void drain();
}
