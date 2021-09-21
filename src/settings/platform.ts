export const PLATFORM_ALIAS_JUEJIN = 'juejin';
export const PLATFORM_ALIAS_CSDN = 'csdn';
export const PLATFORM_ALIAS_ZHIHU = 'zhihu';
export const PLATFORM_ALIAS_SIFOU = 'sifou';
export const PLATFORM_DOMAIN_JUEJIN = '.juejin.cn';
export const PLATFORM_DOMAIN_CSDN = '.csdn.net';
export const PLATFORM_DOMAIN_ZHIHU = '.zhihu.com';
export const PLATFORM_DOMAIN_SIFOU = '.segmentfault.com';

export const PLATFORM_ALIAS_DOMAIN_MAP = {
  [PLATFORM_ALIAS_JUEJIN]: PLATFORM_DOMAIN_JUEJIN,
  [PLATFORM_ALIAS_CSDN]: PLATFORM_DOMAIN_CSDN,
  [PLATFORM_ALIAS_ZHIHU]: PLATFORM_DOMAIN_ZHIHU,
  [PLATFORM_ALIAS_SIFOU]: PLATFORM_DOMAIN_SIFOU
};

export type IAlias = typeof PLATFORM_ALIAS_JUEJIN | typeof PLATFORM_ALIAS_CSDN | typeof PLATFORM_ALIAS_ZHIHU;

export const getDomainByAlias = (alias: IAlias) => {
  return PLATFORM_ALIAS_DOMAIN_MAP[alias];
};
