import { ENDPOINT } from '@/constants';
import { IRootState } from './models';

export default (): IRootState => {
  return {
    user: {},
    token: {
      access: undefined,
      refresh: undefined,
      expiration: undefined
    },
    setting: {
      endpoint: ENDPOINT,
      stream: false
    }
  };
};
