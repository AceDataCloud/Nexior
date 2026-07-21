<template>
  <main class="discovery-home">
    <header class="discovery-header">
      <div class="brand"><Clapperboard :size="19" aria-hidden="true" /> POIVELLE</div>
      <div class="project-links">
        <button
          v-for="project in projects.slice(0, 3)"
          :key="project.id"
          type="button"
          :title="project.title"
          :aria-label="project.title"
          @click="openProject(project.id)"
        >
          {{ project.title }} <ChevronRight :size="13" aria-hidden="true" />
        </button>
      </div>
    </header>

    <div v-if="bootstrapLoading || bootstrapError" class="discovery-state" role="status">
      <LoaderCircle v-if="bootstrapLoading" :size="16" class="spinning" aria-hidden="true" />
      <span>{{ bootstrapLoading ? $t('poivelle.status.loading') : bootstrapError }}</span>
      <button v-if="bootstrapError" type="button" @click="bootstrap">{{ $t('poivelle.action.retry') }}</button>
    </div>

    <section class="creator" aria-labelledby="poivelle-create-title">
      <p class="creator-kicker">{{ $t('poivelle.discovery.kicker') }}</p>
      <h1 id="poivelle-create-title">{{ $t('poivelle.discovery.title') }}</h1>
      <div class="mode-switch" :aria-label="$t('poivelle.discovery.skills')">
        <button
          v-for="mode in modes"
          :key="mode.workId"
          type="button"
          :class="{ active: selectedWorkId === mode.workId }"
          :disabled="bootstrapLoading"
          @click="selectedWorkId = mode.workId"
        >
          <component :is="mode.icon" :size="15" aria-hidden="true" />
          {{ $t(mode.label) }}
        </button>
      </div>
      <form class="composer" @submit.prevent="createFromPrompt">
        <textarea
          v-model="prompt"
          :placeholder="$t('poivelle.discovery.placeholder')"
          :disabled="bootstrapLoading"
          maxlength="500"
          rows="4"
        />
        <div class="composer-footer">
          <span>{{ prompt.length }}/500</span>
          <button
            type="submit"
            :disabled="!prompt.trim() || !selectedWork || bootstrapLoading || submitting"
            :title="$t('poivelle.discovery.create')"
          >
            <LoaderCircle v-if="submitting" :size="18" class="spinning" aria-hidden="true" />
            <ArrowUp v-else :size="18" aria-hidden="true" />
          </button>
        </div>
      </form>
      <div class="prompt-starters">
        <button
          v-for="starter in starters"
          :key="starter"
          type="button"
          :disabled="bootstrapLoading"
          @click="prompt = $t(starter)"
        >
          {{ $t(starter) }}
        </button>
      </div>
    </section>

    <section class="works" aria-labelledby="poivelle-works-title">
      <div class="works-heading">
        <div>
          <span>{{ $t('poivelle.discovery.galleryKicker') }}</span>
          <h2 id="poivelle-works-title">{{ $t('poivelle.discovery.gallery') }}</h2>
        </div>
        <label class="search">
          <Search :size="16" aria-hidden="true" />
          <input
            v-model="query"
            :placeholder="$t('poivelle.discovery.search')"
            :aria-label="$t('poivelle.discovery.search')"
          />
        </label>
      </div>
      <div class="category-tabs">
        <button
          v-for="category in categories"
          :key="category.value"
          type="button"
          :class="{ active: selectedCategory === category.value }"
          @click="selectedCategory = category.value"
        >
          {{ $t(category.label) }}
        </button>
      </div>
      <div class="work-grid">
        <article v-for="work in filteredWorks" :key="work.id" class="work-card">
          <div class="cover">
            <img
              v-if="work.cover_url && !failedCoverIds.has(work.id)"
              :src="work.cover_url"
              :alt="work.title"
              @error="hideFailedCover(work.id)"
            />
            <Film v-else :size="32" aria-hidden="true" />
            <span v-if="playableVideoUrl(work)" class="film-badge">{{ $t('poivelle.discovery.finishedFilm') }}</span>
            <button
              v-if="playableVideoUrl(work)"
              type="button"
              class="cover-play"
              :aria-label="`${$t('poivelle.discovery.playFilm')}: ${work.title}`"
              @click="previewWork = work"
            >
              <Play :size="18" fill="currentColor" aria-hidden="true" />
              {{ $t('poivelle.discovery.playFilm') }}
            </button>
            <span class="duration-badge">
              {{ work.duration_seconds ? formatDuration(work.duration_seconds) : $t('poivelle.discovery.community') }}
            </span>
          </div>
          <div class="work-copy">
            <div class="work-meta">
              <span>{{ work.creator_name }}</span>
              <strong>{{ work.title }}</strong>
              <p>{{ work.description }}</p>
            </div>
            <div class="work-actions">
              <button v-if="playableVideoUrl(work)" type="button" class="play-button" @click="previewWork = work">
                <Play :size="14" fill="currentColor" aria-hidden="true" /> {{ $t('poivelle.discovery.play') }}
              </button>
              <button
                v-if="work.copyable !== false"
                type="button"
                class="copy-button"
                :disabled="bootstrapLoading || submitting"
                @click="copyWork(work)"
              >
                <Copy :size="14" aria-hidden="true" /> {{ $t('poivelle.discovery.copy') }}
              </button>
            </div>
          </div>
        </article>
      </div>
    </section>

    <el-dialog
      v-model="previewVisible"
      class="film-preview-dialog"
      aria-labelledby="poivelle-film-dialog-title"
      width="min(920px, calc(100vw - 32px))"
      align-center
      append-to-body
      destroy-on-close
    >
      <template #header>
        <div v-if="previewWork" class="film-dialog-heading">
          <span>{{ $t('poivelle.discovery.finishedFilm') }}</span>
          <strong id="poivelle-film-dialog-title">{{ previewWork.title }}</strong>
          <small>
            {{ previewWork.creator_name }}
            <template v-if="previewWork.duration_seconds">
              · {{ formatDuration(previewWork.duration_seconds) }}</template
            >
          </small>
        </div>
      </template>
      <video-player
        v-if="previewWork && playableVideoUrl(previewWork)"
        :key="`${previewWork.id}-${previewWork.video_url}`"
        :src="playableVideoUrl(previewWork)!"
      />
    </el-dialog>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useStore } from 'vuex';
