export const isTest = window.location.origin === 'https://hub-test.acedata.cloud';

export const BASE_URL_PLATFORM = isTest ? 'https://platform-test.acedata.cloud' : 'https://platform.acedata.cloud';
export const BASE_URL_HUB = isTest ? 'https://hub-test.acedata.cloud' : 'https://hub.acedata.cloud';
export const BASE_URL_AUTH = isTest ? 'https://auth-test.acedata.cloud' : 'https://auth.acedata.cloud';
export const BASE_URL_API = isTest ? 'https://api-test.acedata.cloud' : 'https://api.acedata.cloud';

export const BASE_HOST_PLATFORM = new URL(BASE_URL_PLATFORM).host;
export const BASE_HOST_HUB = new URL(BASE_URL_HUB).host;
export const BASE_HOST_AUTH = new URL(BASE_URL_AUTH).host;
export const BASE_HOST_API = new URL(BASE_URL_API).host;
