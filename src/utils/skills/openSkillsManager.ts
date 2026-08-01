/**
 * Where "manage my skills" goes.
 *
 * Studio owns the skills UI at `/console/skills`; auth.acedata.cloud remains
 * the owner of the data — only the UI lives here.
 */

import type { Router } from 'vue-router';

/**
 * Open skill management.
 *
 * `router` is optional so existing callers keep working; without it this
 * falls back to a same-origin navigation.
 */
export function openSkillsManager(router?: Router): void {
  if (router) {
    void router.push({ path: '/console/skills' });
    return;
  }
  window.location.href = new URL('/console/skills', window.location.origin).toString();
}
