<template>
  <div class="timeline-view">
    <section v-if="masterArtifact" class="master-output" aria-labelledby="poivelle-master-title">
      <div class="master-heading">
        <div>
          <span class="master-kicker">{{ $t('poivelle.timeline.deliverable') }}</span>
          <h2 id="poivelle-master-title">{{ $t('poivelle.timeline.masterTitle') }}</h2>
        </div>
        <a
          class="master-download"
          :href="masterArtifact.storage_url"
          target="_blank"
          rel="noopener noreferrer"
          download
        >
          <Download :size="15" aria-hidden="true" />
          {{ $t('poivelle.timeline.download') }}
        </a>
      </div>
      <div class="master-media">
        <video
          class="master-player"
          :src="masterArtifact.storage_url"
          :aria-label="$t('poivelle.timeline.playerLabel')"
          controls
          playsinline
          preload="metadata"
          @loadstart="onVideoLoadStart"
          @loadedmetadata="videoLoading = false"
          @canplay="videoLoading = false"
          @error="onVideoError"
        />
        <div v-if="videoLoading && !videoLoadError" class="master-status" role="status">
          <LoaderCircle :size="24" class="is-spinning" aria-hidden="true" />
          <span>{{ $t('poivelle.timeline.loading') }}</span>
        </div>
        <div v-if="videoLoadError" class="master-status is-error" role="alert">
          <AlertTriangle :size="24" aria-hidden="true" />
          <span>{{ $t('poivelle.timeline.loadError') }}</span>
        </div>
      </div>
      <dl class="master-metadata">
        <div>
          <dt>{{ $t('poivelle.timeline.duration') }}</dt>
          <dd>{{ durationLabel }}</dd>
        </div>
        <div>
          <dt>{{ $t('poivelle.timeline.frame') }}</dt>
          <dd>{{ frameLabel }}</dd>
        </div>
        <div>
          <dt>{{ $t('poivelle.timeline.videoClips') }}</dt>
          <dd>{{ metadataNumber('video_clips') ?? '—' }}</dd>
        </div>
        <div>
          <dt>{{ $t('poivelle.timeline.audioClips') }}</dt>
          <dd>{{ metadataNumber('audio_clips') ?? '—' }}</dd>
        </div>
      </dl>
    </section>
    <div class="timeline-ruler">
      <span v-for="tick in 10" :key="tick">{{ (tick - 1) * 5 }}s</span>
    </div>
    <div v-if="timeline?.tracks.length" class="tracks">
      <div v-for="track in timeline.tracks" :key="track.id" class="track-row">
        <div class="track-label">{{ track.title || track.kind || track.id }}</div>
        <div class="track-lane">
          <button
            v-for="clip in clipsFor(track.id)"
            :key="clip.id"
            type="button"
            class="timeline-clip"
            :style="clipStyle(clip)"
            :title="clip.artifact_id"
          >
            {{ clipLabel(clip) }}
          </button>
        </div>
      </div>
    </div>
    <div v-else class="empty-timeline">
      <Film :size="30" stroke-width="1.4" />
      <h2>{{ $t('poivelle.timeline.emptyTitle') }}</h2>
      <p>{{ $t('poivelle.timeline.emptyBody') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { AlertTriangle, Download, Film, LoaderCircle } from '@lucide/vue';
import type { IPoivelleArtifact, IPoivelleGraphSnapshot, IPoivelleTimeline, IPoivelleTimelineClip } from '@/models';

const props = defineProps<{
  timeline?: IPoivelleTimeline;
  graph: IPoivelleGraphSnapshot;
  artifacts?: IPoivelleArtifact[];
}>();
const masterArtifact = computed(() => {
  const compositionNodes = new Set(
    props.graph.nodes.filter((node) => node.node_type === 'composition').map((node) => node.id)
  );
  return [...(props.artifacts ?? [])]
    .filter(
      (artifact) =>
        artifact.kind === 'video' &&
        artifact.state === 'committed' &&
        artifact.restriction_watermark === 0 &&
        !!artifact.node_id &&
        compositionNodes.has(artifact.node_id) &&
        artifact.metadata?.operation === 'compose.timeline@1'
    )
    .sort((left, right) => right.created_at.localeCompare(left.created_at))[0];
});
const videoLoading = ref(true);
const videoLoadError = ref(false);
watch(
  () => masterArtifact.value?.id,
  () => {
    videoLoading.value = true;
    videoLoadError.value = false;
  }
);
const onVideoLoadStart = () => {
  videoLoading.value = true;
  videoLoadError.value = false;
};
const onVideoError = () => {
  videoLoading.value = false;
  videoLoadError.value = true;
};
const metadataNumber = (key: string): number | undefined => {
  const value = masterArtifact.value?.metadata?.[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
};
const durationLabel = computed(() => {
  const duration = metadataNumber('duration_ms');
  return duration === undefined ? '—' : `${(duration / 1000).toFixed(1)}s`;
});
const frameLabel = computed(() => {
  const width = metadataNumber('width');
  const height = metadataNumber('height');
  return width && height ? `${width} × ${height}` : '—';
});
const clipsFor = (trackId: string) => props.timeline?.clips.filter((clip) => clip.track_id === trackId) ?? [];
const clipLabel = (clip: IPoivelleTimelineClip) => clip.artifact_id.slice(-6);
const clipStyle = (clip: IPoivelleTimelineClip) => ({
  left: `${clip.timeline_start_ms / 100}px`,
  width: `${Math.max(48, (clip.source_out_ms - clip.source_in_ms) / 100)}px`
});
</script>

<style scoped>
.timeline-view {
  height: 100%;
  padding: 22px;
  overflow: auto;
  background: var(--poivelle-canvas);
}

.master-output {
  width: min(100%, 960px);
  margin: 0 auto 24px;
  overflow: hidden;
  border: 1px solid var(--poivelle-line);
  border-radius: var(--poivelle-radius);
  background: var(--poivelle-paper);
  box-shadow: var(--app-shadow-md);
}

.master-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 0;
  padding: 18px 20px;
  background: var(--app-gradient-subtle);
}

.master-kicker {
  color: var(--app-brand-hex);
  font-size: 10px;
  font-weight: 650;
}

.master-heading h2 {
  margin: 3px 0 0;
  color: var(--poivelle-ink);
  font-size: 20px;
  font-weight: 650;
}

.master-download {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 34px;
  padding: 0 12px;
  border: 1px solid var(--poivelle-line-strong);
  border-radius: var(--poivelle-radius-small);
  color: var(--app-brand-hex-dark-2);
  background: var(--poivelle-paper);
  font-size: 10px;
  text-decoration: none;
}

.master-download:hover {
  border-color: var(--app-brand-hex);
  background: var(--poivelle-hover);
}

.master-download:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--app-brand-hex) 38%, transparent);
  outline-offset: 2px;
}

