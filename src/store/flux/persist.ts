// `flux.tasks` deliberately NOT persisted: paginated API cache, re-fetched on page mount.
// Persisting it across all per-app modules grew the `vuex` localStorage blob past the
// browser quota (~5 MB) for power users — see Failed to execute 'setItem' on 'Storage'.
export default ['flux.credential', 'flux.application', 'flux.applications'];
