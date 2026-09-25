import { expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

for (const file of ['UploadSkillDialog.vue', 'WriteSkillDialog.vue', 'BrowseSkillsDialog.vue']) {
  it(`${file} teleports above the capability dialog`, () => {
    const source = readFileSync(new URL(`./${file}`, import.meta.url), 'utf8');
    expect(source).toMatch(/<el-dialog\s+append-to-body/);
  });
}
