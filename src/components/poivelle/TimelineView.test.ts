// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import type { IPoivelleArtifact, IPoivelleGraphSnapshot, IPoivelleTimeline } from '@/models';
import TimelineView from './TimelineView.vue';

const graph: IPoivelleGraphSnapshot = {
  project_id: 'project',
  graph_version: 1,
  nodes: [
    {
      id: 'composition-node',
      project_id: 'project',
      version: 1,
      node_type: 'composition',
      title: 'Master timeline',
      payload: {},
      locked_paths: [],
      updated_at: '2026-07-20T00:00:00Z'
    },
    {
      id: 'shot-video-node',
      project_id: 'project',
      version: 1,
      node_type: 'video',
      title: 'Shot video',
      payload: {},
      locked_paths: [],
      updated_at: '2026-07-20T00:00:00Z'
    }
  ],
  edges: [],
  groups: [],
  layouts: []
};

const timeline: IPoivelleTimeline = {
  id: 'timeline',
  project_id: 'project',
  graph_version: 1,
  fps: '24/1',
  tracks: [{ id: 'picture', title: 'Picture', kind: 'video' }],
  clips: [
    {
      id: 'clip',
      track_id: 'picture',
      artifact_id: 'shot-artifact',
      timeline_start_ms: 0,
      source_in_ms: 0,
      source_out_ms: 4000,
      speed: 2
    }
  ]
};

const artifact = (
  id: string,
  nodeId: string,
  state: IPoivelleArtifact['state'],
  createdAt: string,
  restrictionWatermark = state === 'restricted' ? 1 : 0
): IPoivelleArtifact => ({
  id,
  project_id: 'project',
  revision_id: 'revision',
  run_id: 'run',
  step_run_id: 'step',
  attempt_id: 'attempt',
  node_id: nodeId,
  kind: 'video',
  storage_url: `https://cdn.example/${id}.mp4`,
  content_hash: `sha256:${id}`,
  state,
  restriction_watermark: restrictionWatermark,
  metadata: {
    operation: 'compose.timeline@1',
    duration_ms: 40000,
    width: 1920,
    height: 1080,
    video_clips: 10,
    audio_clips: 2
  },
  created_at: createdAt
});

const mountTimeline = () =>
  mount(TimelineView, {
    props: {
      graph,
      timeline,
      artifacts: [
        artifact('shot-artifact', 'shot-video-node', 'committed', '2026-07-20T03:00:00Z'),
        artifact('restricted-master', 'composition-node', 'restricted', '2026-07-20T04:00:00Z'),
        artifact('production-master', 'composition-node', 'committed', '2026-07-20T02:00:00Z')
      ]
    },
    global: {
      mocks: { $t: (key: string) => key }
    }
  });

describe('Poivelle TimelineView', () => {
  it('plays and downloads the latest committed composition master', () => {
    const wrapper = mountTimeline();

    expect(wrapper.get('video').attributes('src')).toBe('https://cdn.example/production-master.mp4');
    expect(wrapper.get('.master-download').attributes('href')).toBe('https://cdn.example/production-master.mp4');
    expect(wrapper.text()).toContain('40.0s');
    expect(wrapper.text()).toContain('1920 × 1080');
    expect(wrapper.text()).toContain('10');
    expect(wrapper.text()).toContain('2');
    expect(wrapper.get('.timeline-clip').attributes('style')).toContain('width: 48px');
  });

  it('does not promote shot video or restricted composition artifacts', () => {
    const wrapper = mount(TimelineView, {
      props: {
        graph,
        timeline,
        artifacts: [
          artifact('shot-artifact', 'shot-video-node', 'committed', '2026-07-20T03:00:00Z'),
          artifact('restricted-master', 'composition-node', 'restricted', '2026-07-20T04:00:00Z'),
          artifact('watermarked-master', 'composition-node', 'committed', '2026-07-20T05:00:00Z', 1)
        ]
      },
      global: { mocks: { $t: (key: string) => key } }
    });

    expect(wrapper.find('video').exists()).toBe(false);
    expect(wrapper.find('.master-download').exists()).toBe(false);
  });

  it('shows an explicit error when the committed master cannot load', async () => {
    const wrapper = mountTimeline();

    await wrapper.get('video').trigger('error');

    expect(wrapper.get('[role="alert"]').text()).toContain('poivelle.timeline.loadError');
    expect(wrapper.find('[role="status"]').exists()).toBe(false);
  });
});
