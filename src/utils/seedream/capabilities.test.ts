import { describe, expect, it } from 'vitest';
import { getSeedreamCapabilities } from './capabilities';

describe('Seedream official capability matrix', () => {
  it('models Pro-only production features', () => {
    const capabilities = getSeedreamCapabilities('doubao-seedream-5-0-pro-260628');
    expect(capabilities.sizeTiers).toEqual(['1K', '1.5K', '2K']);
    expect(capabilities.layerDecomposition).toBe(true);
    expect(capabilities.transparentBackground).toBe(true);
    expect(capabilities.promptOptimization).toEqual(['standard', 'fast']);
    expect(capabilities.groupGeneration).toBe(false);
    expect(capabilities.webSearch).toBe(false);
  });

  it('models Lite group and web capabilities', () => {
    const capabilities = getSeedreamCapabilities('doubao-seedream-5-0-260128');
    expect(capabilities.sizeTiers).toEqual(['2K', '3K', '4K']);
    expect(capabilities.groupGeneration).toBe(true);
    expect(capabilities.webSearch).toBe(true);
    expect(capabilities.layerDecomposition).toBe(false);
    expect(capabilities.promptOptimization).toEqual(['standard']);
  });
});
