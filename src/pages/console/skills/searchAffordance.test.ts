// @vitest-environment node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(__dirname, '../../../..');
const source = (relativePath: string) => readFileSync(resolve(ROOT, relativePath), 'utf8');

const SKILLS = 'src/pages/console/skills/Index.vue';
const CONNECTORS = 'src/pages/console/connectors/Index.vue';

/**
 * The two list pages sit one nav item apart, so any difference in how their
 * left pane is searched reads as two different products. Skills used to hide
 * its field behind a magnifier toggle while connectors showed a permanent
 * input — these lock the shared shape so they cannot drift apart again.
 */
describe('console list pages share one search affordance', () => {
  it('keeps the search field always visible on both pages', () => {
    for (const page of [SKILLS, CONNECTORS]) {
      const src = source(page);
      const field = src.match(/<el-input[\s\S]*?class="search-input"[\s\S]*?\/el-input>/);
      expect(field, `${page} has no .search-input`).not.toBeNull();
      // A `v-if`/`v-show` on the field (or a wrapper toggled by open-state)
      // is exactly the toggle behaviour this guard exists to prevent.
      expect(field![0]).not.toMatch(/v-(if|show)=/);
      expect(src).not.toMatch(/searchOpen/);
    }
  });

  it('gives both pages the same toolbar button', () => {
    for (const page of [SKILLS, CONNECTORS]) {
      const src = source(page);
      expect(src, `${page} should use .add-button`).toMatch(/class="add-button"/);
      expect(src).toMatch(/\.add-button\s*{[^}]*width:\s*34px/);
      expect(src).toMatch(/\.add-button\s*{[^}]*height:\s*34px/);
    }
  });

  it('uses identical toolbar metrics on both pages', () => {
    const metrics = [SKILLS, CONNECTORS].map((page) => {
      const src = source(page);
      const bar = src.match(/\.(?:left-header|list-toolbar)\s*{([^}]*)}/);
      expect(bar, `${page} has no toolbar rule`).not.toBeNull();
      const pick = (prop: string) => bar![1].match(new RegExp(`${prop}:\\s*([^;]+);`))?.[1].trim();
      return { gap: pick('gap'), padding: pick('padding'), align: pick('align-items') };
    });
    expect(metrics[0]).toEqual(metrics[1]);
  });
});
