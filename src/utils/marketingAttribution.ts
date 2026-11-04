import { browserAttributionAllowed, browserCookies, createAcquisitionContext } from '@acedatacloud/core/attribution';

// Shared with Platform and Auth; local signup context, not a visit collector.
export const marketingAttribution = createAcquisitionContext({
  cookies: browserCookies('.acedata.cloud'),
  allowed: browserAttributionAllowed
});
