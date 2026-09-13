import type { ISite, ISiteHome } from '@/models';

export const HOME_CATEGORY_IDS = ['chat', 'image', 'video', 'music'] as const;
export type HomeCategoryId = (typeof HOME_CATEGORY_IDS)[number];
export type HomeSectionKey = 'banner' | 'categories' | 'showcase';

const sections = (site?: ISite | null) => site?.home?.sections;

export const isHomeSectionEnabled = (site: ISite | null | undefined, key: HomeSectionKey): boolean =>
  sections(site)?.[key]?.enabled !== false;

export const getHiddenDefaultBannerIds = (site?: ISite | null): Set<string> => {
  const values = sections(site)?.banner?.disabled_item_ids;
  return new Set(Array.isArray(values) ? values.filter((value): value is string => typeof value === 'string') : []);
};

export const getHiddenCategoryIds = (site?: ISite | null): Set<HomeCategoryId> => {
  const values = sections(site)?.categories?.disabled_item_ids;
  return new Set(
    Array.isArray(values)
      ? values.filter((value): value is HomeCategoryId => HOME_CATEGORY_IDS.includes(value as HomeCategoryId))
      : []
  );
};

const copyHome = (site?: ISite | null): ISiteHome => ({
  ...(site?.home || {}),
  sections: { ...(site?.home?.sections || {}) }
});

export const withHomeSectionEnabled = (
  site: ISite | null | undefined,
  key: HomeSectionKey,
  enabled: boolean
): ISiteHome => {
  const home = copyHome(site);
  home.sections![key] = { ...(home.sections![key] || {}), enabled };
  return home;
};

export const withHiddenDefaultBannerIds = (site: ISite | null | undefined, ids: Iterable<string>): ISiteHome => {
  const home = copyHome(site);
  home.sections!.banner = { ...(home.sections!.banner || {}), disabled_item_ids: [...new Set(ids)] };
  return home;
};

export const withHiddenCategoryIds = (site: ISite | null | undefined, ids: Iterable<HomeCategoryId>): ISiteHome => {
  const home = copyHome(site);
  home.sections!.categories = {
    ...(home.sections!.categories || {}),
    disabled_item_ids: [...new Set(ids)].filter((id) => HOME_CATEGORY_IDS.includes(id))
  };
  return home;
};
