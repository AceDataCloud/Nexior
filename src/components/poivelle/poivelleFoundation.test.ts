import { describe, expect, it } from 'vitest';
import poivelleRoute from '@/router/poivelle';
import { ROUTE_POIVELLE_INDEX } from '@/router/constants';
import { POIVELLE_LOGO } from '@/constants';
import { CAPABILITY_ICONS, CAPABILITY_KEYS } from '@/constants/capabilities';
import { loadLocaleResource } from '@/i18n';
import stateFactory from '@/store/poivelle/state';

const keys = (messages: Record<string, unknown>) => Object.keys(messages).sort();

describe('Poivelle application foundation', () => {
  it('owns an authenticated independent route and capability', () => {
    expect(poivelleRoute.path).toBe('/poivelle');
    expect(poivelleRoute.meta).toEqual({ auth: true, appName: 'poivelle' });
    expect(poivelleRoute.children[0].name).toBe(ROUTE_POIVELLE_INDEX);
    expect(CAPABILITY_KEYS).toContain('poivelle');
    expect(CAPABILITY_ICONS.poivelle).toBe(POIVELLE_LOGO);
    expect(stateFactory().projection).toBe('overview');
  });

  it('keeps English and simplified Chinese message keys aligned', async () => {
    const english = (await loadLocaleResource('poivelle', 'en')) as Record<string, unknown>;
    const chinese = (await loadLocaleResource('poivelle', 'zh-CN')) as Record<string, unknown>;
    expect(keys(chinese)).toEqual(keys(english));
  });

  it('backfills the Poivelle scope for other locales', async () => {
    const english = await loadLocaleResource('poivelle', 'en');
    const german = await loadLocaleResource('poivelle', 'de');
    expect(german).toEqual(english);
  });
});
