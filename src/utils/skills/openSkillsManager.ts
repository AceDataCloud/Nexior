/**
 * Where "manage my skills" goes.
 *
 * Studio now has its own skills page at `/console/skills`, but the rollout
 * is gated: until `connections-in-studio` is on, skills are still managed
 * at auth.acedata.cloud (which remains the owner of the data either way —
 * only the UI moved).
 */

import type { Router } from 'vue-router';
import { withCurrentUserIdAndSite } from '../crossSiteUser';
import { isFeatureEnabled } from '../featureFlag';

const SKILLS_MANAGER_URL = 'https://auth.acedata.cloud/user/skills';

/** True when the in-Studio skills page should be used. */
export function useStudioSkills(): boolean {
  return isFeatureEnabled('connections-in-studio');
}

/**
 * Open skill management.
 *
 * Flag on → push Studio's own `/console/skills` route. Flag off → the
 * historical behaviour: open auth.acedata.cloud in a new tab, annotated
 * with `user_id` (so AuthFrontend catches a cross-site identity mismatch)
 * and `site` (so it renders the calling subsite's white-label logo).
 */
export function openSkillsManager(router?: Router): void {
  if (useStudioSkills()) {
    if (router) {
      void router.push({ path: '/console/skills' });
      return;
    }
    window.location.href = new URL('/console/skills', window.location.origin).toString();
    return;
  }
  window.open(withCurrentUserIdAndSite(SKILLS_MANAGER_URL), '_blank', 'noopener');
}