import {
  ArrowUp,
  Building2,
  ChevronRight,
  Clapperboard,
  Copy,
  Film,
  LoaderCircle,
  Music2,
  Play,
  Search
} from '@lucide/vue';
import { ElDialog, ElMessage } from 'element-plus';
import { Status, type IPoivelleDiscoveryWork, type PoivelleDiscoveryCategory } from '@/models';
import { t } from '@/i18n';
import VideoPlayer from '@/components/common/VideoPlayer.vue';

const emit = defineEmits<{ 'open-studio': [] }>();
const store = useStore();
const state = computed(() => store.state.poivelle);
const projects = computed(() => state.value?.projects ?? []);
const works = computed<IPoivelleDiscoveryWork[]>(() => state.value?.discoveryWorks ?? []);
const prompt = ref('');
const query = ref('');
const submitting = ref(false);
const previewWork = ref<IPoivelleDiscoveryWork>();
const failedCoverIds = ref(new Set<string>());
const selectedWorkId = ref('official:pulsecam');
const selectedCategory = ref<'all' | PoivelleDiscoveryCategory>('all');
const modes = [
  { workId: 'official:pulsecam', label: 'poivelle.discovery.commercial', icon: Clapperboard },
  { workId: 'official:moonlit-signal', label: 'poivelle.discovery.musicVideo', icon: Music2 },
  { workId: 'official:northstar-origin', label: 'poivelle.discovery.documentary', icon: Building2 }
];
const starters = [
  'poivelle.discovery.starterProduct',
  'poivelle.discovery.starterMusic',
  'poivelle.discovery.starterDocumentary'
];
const categories = [
  { value: 'all' as const, label: 'poivelle.discovery.all' },
  { value: 'commercial' as const, label: 'poivelle.discovery.commercial' },
  { value: 'music_video' as const, label: 'poivelle.discovery.musicVideo' },
  { value: 'narrative' as const, label: 'poivelle.discovery.narrative' },
  { value: 'documentary' as const, label: 'poivelle.discovery.documentary' },
  { value: 'community' as const, label: 'poivelle.discovery.community' }
];
const filteredWorks = computed(() => {
  const term = query.value.trim().toLowerCase();
  return works.value.filter(
    (work) =>
      (selectedCategory.value === 'all' || work.category === selectedCategory.value) &&
      (!term ||
        `${work.title} ${work.description} ${work.creator_name} ${(work.tags ?? []).join(' ')}`
          .toLowerCase()
          .includes(term))
  );
});
const bootstrapLoading = computed(() => state.value?.status?.bootstrap === Status.Request);
const bootstrapError = computed(() => state.value?.error as string | undefined);
const previewVisible = computed({
  get: () => !!previewWork.value,
  set: (visible: boolean) => {
    if (!visible) previewWork.value = undefined;
  }
});
const selectedWork = computed(() => {
  const selected = works.value.find((item) => item.id === selectedWorkId.value);
  if (selected && selected.copyable !== false) return selected;
  return works.value.find((item) => item.copyable !== false);
});
const bootstrap = () => store.dispatch('poivelle/bootstrap', { loadProject: false });
const hideFailedCover = (workId: string) => {
  failedCoverIds.value = new Set([...failedCoverIds.value, workId]);
};
const playableVideoUrl = (work: IPoivelleDiscoveryWork) =>
  work.video_url?.startsWith('https://') ? work.video_url : undefined;
