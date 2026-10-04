import axios from 'axios';
import { reactive } from 'vue';
import type { ISite } from '@/models';

// Not persisted: a new page load must always validate the current site.
export const siteBootstrapState = reactive({ failed: false });

const RETRY_DELAYS = [1000, 2000, 4000];
const READ_BUDGET_MS = 15000;
const REQUEST_TIMEOUT_MS = 5000;

export async function readBootstrapSite(load: (timeout: number) => Promise<ISite | undefined>) {
  const deadline = Date.now() + READ_BUDGET_MS;
  for (let attempt = 0; ; attempt++) {
    try {
      return await load(Math.min(REQUEST_TIMEOUT_MS, Math.max(1, deadline - Date.now())));
    } catch (error) {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      const retryable =
        axios.isAxiosError(error) &&
        !axios.isCancel(error) &&
        ([502, 503, 504].includes(status || 0) ||
          (!error.response && ['ERR_NETWORK', 'ECONNABORTED', 'ETIMEDOUT'].includes(error.code || '')));
      const delay = RETRY_DELAYS[attempt];
      if (!retryable || delay === undefined || Date.now() + delay >= deadline) throw error;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

export async function bootstrapSite({
  getSite,
  initializeSite,
  isAuthenticated
}: {
  getSite: (timeout: number) => Promise<ISite | undefined>;
  initializeSite: (timeout: number) => Promise<ISite | undefined>;
  isAuthenticated: () => boolean;
}) {
  let site = await readBootstrapSite(getSite);
  // A failed GET must never be interpreted as an absent site. Only a
  // successful lookup can enter the existing authenticated setup flow.
  if (isAuthenticated() && (!site?.origin || !site.admins?.length)) {
    site = await initializeSite(REQUEST_TIMEOUT_MS);
  }
  if (!site?.id) throw new Error('Site configuration unavailable');
  return site;
}
