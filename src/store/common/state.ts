import { ENDPOINT } from '@/constants';
import { IRootState } from './models';

export default (): IRootState => {
  return {
    user: {},
    token: {
      access: undefined,
      refresh: undefined
    },
    setting: {
      endpoint: ENDPOINT,
      stream: false
    },
    applications: undefined
  };
};
