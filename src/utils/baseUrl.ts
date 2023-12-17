import { ENV_LOCAL, ENV_TEST } from '@/constants';
import { getEnv } from './env';

/**
 * Get base url of app
 * @returns
 */
export const getDataBaseUrl = () => {
  const env = getEnv();
  if (env === ENV_LOCAL) {
    return 'https://data.local.zhishuyun.com';
  } else if (env === ENV_TEST) {
    return 'https://data.test.zhishuyun.com';
  } else {
    return 'https://data.zhishuyun.com';
  }
};

/**
 * Get base url of app
 * @returns
 */
export const getHubBaseUrl = () => {
  const env = getEnv();
  if (env === ENV_LOCAL) {
    return 'https://hub.local.zhishuyun.com';
  } else if (env === ENV_TEST) {
    return 'https://hub.test.zhishuyun.com';
  } else {
    return 'https://hub.zhishuyun.com';
  }
};

export const getAuthBaseUrl = () => {
  const env = getEnv();
  if (env === ENV_LOCAL) {
    return 'https://auth.test.zhishuyun.com';
  } else if (env === ENV_TEST) {
    return 'https://auth.test.zhishuyun.com';
  } else {
    return 'https://auth.zhishuyun.com';
  }
};
