import type { CapabilityKey } from '@/constants/capabilities';
import type { ISite } from '@/models';

export interface CapabilityPresentation {
  displayName: string;
  iconUrl: string;
  isOverridden: boolean;
}

export function resolveCapabilityPresentation(
  site: ISite | null | undefined,
  capability: CapabilityKey,
  defaultDisplayName: string,
  defaultIconUrl: string
): CapabilityPresentation {
  const override = site?.capability_overrides?.[capability];
  const displayName = override?.display_name?.trim() || defaultDisplayName;
  const iconUrl = override?.icon_url?.trim() || defaultIconUrl;
  return {
    displayName,
    iconUrl,
    isOverridden: displayName !== defaultDisplayName || iconUrl !== defaultIconUrl
  };
}
