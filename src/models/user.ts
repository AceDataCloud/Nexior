// `IUser` and `IUserDetailResponse` are re-exported from
// `@acedatacloud/common-frontend` (the `commonfrontend/` git submodule)
// so AuthFrontend / Nexior / PlatformFrontend share one source of truth
// for the account-user shape. The shared type is a strict superset of
// what Nexior used to declare locally (it adds optional fields like
// `description`, `phone`, `is_verified`, `*_id`, …) — Nexior's existing
// callers only touch the original 12 fields, so widening is safe.
//
// `IUserListResponse` stays local because Nexior is the only consumer
// of a paginated user list today (admin-side flows). If a second
// consumer needs it later, promote it to `@common/types/user` then.
export type { IUser, IUserDetailResponse } from '@common/types/user';
import type { IUser } from '@common/types/user';

export interface IUserListResponse {
  count: number;
  items: IUser[];
}
