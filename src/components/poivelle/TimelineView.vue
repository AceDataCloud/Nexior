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
          >
            {{ clip.artifact_id }}
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
const clipStyle = (clip: IPoivelleTimelineClip) => ({
  left: `${clip.timeline_start_ms / 100}px`,
  width: `${Math.max(48, (clip.source_out_ms - clip.source_in_ms) / 100)}px`
});
</script>

<style scoped>
.timeline-view {
  height: 100%;
  padding: 18px;
  overflow: auto;
  background: var(--poivelle-canvas);
}

.master-output {
  width: min(100%, 960px);
  margin: 0 auto 24px;
  padding-bottom: 22px;
  border-bottom: 1px solid var(--poivelle-line-strong);
}

.master-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}

.master-kicker {
  color: var(--poivelle-muted);
  font-family: 'Courier New', monospace;
  font-size: 9px;
  text-transform: uppercase;
}

.master-heading h2 {
  margin: 3px 0 0;
  color: var(--poivelle-ink);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 20px;
  font-weight: 500;
}

.master-download {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 34px;
  padding: 0 12px;
  border: 1px solid var(--poivelle-line-strong);
  color: var(--poivelle-ink);
  background: var(--poivelle-paper);
  font-size: 10px;
  text-decoration: none;
}

.master-media {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #050706;
}

.master-player {
  display: block;
  width: 100%;
  height: 100%;
  background: #050706;
  object-fit: contain;
}

.master-status {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 8px;
  color: #d8ddd8;
  background: rgb(5 7 6 / 78%);
  font-size: 10px;
  pointer-events: none;
  z-index: 1;
}

.master-status.is-error {
  color: #f0c4b7;
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
  border: 1px solid var(--poivelle-line);
  border-top: 0;
}

.master-metadata div {
  min-width: 0;
  padding: 9px 11px;
  border-right: 1px solid var(--poivelle-line);
}

.master-metadata div:last-child {
  border-right: 0;
}

.master-metadata dt {
  color: var(--poivelle-muted);
  font-size: 8px;
  text-transform: uppercase;
}

.master-metadata dd {
  margin: 3px 0 0;
  overflow: hidden;
  color: var(--poivelle-ink);
  font-family: 'Courier New', monospace;
  font-size: 10px;
  text-overflow: ellipsis;
}

@media (max-width: 720px) {
  .master-heading {
    align-items: stretch;
    flex-direction: column;
  }

  .master-download {
    align-self: flex-start;
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
  border-bottom: 1px solid var(--poivelle-line-strong);
  color: var(--poivelle-muted);
  font-family: 'Courier New', monospace;
  font-size: 9px;
}

.track-row {
  display: grid;
  grid-template-columns: 120px 1fr;
  width: 1320px;
  min-height: 58px;
  border-bottom: 1px solid var(--poivelle-line);
}

.track-label {
  display: flex;
  align-items: center;
  padding: 0 10px;
  border-right: 1px solid var(--poivelle-line-strong);
  color: var(--poivelle-muted);
  background: var(--poivelle-paper);
  font-size: 10px;
  text-transform: uppercase;
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
  border: 1px solid #6aa48d;
  color: var(--poivelle-ink);
  background: var(--poivelle-mint);
  font: inherit;
  font-size: 9px;
  text-overflow: ellipsis;
  white-space: nowrap;
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
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 22px;
}

.empty-timeline p {
  margin: 0;
  font-size: 11px;
}
</style>
