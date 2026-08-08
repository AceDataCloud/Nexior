export type BrandAssetKind = 'logo' | 'favicon';
export type BrandAssetAppearance = 'brand' | 'balanced' | 'mono';

export interface BrandAssetUrls {
  color: string;
  light: string;
  dark: string;
  adaptiveDark?: string;
}

export const defaultBrandAssetAppearance = (kind: BrandAssetKind): BrandAssetAppearance =>
  kind === 'favicon' ? 'brand' : 'balanced';

export const selectBrandAssetUrls = (
  kind: BrandAssetKind,
  appearance: BrandAssetAppearance,
  assets: BrandAssetUrls
): { light: string; dark: string } => {
  if (kind === 'favicon') return { light: assets.color, dark: assets.color };
  if (appearance === 'mono') return { light: assets.light, dark: assets.dark };
  if (appearance === 'brand') return { light: assets.color, dark: assets.color };
  return { light: assets.color, dark: assets.adaptiveDark || assets.dark };
};
