import { ROUTE_SHARE_CONVERSATION } from './constants';

// Public, anonymous, read-only view of a shared conversation snapshot.
// Standalone full-screen page (no app chrome, no sidebar) — like the 404
// route. Not listed in AUTH_REQUIRED_PREFIXES, so guests can open it. The
// page fetches `/aichat2/shared` (a PlatformGateway PUBLIC_PATH) with no token.
export default {
  path: '/share/:id',
  name: ROUTE_SHARE_CONVERSATION,
  component: () => import('@/pages/share/Conversation.vue'),
  meta: { auth: false }
};
