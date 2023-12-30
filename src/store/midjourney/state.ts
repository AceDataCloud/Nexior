import { IMidjourneyState } from './models';

export default (): IMidjourneyState => {
  return {
    applications: undefined,
    getApplicationsStatus: undefined,
    imagineTasks: undefined,
    getImagineTasksStatus: undefined,
    imagineTasksTotal: undefined,
    preset: {}
  };
};
