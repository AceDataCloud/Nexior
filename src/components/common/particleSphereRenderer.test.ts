import { describe, expect, it } from 'vitest';
import { projectSphere, type ParticleVariant } from './particleSphereRenderer';

describe('particle projections', () => {
  it.each(['sphere', 'orbit', 'helix'] as ParticleVariant[])(
    'keeps the %s particles inside the small canvas at all supported speeds',
    (variant) => {
      for (const speed of [1, 2, 4]) {
        for (const seconds of [0, 0.5, 1, 2, 5]) {
          for (const point of projectSphere(seconds, variant, speed)) {
            expect(Number.isFinite(point.x + point.y + point.radius + point.opacity)).toBe(true);
            expect(point.x - point.radius).toBeGreaterThanOrEqual(0);
            expect(point.x + point.radius).toBeLessThanOrEqual(40);
            expect(point.y - point.radius).toBeGreaterThanOrEqual(0);
            expect(point.y + point.radius).toBeLessThanOrEqual(40);
          }
        }
      }
    }
  );
  it('produces visually distinct variants and advances further with higher speed', () => {
    expect(projectSphere(1, 'sphere')).not.toEqual(projectSphere(1, 'orbit'));
    expect(projectSphere(1, 'orbit')).not.toEqual(projectSphere(1, 'helix'));
    expect(projectSphere(1, 'sphere', 1)).not.toEqual(projectSphere(1, 'sphere', 2));
  });
});
