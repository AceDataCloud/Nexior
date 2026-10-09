import type { IChatModel, IChatModelGroup, ISite } from '@/models';
import type { CapabilityKey } from '@/constants/capabilities';

export function resolveModelDisplayName(site: ISite | null | undefined, model: IChatModel): string {
  const group = model.modelGroup;
  return (
    (group ? site?.features?.[group]?.models?.[model.name]?.display_name?.trim() : '') ||
    model.getDisplayName?.() ||
    model.name
  );
}

export function resolveModelIcon(site: ISite | null | undefined, model: IChatModel): string {
  const group = model.modelGroup;
  return (group ? site?.features?.[group]?.models?.[model.name]?.icon_url?.trim() : '') || model.icon;
}

export function selectableChatModels(site: ISite | null | undefined, group: IChatModelGroup): IChatModel[] {
  const enabled = group.models.filter((model) => model.enabled !== false);
  const visible = enabled.filter((model) => site?.features?.[group.name]?.models?.[model.name]?.visible !== false);
  // A stale or externally written all-hidden configuration must still leave a usable model.
  if (visible.length) return visible;
  const fallback = enabled.find((model) => model.name === group.defaultModel?.name) ?? enabled[0];
  return fallback ? [fallback] : [];
}

export function resolveAssistantAvatar(
  site: ISite | null | undefined,
  group: IChatModelGroup | undefined,
  modelName?: string
): string {
  if (!group) return '';
  return (
    (modelName ? site?.features?.[group.name]?.models?.[modelName]?.icon_url?.trim() : '') ||
    site?.capability_overrides?.[group.name as CapabilityKey]?.icon_url?.trim() ||
    group.icon
  );
}
