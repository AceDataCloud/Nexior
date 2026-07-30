import { afterEach, describe, expect, it } from 'vitest';
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  readdirSync,
  realpathSync,
  chmodSync,
  statSync
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  setRoots,
  authorizeConsentedPath,
  revokeOnceRoot,
  list_dir,
  read_file,
  write_file,
  edit_file,
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

describe('fs.edit_file', () => {
  afterEach(() => _resetRootsForTesting());

  function rooted(content: string, name = 'a.ts') {
    const base = realpathSync(mkdtempSync(path.join(os.tmpdir(), 'nx-edit-')));
    const file = path.join(base, name);
    writeFileSync(file, content);
    setRoots([base]);
    return { base, file };
  }

  it('replaces a unique occurrence and leaves the rest intact', async () => {
    const { file } = rooted('const a = 1;\nconst b = 2;\n');
    const res = await edit_file({ path: file, old_string: 'const b = 2;', new_string: 'const b = 3;' });
    expect(res.is_error).toBeFalsy();
    expect(readFileSync(file, 'utf8')).toBe('const a = 1;\nconst b = 3;\n');
  });

  it('refuses an ambiguous match instead of editing the wrong one', async () => {
    const { file } = rooted('x();\nx();\n');
    await expect(edit_file({ path: file, old_string: 'x();', new_string: 'y();' })).rejects.toThrow('not unique');
    expect(readFileSync(file, 'utf8')).toBe('x();\nx();\n'); // unchanged
  });

  it('replaces every occurrence with replace_all', async () => {
    const { file } = rooted('x();\nx();\n');
    await edit_file({ path: file, old_string: 'x();', new_string: 'y();', replace_all: true });
    expect(readFileSync(file, 'utf8')).toBe('y();\ny();\n');
  });

  it('rejects a missing old_string', async () => {
    const { file } = rooted('hello\n');
    await expect(edit_file({ path: file, old_string: 'nope', new_string: 'x' })).rejects.toThrow('not found');
  });

  it('enforces the roots boundary', async () => {
    const outside = realpathSync(mkdtempSync(path.join(os.tmpdir(), 'nx-out-')));
    const file = path.join(outside, 'a.txt');
    writeFileSync(file, 'hello');
    setRoots([realpathSync(mkdtempSync(path.join(os.tmpdir(), 'nx-in-')))]);
    await expect(edit_file({ path: file, old_string: 'hello', new_string: 'bye' })).rejects.toThrow(
      'path outside allowed roots'
    );
  });

  it('preserves the original file mode (does not strip the exec bit)', async () => {
    const { file } = rooted('#!/bin/sh\necho hi\n', 'run.sh');
    chmodSync(file, 0o755);
    await edit_file({ path: file, old_string: 'echo hi', new_string: 'echo bye' });
    expect(statSync(file).mode & 0o777).toBe(0o755);
  });
});

describe('fs.read_file pagination', () => {
  afterEach(() => _resetRootsForTesting());

  function rootedLines(n: number) {
    const base = realpathSync(mkdtempSync(path.join(os.tmpdir(), 'nx-read-')));
    const file = path.join(base, 'big.txt');
    writeFileSync(file, Array.from({ length: n }, (_, i) => `line ${i + 1}`).join('\n'));
    setRoots([base]);
    return file;
  }

  it('returns a small file whole, with no pagination footer', async () => {
    const file = rootedLines(3);
    const res = await read_file({ path: file });
    expect(res.output).toBe('line 1\nline 2\nline 3');
  });

  it('returns the requested line window', async () => {
    const file = rootedLines(100);
    const res = await read_file({ path: file, offset: 10, limit: 3 });
    expect(res.output).toContain('line 10\nline 11\nline 12');
    expect(res.output).toContain('[lines 10-12 of 100]');
  });

  it('flags truncation so the model never thinks it saw the whole file', async () => {
    const file = rootedLines(2500);
    const res = await read_file({ path: file });
    expect(res.output).toContain('[truncated: showing lines 1-2000 of 2500');
    expect(res.output).not.toContain('line 2001');
  });

  it('reports an offset past the end rather than returning empty output', async () => {
    const file = rootedLines(5);
    const res = await read_file({ path: file, offset: 99 });
    expect(res.output).toContain('offset 99 is past the end');
  });
});
