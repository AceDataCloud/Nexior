import { ICourse } from '../course/types';

export interface ICategory {
  id: number;
  name?: string;
  alias?: string;
  logo?: string;
  courses?: ICourse[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ICategoryListResponse {
  count: number;
  items: ICategory[];
}

export type ICategoryDetailResponse = ICategory;
