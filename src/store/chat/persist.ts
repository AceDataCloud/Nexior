// Do NOT persist `chat.model` / `chat.modelGroup`: their `getDisplayName()` /
// `getDescription()` methods are dropped by JSON round-trip, and the empty
// objects then crash `ModelSelector.vue` (re-derived from route on mount).
export default ['chat.application', 'chat.applications', 'chat.service', 'chat.credential', 'chat.conversations'];
