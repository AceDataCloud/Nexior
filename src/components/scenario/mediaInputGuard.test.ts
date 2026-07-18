import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { SCENARIO_ROUTES } from '@/constants/scenarioRoutes';

const COMPONENTS_ROOT = path.resolve(import.meta.dirname, '..');
const LEGACY_RAW_MEDIA_INPUTS = [
  'fish/model/Card.vue',
  'fish/model/Recorder.vue',
  'fish/ModelConfigPanel.vue',
  'kling/TalkingPhotoPanel.vue',
  'pika/VideoPlayer.vue',
  'producer/config/UploadAudio.vue',
  'suno/config/UploadAudio.vue'
];
const RESULT_PATH_SEGMENTS = new Set(['task', 'tasks']);
const RESULT_FILE_NAMES = new Set(['Preview.vue', 'RecentPanel.vue', 'ResultPanel.vue']);
const AUDITED_SERVICE_ROOTS = new Set(
  SCENARIO_ROUTES.map(({ name }) => name.replace(/-model$/, '').replaceAll('-', ''))
);

const listVueFiles = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return listVueFiles(absolutePath);
    return entry.isFile() && entry.name.endsWith('.vue') ? [absolutePath] : [];
  });

describe('scenario media input guard', () => {
  it('does not add raw audio or video elements to generation input panels', () => {
    const rawMediaInputs = listVueFiles(COMPONENTS_ROOT)
      .filter((filePath) => {
        const relativePath = path.relative(COMPONENTS_ROOT, filePath);
        const segments = relativePath.split(path.sep);
        return (
          AUDITED_SERVICE_ROOTS.has(segments[0]) &&
          !segments.some((segment) => RESULT_PATH_SEGMENTS.has(segment)) &&
          !RESULT_FILE_NAMES.has(path.basename(filePath))
        );
      })
      .filter((filePath) => {
        const source = readFileSync(filePath, 'utf8');
        const templateStart = source.search(/<template(?:\s[^>]*)?>/i);
        const templateOpenEnd = templateStart < 0 ? -1 : source.indexOf('>', templateStart);
        const templateEnd = source.toLowerCase().lastIndexOf('</template>');
        const template =
          templateOpenEnd >= 0 && templateEnd > templateOpenEnd ? source.slice(templateOpenEnd + 1, templateEnd) : '';
        const withoutComments = template.replace(/<!--[\s\S]*?-->/g, '');
        return /<(?:audio|video)(?:\s|\/?\s*>)/i.test(withoutComments);
      })
      .map((filePath) => path.relative(COMPONENTS_ROOT, filePath).split(path.sep).join('/'))
      .sort();

    expect(rawMediaInputs).toEqual([...LEGACY_RAW_MEDIA_INPUTS].sort());
  });
});