.master-media {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: var(--poivelle-media-stage);
}

.master-player {
  display: block;
  width: 100%;
  height: 100%;
  background: var(--poivelle-media-stage);
  object-fit: contain;
}

.master-status {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 8px;
  color: var(--poivelle-on-media);
  background: var(--poivelle-media-overlay);
  font-size: 10px;
  pointer-events: none;
  z-index: 1;
}

.master-status.is-error {
  color: var(--poivelle-on-media-danger);
}

.is-spinning {
  animation: master-spin 0.9s linear infinite;
}

@keyframes master-spin {
  to {
    transform: rotate(360deg);
  }
}

.master-metadata {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin: 0;
  border: 0;
  border-top: 0;
}

.master-metadata div {
  min-width: 0;
  padding: 11px 13px;
  border-right: 1px solid var(--poivelle-line);
}

.master-metadata div:last-child {
  border-right: 0;
}

.master-metadata dt {
  color: var(--poivelle-muted);
  font-size: 9px;
}

.master-metadata dd {
  margin: 3px 0 0;
  overflow: hidden;
  color: var(--poivelle-ink);
  font-size: 11px;
  font-weight: 600;
  text-overflow: ellipsis;
}

@media (max-width: 720px) {
  .timeline-view {
    padding: 16px 18px 28px;
  }

  .master-heading {
    align-items: stretch;
    flex-direction: column;
  }

  .master-download {
    align-self: flex-start;
  }

  .master-output {
    box-shadow: var(--app-shadow-sm);
  }

  .master-metadata {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .master-metadata div:nth-child(2) {
    border-right: 0;
  }

  .master-metadata div:nth-child(-n + 2) {
    border-bottom: 1px solid var(--poivelle-line);
  }
}

.timeline-ruler {
  display: grid;
  grid-template-columns: repeat(10, 120px);
  width: 1200px;
  height: 28px;
  padding-left: 120px;
  border: 1px solid var(--poivelle-line);
  border-bottom: 0;
  border-radius: var(--poivelle-radius) var(--poivelle-radius) 0 0;
  color: var(--poivelle-muted);
  font-size: 9px;
}

.track-row {
  display: grid;
  grid-template-columns: 120px 1fr;
  width: 1320px;
  min-height: 58px;
  border: 1px solid var(--poivelle-line);
  border-top: 0;
  background: var(--poivelle-paper);
}

.track-row:last-child {
  border-radius: 0 0 var(--poivelle-radius) var(--poivelle-radius);
  overflow: hidden;
}

.track-label {
  display: flex;
  align-items: center;
  padding: 0 10px;
  border-right: 1px solid var(--poivelle-line-strong);
  color: var(--poivelle-muted);
  background: var(--app-sidebar-bg);
  font-size: 10px;
}

.track-lane {
  position: relative;
  background-image: repeating-linear-gradient(90deg, transparent 0, transparent 119px, var(--poivelle-grid) 120px);
}

.timeline-clip {
  position: absolute;
  top: 9px;
  height: 38px;
  padding: 0 8px;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--app-brand-hex) 42%, transparent);
  border-radius: var(--poivelle-radius-small);
  color: var(--poivelle-ink);
  background: var(--poivelle-hover);
  font: inherit;
  font-size: 9px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.timeline-clip:focus-visible {
  outline: 0;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--app-brand-hex) 55%, transparent);
}

.empty-timeline {
  display: grid;
  place-content: center;
  justify-items: center;
  min-height: 380px;
  color: var(--poivelle-muted);
  text-align: center;
}

.empty-timeline h2 {
  margin: 12px 0 5px;
  color: var(--poivelle-ink);
  font-size: 22px;
  font-weight: 650;
}

.empty-timeline p {
  margin: 0;
  font-size: 11px;
}
</style>
