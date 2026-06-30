export const MOBILE_APP_VERSION = '3.252.1';

export const MOBILE_ANDROID_DOWNLOAD_URL = 'https://cdn.acedata.cloud/2f29543715.apk';

export const MOBILE_ANDROID_PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.acedatacloud.nexior';

export const MOBILE_IOS_APP_STORE_URL = 'https://apps.apple.com/app/id6772432921';

export const MOBILE_IOS_DOWNLOAD_URL = '';

export const MOBILE_IOS_FALLBACK_URL = '';

// Desktop (Electron) installers — attached to every public GitHub Release.
// UNSIGNED beta: Windows SmartScreen / macOS Gatekeeper warn on first launch.
// URLs embed the version → bump DESKTOP_APP_VERSION each release (like the APK).
export const DESKTOP_APP_VERSION = '3.292.0';

const DESKTOP_RELEASE_TAG = `@acedatacloud%2Fnexior_v${DESKTOP_APP_VERSION}`;
const DESKTOP_RELEASE_BASE = `https://github.com/AceDataCloud/Nexior/releases/download/${DESKTOP_RELEASE_TAG}`;

export const DESKTOP_WINDOWS_DOWNLOAD_URL = `${DESKTOP_RELEASE_BASE}/AceData.Setup.${DESKTOP_APP_VERSION}.exe`;

export const DESKTOP_MAC_ARM_DOWNLOAD_URL = `${DESKTOP_RELEASE_BASE}/AceData-${DESKTOP_APP_VERSION}-arm64.dmg`;

export const DESKTOP_MAC_INTEL_DOWNLOAD_URL = `${DESKTOP_RELEASE_BASE}/AceData-${DESKTOP_APP_VERSION}.dmg`;