const requestErrorMessage = (error: unknown) => {
  if (error && typeof error === 'object' && 'response' in error) {
    const detail = (error as any).response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (typeof detail?.message === 'string') return detail.message;
  }
  return error instanceof Error ? error.message : t('poivelle.error.generic');
};
const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return minutes ? `${minutes}:${remainder.toString().padStart(2, '0')}` : `0:${remainder.toString().padStart(2, '0')}`;
};
const openProject = async (projectId: string) => {
  await store.dispatch('poivelle/loadProject', projectId);
  emit('open-studio');
};
const submitCopy = async (work: IPoivelleDiscoveryWork, brief: string) => {
  if (submitting.value) return;
  submitting.value = true;
  try {
    await store.dispatch('poivelle/copyDiscoveryWork', {
      work_id: work.id,
      prompt: brief,
      title: brief.slice(0, 80)
    });
    emit('open-studio');
  } catch (error) {
    ElMessage.error(requestErrorMessage(error));
  } finally {
    submitting.value = false;
  }
};
const createFromPrompt = async () => {
  const work = selectedWork.value;
  if (work && prompt.value.trim()) await submitCopy(work, prompt.value.trim());
};
const copyWork = async (work: IPoivelleDiscoveryWork) => {
  const brief = prompt.value.trim() || `${t('poivelle.discovery.copyPrefix')} ${work.title}`;
  await submitCopy(work, brief);
};

onMounted(bootstrap);
</script>

