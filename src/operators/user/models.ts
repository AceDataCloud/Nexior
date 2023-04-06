export interface IUser {
  id: string;
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
  type: 'user';
}

export interface IBot {
  id?: string;
  username?: string;
  nickname?: string;
  avatar?: string;
  type: 'bot';
}

export interface IUserDetailResponse extends IUser {}
