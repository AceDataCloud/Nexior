import type { IBrowserDevice, BrowserDeviceIncompatibilityReason } from '@/models/browserDevice';

export interface IBrowserDeviceCompatibility {
  compatible: boolean;
  reason: BrowserDeviceIncompatibilityReason | 'missing_capabilities' | null;
  missingCapabilities: string[];
}

export function resolveBrowserDeviceCompatibility(
  device: IBrowserDevice,
  requiredCapabilities: string[]
): IBrowserDeviceCompatibility {
  const available = new Set(device.capabilities || []);
  const missingCapabilities = requiredCapabilities.filter((capability) => !available.has(capability));
  if (!device.compatible) {
    return {
      compatible: false,
      reason: device.incompatibility_reason || 'device_inactive',
      missingCapabilities
    };
  }
  if (missingCapabilities.length) {
    return { compatible: false, reason: 'missing_capabilities', missingCapabilities };
  }
  return { compatible: true, reason: null, missingCapabilities: [] };
}
