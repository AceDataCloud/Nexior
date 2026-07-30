import { describe, it, expect } from 'vitest';
import { windowsNodeDirs, mapCallResult } from './mcp';

// A GUI-launched Windows app can inherit a stale PATH without the Node dir;
// resolveEnhancedPath() appends these standard install dirs so a bare `node` /
// `npx` MCP command still resolves. Keep the derivation pure + covered.
describe('windowsNodeDirs', () => {
  it('derives the standard Node + global-npm dirs from env vars', () => {
    const dirs = windowsNodeDirs({
      ProgramFiles: 'C:\\Program Files',
      'ProgramFiles(x86)': 'C:\\Program Files (x86)',
      APPDATA: 'C:\\Users\\x\\AppData\\Roaming',
      LOCALAPPDATA: 'C:\\Users\\x\\AppData\\Local'
    } as NodeJS.ProcessEnv);
    expect(dirs).toEqual([
      'C:\\Program Files\\nodejs',
      'C:\\Program Files (x86)\\nodejs',
      'C:\\Users\\x\\AppData\\Roaming\\npm',
      'C:\\Users\\x\\AppData\\Local\\Programs\\nodejs'
    ]);
  });

  it('skips any env var that is unset', () => {
    expect(windowsNodeDirs({ ProgramFiles: 'C:\\Program Files' } as NodeJS.ProcessEnv)).toEqual(['C:\\Program Files\\nodejs']);
    expect(windowsNodeDirs({} as NodeJS.ProcessEnv)).toEqual([]);
  });
});

// An MCP tool can return an image block (xiaohongshu-mcp's login QR code, a
// browser screenshot). It has to reach the model through `image` — the same
// channel computer.screenshot uses. Serialized into `output` it is just a
// base64 blob inside a JSON string: nothing renders it, the model never sees
// it, and it then claims to have shown a picture that was never displayed.
describe('mapCallResult', () => {
  const img = (over: Record<string, unknown> = {}) => ({ type: 'image', data: 'AAAA', mimeType: 'image/png', ...over });
  const texts = (r: { output: string }) => (JSON.parse(r.output) as { text?: string }[]).map((b) => b.text);

  it('lifts an image block into `image` as a data URL', () => {
    expect(mapCallResult({ content: [{ type: 'text', text: 'scan me' }, img()] }).image).toBe('data:image/png;base64,AAAA');
  });

  it('keeps other blocks and replaces the lifted image with a short note', () => {
    const r = mapCallResult({ content: [{ type: 'text', text: 'scan me' }, img()] });
    expect(texts(r)).toEqual(['scan me', '[image returned separately and shown to you]']);
    expect(r.output).not.toContain('AAAA'); // base64 not duplicated into the text channel
  });

  it('defaults a missing mimeType to image/png', () => {
    expect(mapCallResult({ content: [img({ mimeType: undefined })] }).image).toBe('data:image/png;base64,AAAA');
  });

  it.each(['image/jpeg', 'image/jpg', 'image/webp'])('lifts %s (accepted by the worker)', (mime) => {
    expect(mapCallResult({ content: [img({ mimeType: mime })] }).image).toBe(`data:${mime};base64,AAAA`);
  });

  // REGRESSION GUARD: the worker's isValidResultImage only accepts
  // png/jpeg/webp. Lifting anything else means the worker silently drops it
  // while we have already removed it from `output` — the image vanishes
  // entirely, which is worse than not lifting at all.
  it.each(['image/gif', 'image/svg+xml', 'image/bmp'])('does NOT lift %s the worker would reject', (mime) => {
    const r = mapCallResult({ content: [img({ mimeType: mime })] });
    expect(r.image).toBeUndefined();
    expect(texts(r)).toEqual([`[image not shown: unsupported type ${mime} (expected png/jpeg/webp)]`]);
  });

  it('falls through to a later liftable image when the first is unsupported', () => {
    const r = mapCallResult({ content: [img({ mimeType: 'image/gif' }), img({ data: 'BBBB' })] });
    expect(r.image).toBe('data:image/png;base64,BBBB');
    expect(texts(r)).toEqual([
      '[image not shown: unsupported type image/gif (expected png/jpeg/webp)]',
      '[image returned separately and shown to you]'
    ]);
  });

  it('leaves text-only results untouched', () => {
    const r = mapCallResult({ content: [{ type: 'text', text: 'hi' }] });
    expect(r.image).toBeUndefined();
    expect(JSON.parse(r.output)).toEqual([{ type: 'text', text: 'hi' }]);
  });

  it('reports an over-budget image instead of silently dropping it', () => {
    const r = mapCallResult({ content: [img({ data: 'x'.repeat(5_400_001) })] });
    expect(r.image).toBeUndefined();
    expect(texts(r)).toEqual(['[image not shown: too large to send]']);
    expect(r.output.length).toBeLessThan(200); // the blob is gone, not inlined
  });

  it('ignores an image block with no data', () => {
    expect(mapCallResult({ content: [{ type: 'image', mimeType: 'image/png' }] }).image).toBeUndefined();
  });

  // audio / resource / resource_link have no channel to the model today, so
  // they must pass through untouched rather than be mangled.
  it('passes non-image block types through unchanged', () => {
    const blocks = [
      { type: 'audio', data: 'ZZZZ', mimeType: 'audio/wav' },
      { type: 'resource_link', uri: 'https://example.com/a.pdf' }
    ];
    const r = mapCallResult({ content: blocks });
    expect(JSON.parse(r.output)).toEqual(blocks);
  });

  it('propagates isError and tolerates a non-array content', () => {
    expect(mapCallResult({ content: [img()], isError: true }).is_error).toBe(true);
    expect(mapCallResult({}).output).toBe('""');
    expect(mapCallResult({ content: 'plain' }).output).toBe('"plain"');
  });
});
