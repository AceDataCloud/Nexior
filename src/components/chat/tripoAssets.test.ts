import { describe, expect, it } from 'vitest';
import { tripoAssets } from './tripoAssets';

const asset = {
  model_url: 'https://cdn.acedata2.cloud/tripo/file.glb',
  image_url: 'https://cdn.acedata2.cloud/tripo/preview.webp',
  format: 'GLB'
};
describe('Tripo tool results', () => {
  it('renders the delivered task once and preserves its poster', () => {
    const output = JSON.stringify({
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            items: [
              { response: { success: true, data: [asset] } },
              null,
              { response: { success: true, data: [asset] } }
            ]
          })
        }
      ]
    });
    expect(tripoAssets(output)).toEqual([{ url: asset.model_url, format: 'GLB', poster: asset.image_url }]);
  });
  it('ignores failed tasks, request data, unrelated origins and unfinished receipts', () => {
    for (const row of [
      { response: { success: false, data: [asset] } },
      { request: asset },
      { data: [{ ...asset, model_url: 'https://example.net/tripo/a.glb' }] },
      { task_id: 'pending' }
    ]) {
      expect(tripoAssets(JSON.stringify(row))).toEqual([]);
    }
  });
});