<style scoped>
.discovery-home {
  --ink: var(--el-text-color-primary);
  --muted: var(--el-text-color-secondary);
  width: 100%;
  height: 100%;
  overflow: auto;
  color: var(--ink);
  background: var(--app-bg-section);
}
.discovery-header {
  position: sticky;
  top: 0;
  z-index: 4;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 58px;
  padding: 0 28px;
  border-bottom: 1px solid var(--app-border-subtle);
  background: color-mix(in srgb, var(--app-bg-surface) 94%, transparent);
  backdrop-filter: blur(16px);
}
.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--app-brand-hex);
  font-size: 13px;
  font-weight: 760;
}
.discovery-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 38px;
  padding: 0 18px;
  color: var(--muted);
  background: rgba(var(--app-brand-rgb), 0.06);
  font-size: 11px;
}
.discovery-state button {
  border: 0;
  color: var(--app-brand-hex);
  background: transparent;
  font: inherit;
  cursor: pointer;
}
.project-links {
  display: flex;
  gap: 6px;
  overflow: hidden;
}
.project-links button {
  display: flex;
  align-items: center;
  gap: 3px;
  max-width: 190px;
  padding: 7px 9px;
  overflow: hidden;
  border: 0;
  color: var(--muted);
  background: transparent;
  font: 11px inherit;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}
