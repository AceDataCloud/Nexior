export interface IUser {
  id?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  nickname?: string;
  gender?: number;
  city?: string;
  province?: string;
  country?: string;
  avatar?: string;
}

export interface IUserDetailResponse extends IUser {}
