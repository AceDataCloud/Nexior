import {
  ROUTE_CONSOLE_DISTRIBUTION_HISTORY,
  ROUTE_CONSOLE_DISTRIBUTION_INDEX,
  ROUTE_CONSOLE_DISTRIBUTION_INVITEES
} from './constants';

// Backward-compat: distribution pages were moved under /console/. Preserve
// the legacy /distribution[/...] URLs by redirecting to the new names so
// existing share links / bookmarks keep working.
export default {
  path: '/distribution',
  children: [
    {
      path: '',
      redirect: { name: ROUTE_CONSOLE_DISTRIBUTION_INDEX }
    },
    {
      path: 'history',
      redirect: { name: ROUTE_CONSOLE_DISTRIBUTION_HISTORY }
    },
    {
      path: 'invitees',
      redirect: { name: ROUTE_CONSOLE_DISTRIBUTION_INVITEES }
    }
  ]
};
