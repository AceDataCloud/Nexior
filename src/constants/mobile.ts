export const MOBILE_APP_VERSION = '3.252.1';

// Stable asset names are published only with a complete, verified Release.
// GitHub resolves /latest/download/ at request time, so pages never pin an old build.
const LATEST_DOWNLOAD_URL = 'https://github.com/AceDataCloud/Nexior/releases/latest/download';

export const MOBILE_ANDROID_DOWNLOAD_URL = `${LATEST_DOWNLOAD_URL}/nexior.apk`;

export const MOBILE_ANDROID_PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.acedatacloud.nexior';

export const MOBILE_IOS_APP_STORE_URL = 'https://apps.apple.com/app/id6772432921';

export const MOBILE_IOS_DOWNLOAD_URL = '';

export const MOBILE_IOS_FALLBACK_URL = '';

export const DESKTOP_WINDOWS_DOWNLOAD_URL = `${LATEST_DOWNLOAD_URL}/AceData.Setup.exe`;
export const DESKTOP_MAC_ARM64_DOWNLOAD_URL = `${LATEST_DOWNLOAD_URL}/AceData-arm64.dmg`;
export const DESKTOP_MAC_INTEL_DOWNLOAD_URL = `${LATEST_DOWNLOAD_URL}/AceData.dmg`;
export const DESKTOP_RELEASES_URL = 'https://github.com/AceDataCloud/Nexior/releases/latest';
