// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import StoryboardMediaLane from './StoryboardMediaLane.vue';

const artifact = {
  id: 'artifact-one',
  project_id: 'project',
  revision_id: 'revision',
  run_id: 'run',
  step_run_id: 'step',
  attempt_id: 'attempt',
  node_id: 'image-node',
  kind: 'image' as const,
  storage_url: 'https://cdn.example/frame.jpg',
  content_hash: 'sha256:frame',
  state: 'committed' as const,
  restriction_watermark: 0,
  metadata: {},
  created_at: 'now'
};

const mountLane = (canSelect: boolean) =>
  mount(StoryboardMediaLane, {
    props: {
      title: 'Frames',
      kind: 'image',
      nodeIds: ['image-node'],
      artifacts: [artifact],
      takes: [
        {
          id: 'take-ready',
          project_id: 'project',
          revision_id: 'revision',
          target_node_id: 'image-node',
          artifact_ids: ['artifact-one', 'artifact-one'],
          intent: 'candidate',
          state: 'ready',
          created_at: 'now'
        },
        {
          id: 'take-restricted',
          project_id: 'project',
          revision_id: 'revision',
          target_node_id: 'image-node',
          artifact_ids: [],
          intent: 'restricted',
          state: 'restricted',
          created_at: 'now'
        }
      ],
      selections: [],
      canEdit: true,
      canSelect
    },
    global: {
      mocks: { $t: (key: string) => key }
    }
  });

describe('Poivelle StoryboardMediaLane', () => {
  it('deduplicates artifacts and hides selection before a revision exists', () => {
    const wrapper = mountLane(false);
    expect(wrapper.findAll('.candidate')).toHaveLength(1);
    expect(wrapper.text()).not.toContain('poivelle.storyboard.selectTake');
  });

  it('shows selection and unavailable Take states when editing a revision', () => {
    const wrapper = mountLane(true);
    expect(wrapper.text()).toContain('poivelle.storyboard.selectTake');
    expect(wrapper.text()).toContain('poivelle.storyboard.restrictedTake');
  });
});
