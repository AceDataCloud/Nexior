import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.acedatacloud.nexior',
  appName: 'AceData',
  webDir: 'dist',
  plugins: {
    // We drive @capgo/capacitor-updater manually from `src/utils/liveUpdate.ts`
    // against our own COS-hosted manifest, so the plugin's built-in
    // auto-update / Capgo cloud features must stay off.
    CapacitorUpdater: {
      autoUpdate: false,
      autoDeleteFailed: true,
      autoDeletePrevious: true,
      resetWhenUpdate: false
    }
  }
};

export default config;
