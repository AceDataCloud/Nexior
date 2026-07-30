import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, realpathSync, symlinkSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { setRoots, _resetRootsForTesting } from './fs';
import { glob, grep } from './search';

function tree() {
  const base = realpathSync(mkdtempSync(path.join(os.tmpdir(), 'nx-search-')));
  mkdirSync(path.join(base, 'src'));
  mkdirSync(path.join(base, 'src', 'nested'));
  mkdirSync(path.join(base, 'node_modules'));
  writeFileSync(path.join(base, 'src', 'a.ts'), 'export const alpha = 1;\nconst other = 2;\n');
  writeFileSync(path.join(base, 'src', 'nested', 'b.ts'), 'export const beta = 2;\n');
  writeFileSync(path.join(base, 'src', 'c.js'), 'const alpha = 3;\n');
  writeFileSync(path.join(base, 'readme.md'), 'alpha docs\n');
  writeFileSync(path.join(base, 'node_modules', 'junk.ts'), 'export const alpha = 999;\n');
  setRoots([base]);
  return base;
}

describe('fs.glob', () => {
  afterEach(() => _resetRootsForTesting());

  it('matches by extension at any depth', async () => {
    tree();
    const res = await glob({ pattern: '**/*.ts' });
    expect(res.output).toContain('a.ts');
    expect(res.output).toContain('b.ts');
    expect(res.output).not.toContain('c.js');
  });

  it('matches a bare filename pattern at any depth', async () => {
    tree();
    const res = await glob({ pattern: '*.ts' });
    expect(res.output).toContain('a.ts');
    expect(res.output).toContain('b.ts');
  });

  it('skips node_modules', async () => {
    tree();
    const res = await glob({ pattern: '**/*.ts' });
    expect(res.output).not.toContain('junk.ts');
  });

  it('skips hidden files unless asked', async () => {
    const base = tree();
    writeFileSync(path.join(base, '.secret.ts'), 'x');
    expect((await glob({ pattern: '**/*.ts' })).output).not.toContain('.secret.ts');
    expect((await glob({ pattern: '**/*.ts', hidden: true })).output).toContain('.secret.ts');
  });

  it('a single * does not cross a directory boundary', async () => {
    tree();
    const res = await glob({ pattern: 'src/*.ts' });
    expect(res.output).toContain('a.ts');
    expect(res.output).not.toContain('b.ts'); // in src/nested/
  });

  it('rejects a path outside the authorized roots', async () => {
    tree();
    const outside = realpathSync(mkdtempSync(path.join(os.tmpdir(), 'nx-out-')));
    await expect(glob({ pattern: '*', path: outside })).rejects.toThrow('path outside allowed roots');
  });

  it('does not follow a symlink out of the root', async () => {
    const base = tree();
    const outside = realpathSync(mkdtempSync(path.join(os.tmpdir(), 'nx-out-')));
    writeFileSync(path.join(outside, 'leaked.ts'), 'secret');
    symlinkSync(outside, path.join(base, 'escape'));
    const res = await glob({ pattern: '**/*.ts' });
    expect(res.output).not.toContain('leaked.ts');
  });

  it('reports no matches rather than erroring', async () => {
    tree();
    const res = await glob({ pattern: '**/*.rs' });
    expect(res.output).toContain('no files match');
  });
});

describe('fs.grep', () => {
  afterEach(() => _resetRootsForTesting());

  it('returns path:line: text for content matches', async () => {
    tree();
    const res = await grep({ pattern: 'alpha' });
    expect(res.output).toMatch(/a\.ts:1: export const alpha = 1;/);
  });

  it('restricts to files matching a glob', async () => {
    tree();
    const res = await grep({ pattern: 'alpha', glob: '*.md' });
    expect(res.output).toContain('readme.md');
    expect(res.output).not.toContain('a.ts');
  });

  it('honors case sensitivity by default and case_insensitive on request', async () => {
    tree();
    expect((await grep({ pattern: 'ALPHA' })).output).toContain('no matches');
    expect((await grep({ pattern: 'ALPHA', case_insensitive: true })).output).toContain('a.ts');
  });

  it('skips node_modules', async () => {
    tree();
    expect((await grep({ pattern: 'alpha' })).output).not.toContain('junk.ts');
  });

  it('skips binary files', async () => {
    const base = tree();
    writeFileSync(path.join(base, 'blob.bin'), Buffer.from([0x00, 0x61, 0x6c, 0x70, 0x68, 0x61]));
    expect((await grep({ pattern: 'alpha' })).output).not.toContain('blob.bin');
  });

  it('rejects an invalid regex with a clear message', async () => {
    tree();
    await expect(grep({ pattern: '([' })).rejects.toThrow('invalid regex');
  });

  it('finds every match on consecutive lines even with a /g-style pattern', async () => {
    const base = tree();
    writeFileSync(path.join(base, 'src', 'many.ts'), 'hit\nhit\nhit\n');
    const res = await grep({ pattern: 'hit', glob: 'many.ts' });
    expect(res.output.split('\n').filter((l) => l.includes('many.ts'))).toHaveLength(3);
  });

  it('caps results at max_results', async () => {
    const base = tree();
    writeFileSync(path.join(base, 'src', 'many.ts'), Array.from({ length: 50 }, () => 'hit').join('\n'));
    const res = await grep({ pattern: 'hit', glob: 'many.ts', max_results: 5 });
    expect(res.output.split('\n').filter((l) => l.includes('many.ts'))).toHaveLength(5);
    expect(res.output).toContain('[truncated');
  });

  it('rejects a path outside the authorized roots', async () => {
    tree();
    const outside = realpathSync(mkdtempSync(path.join(os.tmpdir(), 'nx-out-')));
    await expect(grep({ pattern: 'x', path: outside })).rejects.toThrow('path outside allowed roots');
  });

  it('errors clearly when no roots are authorized at all', async () => {
    _resetRootsForTesting();
    await expect(grep({ pattern: 'x' })).rejects.toThrow('no authorized roots');
  });
});
