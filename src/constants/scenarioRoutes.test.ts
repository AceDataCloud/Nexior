import { describe, expect, it } from 'vitest';
import { SCENARIO_ROUTES, SCENARIO_VIEWPORTS } from './scenarioRoutes';

describe('scenario route manifest', () => {
  it('tracks the audited generation routes without duplicate names or paths', () => {
    // Keep this explicit: adding or removing an audited product surface must
    // update the review manifest, not silently change screenshot coverage.
    expect(SCENARIO_ROUTES).toHaveLength(22);
    expect(new Set(SCENARIO_ROUTES.map(({ name }) => name))).toHaveLength(22);
    expect(new Set(SCENARIO_ROUTES.map(({ path }) => path))).toHaveLength(22);
    expect(SCENARIO_ROUTES.every(({ path }) => path.startsWith('/'))).toBe(true);
  });

  it('covers each output family', () => {
    expect(new Set(SCENARIO_ROUTES.map(({ output }) => output))).toEqual(
      new Set(['audio', 'image', 'video', 'workflow'])
    );
  });

  it('uses unique, non-empty names for audited UI variants', () => {
    for (const route of SCENARIO_ROUTES) {
      if (!('auditVariants' in route)) continue;
      expect(route.auditVariants.every((variant) => variant.length > 0)).toBe(true);
      expect(new Set(route.auditVariants)).toHaveLength(route.auditVariants.length);
    }
  });

  it('defines the desktop, compact and mobile visual baselines', () => {
    expect(SCENARIO_VIEWPORTS).toEqual([
      { name: 'desktop', width: 1440, height: 900 },
      { name: 'compact', width: 1024, height: 768 },
      { name: 'mobile', width: 390, height: 844 }
    ]);
  });
});
