<template>
  <div class="timeline-view">
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
import { Film } from '@lucide/vue';
import type { IPoivelleTimeline, IPoivelleTimelineClip } from '@/models';

const props = defineProps<{ timeline?: IPoivelleTimeline }>();
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
