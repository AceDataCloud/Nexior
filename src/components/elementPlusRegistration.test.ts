import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative, resolve } from 'path';

/**
 * `main.ts` installs no global Element Plus plugin, so every `<el-*>` tag must
 * be imported and registered by its own SFC. Vue renders an unregistered
 * component as bare slot text and warns only at runtime — lint and vue-tsc are
 * both blind to it, which is how a whole form shipped with no inputs.
 */

const SRC = resolve(__dirname, '..');

function vueFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return vueFiles(full);
    return full.endsWith('.vue') ? [full] : [];
  });
}

function toPascal(tag: string): string {
  return (
    'El' +
    tag
      .slice(3)
      .split('-')
      .map((w) => w[0].toUpperCase() + w.slice(1))
      .join('')
  );
}

function usedTags(source: string): Set<string> {
  const template = source.split('<script')[0].replace(/<!--[\s\S]*?-->/g, '');
  return new Set(Array.from(template.matchAll(/<(el-[a-z0-9-]+)/g), (m) => m[1]));
}

function importedNames(source: string): Set<string> {
  const script = source.slice(source.indexOf('<script')).replace(/\/\*[\s\S]*?\*\//g, '');
  const names = new Set<string>();
  for (const match of script.matchAll(/import\s*\{([^}]*)\}\s*from\s*['"]element-plus['"]/g)) {
    for (const raw of match[1].split(',')) {
      const name = raw
        .trim()
        .split(/\s+as\s+/)
        .pop()
        ?.trim();
      if (name?.startsWith('El')) names.add(name);
    }
  }
  return names;
}

describe('Element Plus component registration', () => {
  it('every <el-*> tag is imported from element-plus in the same SFC', () => {
    const offenders: string[] = [];
    for (const file of vueFiles(SRC)) {
      const source = readFileSync(file, 'utf-8');
      const imported = importedNames(source);
      const missing = Array.from(usedTags(source))
        .map(toPascal)
        .filter((name) => !imported.has(name));
      if (missing.length > 0) {
        offenders.push(`${relative(SRC, file)}: ${missing.join(', ')}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
