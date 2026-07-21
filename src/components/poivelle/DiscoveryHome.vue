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
              loading="lazy"
              @error="hideFailedCover(work.id)"
            />
            <Film v-else :size="32" aria-hidden="true" />
            <span>{{ work.duration_seconds ? `${work.duration_seconds}s` : $t('poivelle.discovery.community') }}</span>
          </div>
          <div class="work-copy">
            <div class="work-meta">
              <span>{{ work.creator_name }}</span>
              <strong>{{ work.title }}</strong>
              <p>{{ work.description }}</p>
            </div>
            <button type="button" :disabled="bootstrapLoading || submitting" @click="copyWork(work)">
              <Copy :size="14" aria-hidden="true" /> {{ $t('poivelle.discovery.copy') }}
            </button>
          </div>
        </article>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useStore } from 'vuex';
import { ArrowUp, Building2, ChevronRight, Clapperboard, Copy, Film, LoaderCircle, Music2, Search } from '@lucide/vue';
import { ElMessage } from 'element-plus';
import { Status, type IPoivelleDiscoveryWork, type PoivelleDiscoveryCategory } from '@/models';
import { t } from '@/i18n';

const emit = defineEmits<{ 'open-studio': [] }>();
const store = useStore();
const state = computed(() => store.state.poivelle);
const projects = computed(() => state.value?.projects ?? []);
const works = computed<IPoivelleDiscoveryWork[]>(() => state.value?.discoveryWorks ?? []);
const prompt = ref('');
const query = ref('');
const submitting = ref(false);
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
const selectedWork = computed(() => works.value.find((item) => item.id === selectedWorkId.value) ?? works.value[0]);
const bootstrap = () => store.dispatch('poivelle/bootstrap', { loadProject: false });
const hideFailedCover = (workId: string) => {
  failedCoverIds.value = new Set([...failedCoverIds.value, workId]);
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
  } catch (error: any) {
    ElMessage.error(error?.message ?? t('poivelle.error.generic'));
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
.cover > span {
  position: absolute;
  right: 8px;
  bottom: 8px;
  padding: 3px 6px;
  border-radius: 4px;
  color: white;
  background: rgb(0 0 0 / 68%);
  font-size: 9px;
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
.work-copy > button {
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
.work-copy > button:hover {
  color: white;
  background: var(--app-brand-hex);
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
  .works {
    width: min(100% - 24px, 520px);
  }
}
</style>
