import { ENV_LOCAL, ENV_PRODUCTION, ENV_TEST } from '@/constants';

const PATTERN_TEST_ENV = '.test.zhishuyun.com';
const PATTERN_LOCAL_ENV = '.local.zhishuyun.com';

/**
 * Get env of App, return local, test, production
 * @returns
 */
export const getEnv = () => {
  const host = window.location.host;
  if (host.indexOf(PATTERN_LOCAL_ENV) > 0) {
    return ENV_LOCAL;
  }
  if (host.indexOf(PATTERN_TEST_ENV) > 0) {
    return ENV_TEST;
  }
  return ENV_PRODUCTION;
};