.creator {
  width: min(760px, calc(100% - 36px));
  margin: 72px auto 76px;
  text-align: center;
}
.creator-kicker,
.works-heading span {
  margin: 0;
  color: var(--app-brand-hex);
  font-size: 11px;
  font-weight: 700;
}
.creator h1 {
  margin: 8px 0 22px;
  font-size: clamp(28px, 4vw, 44px);
  font-weight: 680;
  letter-spacing: 0;
}
.mode-switch,
.prompt-starters,
.category-tabs {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 7px;
}
.mode-switch button,
.prompt-starters button,
.category-tabs button {
  border: 1px solid var(--app-border-subtle);
  border-radius: var(--adc-radius-full);
  color: var(--muted);
  background: var(--app-bg-surface);
  font: 11px inherit;
  cursor: pointer;
}
.mode-switch button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
}
.mode-switch button.active,
.category-tabs button.active {
  border-color: var(--app-brand-hex);
  color: var(--app-brand-hex);
  background: rgba(var(--app-brand-rgb), 0.08);
}
.composer {
  margin-top: 13px;
  overflow: hidden;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  background: var(--app-bg-surface);
  box-shadow: var(--app-shadow-md);
  text-align: left;
}
.composer:focus-within {
  border-color: var(--app-brand-hex);
  box-shadow:
    0 0 0 3px rgba(var(--app-brand-rgb), 0.1),
    var(--app-shadow-md);
}
.composer textarea {
  box-sizing: border-box;
  width: 100%;
  min-height: 116px;
  padding: 16px 17px 8px;
  border: 0;
  outline: 0;
  color: var(--ink);
  background: transparent;
  font: 14px/1.6 var(--adc-font-family-sans);
  resize: none;
}
.composer-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 9px 9px 16px;
  color: var(--muted);
  font-size: 10px;
}
.composer-footer button {
  display: grid;
  width: 35px;
  height: 35px;
  place-items: center;
  border: 0;
  border-radius: 50%;
  color: white;
  background: var(--app-brand-hex);
  cursor: pointer;
}
.composer-footer button:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.prompt-starters {
  margin-top: 13px;
}
.prompt-starters button {
  padding: 7px 11px;
}
.works {
  width: min(1180px, calc(100% - 40px));
  margin: 0 auto;
  padding-bottom: 70px;
}
.works-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
}
.works-heading h2 {
  margin: 4px 0 0;
  font-size: 24px;
}
.search {
  display: flex;
  align-items: center;
  gap: 7px;
  width: 230px;
  padding: 0 10px;
  border: 1px solid var(--app-border-subtle);
  border-radius: var(--adc-radius-control);
  color: var(--muted);
  background: var(--app-bg-surface);
}
.search input {
  width: 100%;
  height: 36px;
  border: 0;
  outline: 0;
  color: var(--ink);
  background: transparent;
  font: 11px inherit;
}
.category-tabs {
  justify-content: flex-start;
  margin: 15px 0;
}
.category-tabs button {
  padding: 7px 12px;
}
.work-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}
.work-card {
  overflow: hidden;
  border: 1px solid var(--app-border-subtle);
  border-radius: 8px;
  background: var(--app-bg-surface);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease;
}
.work-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--app-shadow-md);
}
.cover {
  position: relative;
  display: grid;
  aspect-ratio: 16 / 9;
  place-items: center;
  overflow: hidden;
  color: white;
  background: #111;
}
.cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.35s ease;
}
.work-card:hover .cover img {
  transform: scale(1.025);
}
.duration-badge,
.film-badge {
  position: absolute;
  bottom: 8px;
  padding: 3px 6px;
  border-radius: 4px;
  color: white;
  background: rgb(0 0 0 / 68%);
  font-size: 9px;
}
.duration-badge {
  right: 8px;
}
.film-badge {
  top: 8px;
  bottom: auto;
  left: 8px;
  color: #111;
  background: #f4e24b;
  font-weight: 750;
}
.cover-play {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border: 0;
  color: white;
  background: rgb(0 0 0 / 22%);
  font: 11px var(--adc-font-family-sans);
  opacity: 0;
  cursor: pointer;
  transition:
    opacity 0.18s ease,
    background 0.18s ease;
}
.cover-play:hover,
.cover-play:focus-visible {
  background: rgb(0 0 0 / 46%);
  opacity: 1;
}
.work-card:hover .cover-play {
  opacity: 1;
}
.work-copy {
  display: flex;
  align-items: end;
  gap: 10px;
  padding: 12px;
}
.work-meta {
  min-width: 0;
  flex: 1;
}
.work-meta span {
  color: var(--muted);
  font-size: 9px;
}
.work-meta strong {
  display: block;
  margin-top: 3px;
  overflow: hidden;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.work-meta p {
  margin: 4px 0 0;
  overflow: hidden;
  color: var(--muted);
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.work-actions {
  display: flex;
  flex: none;
  gap: 6px;
}
.work-actions button {
  display: flex;
  align-items: center;
  gap: 5px;
  flex: none;
  height: 31px;
  padding: 0 9px;
  border: 1px solid var(--app-brand-hex);
  border-radius: var(--adc-radius-control);
  color: var(--app-brand-hex);
  background: transparent;
  font: 10px inherit;
  cursor: pointer;
}
.work-actions button:hover {
  color: white;
  background: var(--app-brand-hex);
}
.play-button {
  color: var(--ink) !important;
  border-color: var(--app-border-subtle) !important;
}
.play-button:hover {
  color: white !important;
  border-color: var(--app-brand-hex) !important;
}
:global(.film-preview-dialog .el-dialog__body) {
  padding-top: 8px;
  max-height: 82vh;
  overflow: auto;
}
:global(.film-preview-dialog .video) {
  width: 100%;
  max-width: 100%;
  max-height: min(70vh, 620px);
  border-radius: 6px;
}
.film-dialog-heading {
  display: grid;
  gap: 3px;
  text-align: left;
}
.film-dialog-heading span {
  color: var(--app-brand-hex);
  font-size: 10px;
  font-weight: 750;
}
.film-dialog-heading strong {
  font-size: 18px;
}
.film-dialog-heading small {
  color: var(--muted);
  font-size: 10px;
}
.spinning {
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
@media (max-width: 900px) {
  .work-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 640px) {
  .discovery-header {
    padding: 0 14px;
  }
  .project-links {
    display: none;
  }
  .creator {
    margin: 40px auto 52px;
  }
  .creator h1 {
    font-size: 28px;
  }
  .works-heading {
    align-items: stretch;
    flex-direction: column;
  }
  .search {
    box-sizing: border-box;
    width: 100%;
  }
  .work-grid {
    grid-template-columns: 1fr;
  }
  .cover-play {
    align-items: end;
    justify-content: flex-start;
    padding: 0 0 10px 10px;
    background: transparent;
    opacity: 1;
    font-size: 0;
  }
  .cover-play svg {
    width: 30px;
    height: 30px;
    padding: 8px;
    border-radius: 50%;
    background: rgb(0 0 0 / 68%);
  }
  .work-actions {
    flex-direction: column;
  }
  .works {
    width: min(100% - 24px, 520px);
  }
}
</style>
