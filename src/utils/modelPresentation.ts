import type { IChatModel, ISite } from '@/models';

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
