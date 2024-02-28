import { IApplication } from '@/operators';
import { IChatdocState } from './models';
import { IChatdocRepository } from '@/operators/chatdoc/models';
import { log } from '@/utils';

export const resetAll = (state: IChatdocState): void => {
  state.application = undefined;
  state.repositories = [];
};

export const setApplication = (state: IChatdocState, payload: IApplication): void => {
  state.application = payload;
};

export const setRepositories = (state: IChatdocState, payload: IChatdocRepository[]): void => {
  const currentRepositories = state.repositories;
  if (currentRepositories) {
    // merge current repositories into payload
    payload.forEach((repository: IChatdocRepository) => {
      const index = currentRepositories.findIndex((item: IChatdocRepository) => item.id === repository.id);
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

export const setRepository = (state: IChatdocState, payload: IChatdocRepository): void => {
  log(setRepository, 'mutation', payload);
  // find the repository and set it
  const repository = payload;
  const repositories = state.repositories;
  if (!repositories) {
    log(setRepository, 'no repositories');
    return;
  }
  const index = repositories.findIndex((item: IChatdocRepository) => item.id === repository.id);
  if (index === -1) {
    log(setRepository, 'no repository found');
    return;
  }
  log(setRepository, 'set repository for index', index, repository);
  repositories[index] = {
    ...repositories[index],
    ...repository
  };
};

export default {
  setApplication,
  setRepositories,
  setRepository,
  resetAll
};
