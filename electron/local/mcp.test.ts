import { describe, it, expect } from 'vitest';
import { windowsNodeDirs } from './mcp';

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
