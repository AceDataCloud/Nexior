import { describe, expect, it } from 'vitest';
import { previewOptions, svgPreview } from './catalog';

describe('loading review overrides', () => {
  it('does not alter the default application or accept unknown tools', () => {
    expect(previewOptions('')).toBeUndefined();
    expect(previewOptions('?loading_tool=unknown')).toBeUndefined();
    expect(previewOptions('?loading_tool=ldrs')?.tool).toBe('ldrs');
  });
  it('scales CSS timings without corrupting SVG identifiers or leading decimals', () => {
    const source = '<svg id="test17s"><style>.l{animation:k .25s;animation-delay:500ms}</style></svg>';
    const result = decodeURIComponent(svgPreview(source, { tool: 'svgator', speed: 2 }).split(',')[1]);
    expect(result).toContain('id="test17s"');
    expect(result).toContain('animation:k 0.125s');
    expect(result).toContain('animation-delay:250ms');
  });
  it('produces a static SVG for pause and preserves reduced-motion handling', () => {
    const result = decodeURIComponent(
      svgPreview('<svg><style>.l{opacity:0}</style></svg>', { tool: 'dot-matrix', paused: true }).split(',')[1]
    );
    expect(result).toContain('prefers-reduced-motion:reduce');
    expect(result).toContain('animation:none!important');
    expect(result).toContain('opacity:.55!important');
  });
});
