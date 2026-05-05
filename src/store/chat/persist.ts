export default [
  'chat.application',
  'chat.applications',
  'chat.service',
  'chat.credential',
  'chat.conversations',
  // `chat.model` is the user's preference within a group and is worth
  // remembering across reloads.
  //
  // `chat.modelGroup` is intentionally NOT persisted: it is derived
  // state, fully determined by `$route.meta.modelGroup`, and the route
  // is restored before any component mounts. Persisting it created a
  // race on refresh where vuex-persistedstate's deep-cloned hydration
  // diverged in *reference* (but not value) from the route's imported
  // constant, and `ModelSelector.mounted()`'s re-sync was then mistaken
  // for a real group switch by `SidePanel`'s watcher — which clobbered
  // `/<group>/conversations/<id>` back to `/<group>/conversations`.
  'chat.model'
];
