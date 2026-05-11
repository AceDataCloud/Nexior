// Vuex root keys to persist into localStorage via vuex-persistedstate.
//
// `site` is intentionally NOT persisted: the value is fetched fresh on
// every page load by `initializeSite` -> `getSite`, and persisting it
// causes a real outage when admins flip a feature flag (e.g.
// `features.subsite.enabled`) — every previously-logged-in user will
// rehydrate the OLD site object from localStorage on next visit and
// the new flag never reaches the UI until they manually clear storage.
// Site rows are tiny (<5 KB), so refetching on every load is cheap.
export default ['user', 'token', 'locale', 'dark', 'config', 'currency', 'exchange', 'fingerprint'];
