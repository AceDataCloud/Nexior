import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, realpathSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { setRoots, authorizeConsentedPath, list_dir, read_file, _resetRootsForTesting } from './fs';

// A consented path must become readable/listable even when it was never added
// as a root in Settings — otherwise the consent popup grants nothing usable
// and the call fails with "path outside allowed roots".
describe('fs consent-authorized roots', () => {
  afterEach(() => _resetRootsForTesting());

  function tmpTree() {
    const base = realpathSync(mkdtempSync(path.join(os.tmpdir(), 'nx-fs-')));
    const docs = path.join(base, 'Documents');
    mkdirSync(docs);
    writeFileSync(path.join(docs, 'a.txt'), 'hello');
    return { base, docs };
  }

  it('rejects a path that is neither a root nor consent-authorized', async () => {
    const { docs } = tmpTree();
    await expect(list_dir({ path: docs })).rejects.toThrow('path outside allowed roots');
  });

  it('authorizes a directory after consent so list_dir succeeds', async () => {
    const { docs } = tmpTree();
    const granted = authorizeConsentedPath('fs.list_dir', docs);
    expect(granted).toBe(docs);
    const res = await list_dir({ path: docs });
    expect(res.output).toContain('a.txt');
  });

  it('authorizes a file after consent so read_file succeeds (and only that file)', async () => {
    const { docs } = tmpTree();
    const file = path.join(docs, 'a.txt');
    authorizeConsentedPath('fs.read_file', file);
    const res = await read_file({ path: file });
    expect(res.output).toBe('hello');
    // The sibling directory listing is still blocked (only the file was granted).
    await expect(list_dir({ path: docs })).rejects.toThrow('path outside allowed roots');
  });

  it('still honors roots added via setRoots', async () => {
    const { docs } = tmpTree();
    setRoots([docs]);
    const res = await list_dir({ path: docs });
    expect(res.output).toContain('a.txt');
  });

  it('expands ~ when authorizing (matches how models pass paths)', async () => {
    // The home dir itself; authorizing "~" must add the real home as a root.
    const granted = authorizeConsentedPath('fs.list_dir', '~');
    expect(granted).toBe(realpathSync(os.homedir()));
  });
});
