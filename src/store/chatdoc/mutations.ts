import { IApplication, IChatdocRepository, ICredential, IService } from '@/models';
import { IChatdocState } from './models';

export const resetAll = (state: IChatdocState): void => {
  state.application = undefined;
  state.repositories = [];
};

export const setService = (state: IChatdocState, payload: IService): void => {
  state.service = payload;
};

export const setApplication = (state: IChatdocState, payload: IApplication): void => {
  state.application = payload;
};
export const setApplications = (state: IChatdocState, payload: IApplication[]): void => {
  state.applications = payload;
};

export const setRepositories = (state: IChatdocState, payload: IChatdocRepository[]): void => {
  const currentRepositories = state.repositories;
  if (currentRepositories && payload) {
    // merge current repositories into payload
    payload.forEach((repository: IChatdocRepository) => {
      const index = currentRepositories?.findIndex((item: IChatdocRepository) => item.id === repository.id);
      if (index !== -1) {
        payload[index] = {
          ...currentRepositories[index],
          ...repository
        };
      }
    });
    state.repositories = payload;
    return;
  } else {
    // set the repositories
    state.repositories = payload;
  }
};

export const setCredential = (state: IChatdocState, payload: ICredential): void => {
  state.credential = payload;
};

export const setRepository = (state: IChatdocState, payload: IChatdocRepository): void => {
  console.debug('mutation', payload);
  // find the repository and set it
  const repository = payload;
  const repositories = state.repositories;
  if (!repositories) {
    console.debug('no repositories');
    return;
  }
  const index = repositories.findIndex((item: IChatdocRepository) => item.id === repository.id);
  if (index === -1) {
    console.debug('no repository found');
    return;
  }
  console.debug('set repository for index', index, repository);
  repositories[index] = {
    ...repositories[index],
    ...repository
  };
};

export default {
  setService,
  setApplication,
  setApplications,
  setRepositories,
  setRepository,
  setCredential,
  resetAll
};
