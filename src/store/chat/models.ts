import { IApplication } from '@/operators';
import { Status } from '../common/models';

export interface IChatState {
  applications: IApplication[] | undefined;
  applicationsStatus: Status | undefined;
}
