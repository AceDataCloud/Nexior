export const COURSE_LEVEL_BEGINNER = 'Beginner';
export const COURSE_LEVEL_INTERMEDIATE = 'Intermediate';
export const COURSE_LEVEL_ADVANCED = 'Advanced';

export interface ICourse {
  id: number;
  tags?: string[];
  title?: string;
  cover?: string;
  thumbnail?: string;
  level?: typeof COURSE_LEVEL_BEGINNER | typeof COURSE_LEVEL_INTERMEDIATE | typeof COURSE_LEVEL_ADVANCED;
  discount?: number;
  price?: number;
  duration?: number;
  introduction?: string;
  createdAt?: string;
  updatedAt?: string;
  publisherId?: number;
}

export interface ICourseListResponse {
  count: number;
  items: ICourse[];
}

export type ICourseDetailResponse = ICourse;

export interface ICoursePaidStatusResponse {
  paid: boolean;
}
