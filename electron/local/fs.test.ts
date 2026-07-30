import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readdirSync, realpathSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  setRoots,
  authorizeConsentedPath,
  revokeOnceRoot,
  list_dir,
  read_file,
  write_file,
  _resetRootsForTesting
} from './fs';

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

  it('authorizes the containing folder after consent on a file', async () => {
    const { docs } = tmpTree();
    const file = path.join(docs, 'a.txt');
    // Consent is folder-scoped by design: reading one file implies its siblings
    // are in scope, and the dialog says so. See consent.ts's header.
    const granted = authorizeConsentedPath('fs.read_file', file);
    expect(granted).toBe(docs);
    expect((await read_file({ path: file })).output).toBe('hello');
    expect((await list_dir({ path: docs })).output).toContain('a.txt');
  });

  it('does not authorize the PARENT of the granted folder', async () => {
    const { base, docs } = tmpTree();
    authorizeConsentedPath('fs.read_file', path.join(docs, 'a.txt'));
    // Escaping upward stays blocked — the grant is one folder, not the tree.
    await expect(list_dir({ path: base })).rejects.toThrow('path outside allowed roots');
  });

  it('an Allow-once grant is released after the call', async () => {
    const { docs } = tmpTree();
    const granted = authorizeConsentedPath('fs.list_dir', docs, true);
    expect((await list_dir({ path: docs })).output).toContain('a.txt');
    revokeOnceRoot(granted);
    await expect(list_dir({ path: docs })).rejects.toThrow('path outside allowed roots');
  });

  it('releasing an Allow-once grant leaves a session grant on the SAME folder intact', async () => {
    const { docs } = tmpTree();
    // "Allow for session" on a.txt, then "Allow once" on a sibling in the same
    // folder. Releasing the once-grant must not revoke the session one.
    authorizeConsentedPath('fs.read_file', path.join(docs, 'a.txt'));
    const once = authorizeConsentedPath('fs.read_file', path.join(docs, 'a.txt'), true);
    revokeOnceRoot(once);
    expect((await read_file({ path: path.join(docs, 'a.txt') })).output).toBe('hello');
  });

  it('parallel Allow-once grants on one folder are reference-counted', async () => {
    const { docs } = tmpTree();
    // Two parallel client tools each approved "Allow once" for the same folder.
    const a = authorizeConsentedPath('fs.list_dir', docs, true);
    const b = authorizeConsentedPath('fs.list_dir', docs, true);
    // The first finishing must NOT strand the second.
    revokeOnceRoot(a);
    expect((await list_dir({ path: docs })).output).toContain('a.txt');
    revokeOnceRoot(b);
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

  it('write_file survives an orphaned temp file from an earlier crash', async () => {
    const { docs } = tmpTree();
    setRoots([docs]);
    const target = path.join(docs, 'out.txt');
    // A crash between writeFile(tmp) and rename() used to leave `<file>.tmp`,
    // which made every later write to that path fail EEXIST forever.
    writeFileSync(target + '.tmp', 'orphan from a previous run');
    const res = await write_file({ path: target, content: 'fresh' });
    expect(res.output).toBe('wrote 5 bytes');
    expect((await read_file({ path: target })).output).toBe('fresh');
  });

  it('write_file leaves no temp file behind when the write fails', async () => {
    const { docs } = tmpTree();
    setRoots([docs]);
    // A directory as the target makes rename() fail (EISDIR) after the temp
    // was written — the temp must still be cleaned up.
    mkdirSync(path.join(docs, 'adir'));
    await expect(write_file({ path: path.join(docs, 'adir'), content: 'x' })).rejects.toThrow();
    const leftovers = readdirSync(docs).filter((f) => f.includes('.tmp'));
    expect(leftovers).toEqual([]);
  });
});
