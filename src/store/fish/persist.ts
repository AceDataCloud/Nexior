// `tasks` and `voices` are intentionally NOT persisted — both are fetched on
// page open and grow unbounded. See flux/persist.ts for the same rationale.
export default ['fish.credential', 'fish.application', 'fish.applications'];
