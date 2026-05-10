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

export interface IUserListResponse {
  count: number;
  items: IUser[];
}

export interface IUserDetailResponse extends IUser {}

export type IUserPublicRegistrationMethod = 'email' | 'phone' | 'github' | 'google' | 'wechat' | 'username' | 'unknown';

export interface IUserPublic {
  id: string;
  display_name?: string;
  nickname?: string;
  avatar?: string;
  registration_method?: IUserPublicRegistrationMethod;
  contact?: string;
}
