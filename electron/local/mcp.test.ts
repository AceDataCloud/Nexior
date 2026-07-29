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

  it('lifts an image block into `image` as a data URL', () => {
    const r = mapCallResult({ content: [{ type: 'text', text: 'scan me' }, img()] });
    expect(r.image).toBe('data:image/png;base64,AAAA');
  });

  it('keeps the non-image blocks in output and drops the lifted image', () => {
    const r = mapCallResult({ content: [{ type: 'text', text: 'scan me' }, img()] });
    expect(JSON.parse(r.output)).toEqual([{ type: 'text', text: 'scan me' }]);
    expect(r.output).not.toContain('AAAA'); // no base64 blob left in the text channel
  });

  it('defaults a missing mimeType to image/png', () => {
    expect(mapCallResult({ content: [img({ mimeType: undefined })] }).image).toBe('data:image/png;base64,AAAA');
  });

  it('honours a non-png mimeType', () => {
    expect(mapCallResult({ content: [img({ mimeType: 'image/jpeg' })] }).image).toBe('data:image/jpeg;base64,AAAA');
  });

  it('leaves text-only results untouched', () => {
    const r = mapCallResult({ content: [{ type: 'text', text: 'hi' }] });
    expect(r.image).toBeUndefined();
    expect(JSON.parse(r.output)).toEqual([{ type: 'text', text: 'hi' }]);
  });

  it('drops an over-budget image rather than blowing the turn budget', () => {
    const r = mapCallResult({ content: [img({ data: 'x'.repeat(5_400_001) })] });
    expect(r.image).toBeUndefined();
    expect(JSON.parse(r.output)).toHaveLength(1); // still reported as text
  });

  it('ignores an image block with no data', () => {
    const r = mapCallResult({ content: [{ type: 'image', mimeType: 'image/png' }] });
    expect(r.image).toBeUndefined();
  });

  it('propagates isError and tolerates a non-array content', () => {
    expect(mapCallResult({ content: [img()], isError: true }).is_error).toBe(true);
    expect(mapCallResult({}).output).toBe('""');
    expect(mapCallResult({ content: 'plain' }).output).toBe('"plain"');
  });
});
