import { describe, expect, it } from 'vitest';
import { projectSphere } from './particleSphereRenderer';

describe('particle sphere projection', () => {
  it('keeps all particles inside the small canvas throughout rotation', () => {
    for (const seconds of [0, 0.5, 1, 2, 5]) {
      for (const point of projectSphere(seconds)) {
        expect(Number.isFinite(point.x + point.y + point.radius + point.opacity)).toBe(true);
        expect(point.x - point.radius).toBeGreaterThanOrEqual(0);
        expect(point.x + point.radius).toBeLessThanOrEqual(40);
        expect(point.y - point.radius).toBeGreaterThanOrEqual(0);
        expect(point.y + point.radius).toBeLessThanOrEqual(40);
      }
    }
  });
});
