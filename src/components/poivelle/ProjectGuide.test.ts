// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import ProjectGuide from './ProjectGuide.vue';

vi.mock('@/i18n', () => ({
  t: (key: string, params?: Record<string, unknown>) => `${key}${params ? JSON.stringify(params) : ''}`
}));

const graph = {
  project_id: 'project',
  graph_version: 1,
  nodes: [
    { id: 'image-1', node_type: 'image', title: 'Frame 1', payload: {} },
    { id: 'image-2', node_type: 'image', title: 'Frame 2', payload: {} },
    { id: 'video-1', node_type: 'video', title: 'Motion 1', payload: {} },
    { id: 'output', node_type: 'output', title: 'Master', payload: {} }
  ],
  edges: [],
  groups: [],
  layouts: []
};
const storyboard = {
  project_id: 'project',
  graph_version: 1,
  schema_ref: 'commercial.tvc.storyboard@1',
  script_node_id: 'script',
  title: 'TVC',
  product_name: 'Camera',
  target_duration_seconds: 40,
  sections: [
    {
      id: 'act',
      title: 'Act',
      order: 1,
      shots: [
        { row: { id: 'shot-1' }, shot_node_id: 'shot-1', image_node_ids: ['image-1'], video_node_ids: ['video-1'] },
        { row: { id: 'shot-2' }, shot_node_id: 'shot-2', image_node_ids: ['image-2'], video_node_ids: [] }
      ]
    }
  ]
};

const mountGuide = (artifacts: any[] = []) =>
  mount(ProjectGuide, {
    props: {
      projectTitle: 'Alpine Camera',
      graph: graph as any,
      storyboard: storyboard as any,
      artifacts,
      takes: [],
      selections: [],
      canEdit: true,
      busy: false
    },
    global: {
      mocks: {
        $t: (key: string, params?: Record<string, unknown>) => `${key}${params ? JSON.stringify(params) : ''}`
      }
    }
  });

describe('Poivelle ProjectGuide', () => {
  it('shows the production facts and starts with the first storyboard frame', async () => {
    const wrapper = mountGuide();

    expect(wrapper.text()).toContain('Alpine Camera');
    expect(wrapper.text()).toContain('40s');
    expect(wrapper.text()).toContain('poivelle.guide.stepPlanBody{"shots":2}');
    await wrapper.find('.primary-action').trigger('click');

    expect(wrapper.emitted('generate-node')).toEqual([['image-1']]);
  });

  it('advances to the next unfinished storyboard frame', async () => {
    const wrapper = mountGuide([{ id: 'artifact', node_id: 'image-1', state: 'committed', kind: 'image' }]);

    expect(wrapper.text()).toContain('1 poivelle.guide.generated');
    await wrapper.find('.primary-action').trigger('click');

    expect(wrapper.emitted('generate-node')).toEqual([['image-2']]);
  });

  it('requires reviewing generated frames before motion production', async () => {
    const wrapper = mountGuide([
      { id: 'artifact-1', node_id: 'image-1', state: 'committed', kind: 'image' },
      { id: 'artifact-2', node_id: 'image-2', state: 'committed', kind: 'image' }
    ]);

    await wrapper.find('.primary-action').trigger('click');

    expect(wrapper.emitted('generate-node')).toBeUndefined();
    expect(wrapper.emitted('open-storyboard')).toHaveLength(1);
  });
});
