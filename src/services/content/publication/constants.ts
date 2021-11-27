export const PUBLICATION_STATE_PENDING = 'pending';
export const PUBLICATION_STATE_RUNNING = 'running';
export const PUBLICATION_STATE_FINISHED = 'finished';

export const PUBLICATION_STATE_MAP: {
  [key: string]: string;
} = {
  Pending: PUBLICATION_STATE_PENDING,
  Running: PUBLICATION_STATE_RUNNING,
  Finished: PUBLICATION_STATE_FINISHED
};
