import { getEnv } from './env';

/**
 * Get base url of app
 * @returns
 */
export const getDataBaseUrl = () => {
  const env = getEnv();
  if (env === 'local') {
    return 'https://data.local.zhishuyun.com';
  } else if (env === 'test') {
    return 'https://data.test.zhishuyun.com';
  } else {
    return 'https://data.zhishuyun.com';
  }
};

export const getAuthBaseUrl = () => {
  const env = getEnv();
  if (env === 'local') {
    return 'https://auth.test.zhishuyun.com';
  } else if (env === 'test') {
    return 'https://auth.test.zhishuyun.com';
  } else {
    return 'https://auth.zhishuyun.com';
  }
};
