import { IApplication, IChatdocRepository } from '@/models';

export interface IChatdocState {
  application: IApplication | undefined;
  repositories: IChatdocRepository[] | undefined;
}
