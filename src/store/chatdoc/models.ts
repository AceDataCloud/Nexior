import { IApplication } from '@/operators';
import { Status } from '../common/models';
import { IChatdocRepository } from '@/operators/chatdoc/models';

export interface IChatdocState {
  application: IApplication | undefined;
  repositories: IChatdocRepository[] | undefined;
}
