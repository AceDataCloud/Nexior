// @vitest-environment node
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(__dirname, '../..');
const source = (relativePath: string) => readFileSync(resolve(ROOT, relativePath), 'utf8');

/**
 * Element Plus declares these on its own component rules (e.g. `.el-card { … }`),
 * not on `:root`. Referencing one from an element that is not inside that
 * component silently resolves to nothing: `border-radius` falls back to 0 (square
 * corners) and `border-color` to `currentColor`. Both failures render as
 * "looks almost right", so they survived two review rounds — hence this guard.
 */
const COMPONENT_SCOPED_EL_VARS = ['--el-card-border-radius', '--el-card-border-color', '--el-card-padding'];

const walk = (dir: string, acc: string[] = []): string[] => {
  for (const entry of readdirSync(dir)) {
    const full = resolve(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full, acc);
    } else if (entry.endsWith('.vue')) {
      acc.push(full);
    }
  }
  return acc;
};

describe('css variable scope guard', () => {
  it('never reads component-scoped Element Plus vars outside an .el-* rule', () => {
    const offenders: string[] = [];

    for (const file of walk(resolve(ROOT, 'src'))) {
      const text = readFileSync(file, 'utf8');
      for (const variable of COMPONENT_SCOPED_EL_VARS) {
        if (!text.includes(`var(${variable}`)) continue;
        // A reference is legitimate only when the rule itself targets the
        // owning component (`.el-card { … }` / `:deep(.el-card)`), because
        // then the variable is in scope through the cascade.
        const owner = variable.split('-').slice(0, 3).join('-').replace('--', '');
        if (text.includes(`.${owner}`)) continue;
        offenders.push(`${file.replace(`${ROOT}/`, '')} → var(${variable})`);
      }
    }

    expect(offenders).toEqual([]);
  });

  it('detects the failure it is meant to catch', () => {
    // Sanity check on the matcher itself: a synthetic offender must trip it,
    // otherwise a passing suite would prove nothing.
    const synthetic = '.some-panel { border-radius: var(--el-card-border-radius); }';
    const owner = '--el-card-border-radius'.split('-').slice(0, 3).join('-').replace('--', '');
    expect(synthetic.includes('var(--el-card-border-radius')).toBe(true);
    expect(synthetic.includes(`.${owner}`)).toBe(false);
  });
});

describe('console layout contract', () => {
  const layout = source('src/layouts/Console.vue');
  const sidePanel = source('src/components/console/SidePanel.vue');

  it('keeps the sidebar width in exactly one place', () => {
    // The layout owns the value; SidePanel consumes it. Two hardcoded widths
    // is what made the nav list overflow its container by 8px.
    expect(layout).toMatch(/--console-side-width:\s*220px/);
    expect(sidePanel).toMatch(/width:\s*var\(--console-side-width/);
    expect(sidePanel).not.toMatch(/\$width:\s*\d+px/);
    // A layout-side `.side { width }` would out-specify the component again.
    expect(layout).not.toMatch(/\.side\s*{[^}]*width:\s*\d+px/);
  });

  it('contains nav rows structurally instead of relying on ancestor clipping', () => {
    // Grid with a compressible text column cannot overflow; the old markup
    // used a block row plus an indicator at `right: -5px`, i.e. 5px outside
    // the sidebar, which only looked fine where an ancestor clipped it.
    expect(sidePanel).toMatch(/grid-template-columns:\s*16px minmax\(0, 1fr\) auto/);
    // Strip comments first — the rule below is about declarations, and the
    // code comments legitimately quote the old `right: -5px` value.
    const declarations = sidePanel.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
    expect(declarations).not.toMatch(/right:\s*-\d+px/);
    expect(sidePanel).toMatch(/&::after\s*{[\s\S]*?right:\s*0;/);
  });

  it('provides both page shapes from the layout', () => {
    expect(layout).toMatch(/\.panel--document/);
    expect(layout).toMatch(/\.panel--workspace/);
    expect(layout).toMatch(/panelVariant/);
  });

  it('makes every console route declare its panel shape', () => {
    const routes = source('src/router/console.ts');
    // Every child page must pick a shape. Leaving it implicit is how the two
    // page types drifted apart in the first place: a new page inherits
    // whatever the default happens to be and nobody sees the choice. The
    // parent `/console` record is excluded — it mounts the layout itself and
    // renders no panel.
    const children = routes.slice(routes.indexOf('children:'));
    const entries = children.match(/{\s*path: '[^']*',[\s\S]*?component:/g) || [];
    expect(entries.length).toBe(9);
    const undeclared = entries.filter((entry) => !/meta:\s*(DOCUMENT|WORKSPACE)/.test(entry));
    expect(undeclared).toEqual([]);
  });

  it('keeps workspace pages free of their own full-height wrapper', () => {
    // These two pages used to inline an identical 40-line `.page-shell` block
    // to fight `.panel`; the layout now supplies it via `meta.layout`.
    for (const page of ['src/pages/console/connectors/Index.vue', 'src/pages/console/skills/Index.vue']) {
      expect(source(page)).not.toContain('page-shell');
    }
    const routes = source('src/router/console.ts');
    expect(routes).toMatch(/connectors[\s\S]*?meta:\s*WORKSPACE/);
    expect(routes).toMatch(/skills[\s\S]*?meta:\s*WORKSPACE/);
  });

  it('shares one page header component across console pages', () => {
    expect(source('src/pages/console/connectors/Index.vue')).toContain('console-page-header');
    expect(source('src/pages/console/skills/Index.vue')).toContain('console-page-header');
  });
});
