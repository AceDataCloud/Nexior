<template>
  <div class="field">
    <h2 class="title font-bold">{{ $t('fish.name.voice') }}</h2>
    <el-select
      v-model="value"
      class="value"
      popper-class="fish-voice-popper"
      :placeholder="$t('fish.placeholder.voice')"
      clearable
      filterable
      :filter-method="onFilter"
      :loading="remoteLoading"
      :loading-text="$t('fish.message.searching')"
      :no-data-text="noDataText"
      @visible-change="onVisibleChange"
    >
      <!-- Keep the currently-selected voice renderable even when it is not in
           the freshly-fetched result set (e.g. a public voice picked earlier). -->
      <el-option
        v-if="fallbackOption"
        :key="fallbackOption.value"
        :label="fallbackOption.label"
        :value="fallbackOption.value"
      />

      <el-option-group v-if="filteredMyOptions.length" :label="$t('fish.title.myVoices')">
        <el-option v-for="item in filteredMyOptions" :key="item.value" :label="item.label" :value="item.value">
          <voice-option
            :option="item"
            :playing="playingId === item.value"
            :loading="loadingId === item.value"
            @preview="togglePreview"
          />
        </el-option>
      </el-option-group>

      <el-option-group v-if="filteredPublicOptions.length" :label="$t('fish.group.publicVoices')">
        <el-option v-for="item in filteredPublicOptions" :key="item.value" :label="item.label" :value="item.value">
          <voice-option
            :option="item"
            :playing="playingId === item.value"
            :loading="loadingId === item.value"
            @preview="togglePreview"
          />
        </el-option>
      </el-option-group>
    </el-select>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSelect, ElOption, ElOptionGroup } from 'element-plus';
import { IFishVoiceModel } from '@/models';
import { fishOperator } from '@/operators';
import VoiceOption from './VoiceOption.vue';

interface IVoiceOption {
  value: string;
  label: string;
  description?: string;
  audio?: string;
}

// Resolve fish-audio's canonical reference id, surfaced under `id`, `_id`
// (Mongo) or `reference_id` depending on which shape the proxy forwards.
const resolveId = (m: IFishVoiceModel & { _id?: string }): string => (m.id || m._id || m.reference_id || '').toString();

const toOption = (m: IFishVoiceModel): IVoiceOption => {
  const id = resolveId(m as IFishVoiceModel & { _id?: string });
  return {
    value: id,
    label: m.title || id,
    description: m.description,
    audio: m.samples?.[0]?.audio
  };
};

export default defineComponent({
  name: 'FishVoicePicker',
  components: {
    ElSelect,
    ElOption,
    ElOptionGroup,
    VoiceOption
  },
  data() {
    return {
      // Stable set of popular public voices loaded once with an empty query;
      // never overwritten by searches, so clearing the query restores it.
      popularVoices: [] as IFishVoiceModel[],
      // Transient server results for the current non-empty query.
      searchVoices: [] as IFishVoiceModel[],
      popularLoading: false,
      searchLoading: false,
      preloaded: false,
      query: '',
      playingId: null as string | null,
      loadingId: null as string | null,
      // Remember labels for every voice we have ever rendered so a selected
      // public voice keeps its name after the result set changes.
      labelCache: {} as Record<string, string>,
      previewAudio: null as HTMLAudioElement | null,
      searchTimer: null as ReturnType<typeof setTimeout> | null,
      searchSeq: 0
    };
  },
  computed: {
    remoteLoading(): boolean {
      return this.popularLoading || this.searchLoading;
    },
    myVoices(): IFishVoiceModel[] {
      return this.$store.state.fish?.voices ?? [];
    },
    myOptions(): IVoiceOption[] {
      return this.myVoices.map(toOption).filter((o) => !!o.value);
    },
    // While a query is active show the server's search results; otherwise show
    // the stable popular set. Server results are already title-filtered, so we
    // render them as-is; the popular set is narrowed locally for instant feel.
    publicPool(): { voices: IFishVoiceModel[]; isSearch: boolean } {
      if (this.query && (this.searchVoices.length || this.searchLoading)) {
        return { voices: this.searchVoices, isSearch: true };
      }
      return { voices: this.popularVoices, isSearch: false };
    },
    publicOptions(): IVoiceOption[] {
      const mine = new Set(this.myOptions.map((o) => o.value));
      return this.publicPool.voices.map(toOption).filter((o) => !!o.value && !mine.has(o.value));
    },
    // Local, instant filtering (no `remote` mode) so the dropdown is populated
    // the moment it opens and narrows as the user types — a debounced server
    // search still runs in the background to reach beyond the loaded page.
    filteredMyOptions(): IVoiceOption[] {
      return this.applyQuery(this.myOptions);
    },
    filteredPublicOptions(): IVoiceOption[] {
      // Don't re-narrow server search results — the API already matched the
      // query and a stricter local substring test could hide valid hits.
      return this.publicPool.isSearch ? this.publicOptions : this.applyQuery(this.publicOptions);
    },
    fallbackOption(): IVoiceOption | null {
      const id = this.value;
      if (!id) return null;
      const inList = this.myOptions.some((o) => o.value === id) || this.publicOptions.some((o) => o.value === id);
      if (inList) return null;
      return { value: id, label: this.labelCache[id] || id };
    },
    noDataText(): string {
      if (this.remoteLoading) return this.$t('fish.message.searching');
      if (!this.credential?.token) return this.$t('fish.message.noVoices');
      return this.$t('fish.message.searchVoiceHint');
    },
    credential() {
      return this.$store.state.fish?.credential;
    },
    value: {
      get(): string | undefined {
        return this.$store.state.fish?.config?.reference_id;
      },
      set(val: string | undefined) {
        this.$store.commit('fish/setConfig', {
          ...this.$store.state.fish?.config,
          reference_id: val || undefined
        });
      }
    }
  },
  watch: {
    myOptions: {
      immediate: true,
      handler(opts: IVoiceOption[]) {
        this.cacheLabels(opts);
      }
    },
    publicOptions(opts: IVoiceOption[]) {
      this.cacheLabels(opts);
    },
    credential: {
      immediate: true,
      handler(val) {
        if (!val?.token) return;
        // Refetch the user's own voices when the credential arrives and we have
        // no snapshot yet — covers the picker mounting before the fish
        // credential is resolved, or the user just creating their first voice.
        const voices = this.$store.state.fish?.voices;
        if (voices === undefined || voices.length === 0) {
          this.$store.dispatch('fish/getVoices');
        }
        // Eager-load popular public voices so the dropdown already has content
        // the first time it opens — no focus-then-wait dead feeling.
        if (!this.preloaded) this.fetchPopular();
      }
    }
  },
  beforeUnmount() {
    this.stopPreview();
    if (this.searchTimer) clearTimeout(this.searchTimer);
  },
  methods: {
    cacheLabels(opts: IVoiceOption[]) {
      for (const o of opts) this.labelCache[o.value] = o.label;
    },
    applyQuery(opts: IVoiceOption[]): IVoiceOption[] {
      const q = this.query.toLowerCase();
      if (!q) return opts;
      return opts.filter((o) => o.label.toLowerCase().includes(q) || (o.description || '').toLowerCase().includes(q));
    },
    onVisibleChange(open: boolean) {
      if (open && !this.preloaded && !this.popularLoading) this.fetchPopular();
    },
    onFilter(query: string) {
      this.query = (query || '').trim();
      // Local filtering already narrowed the popular set instantly; also pull
      // matching voices from the server (debounced) to reach beyond page 1.
      if (this.searchTimer) clearTimeout(this.searchTimer);
      if (!this.query) {
        // Cleared the box → drop stale search results so the popular set shows.
        this.searchSeq++;
        this.searchVoices = [];
        this.searchLoading = false;
        return;
      }
      this.searchTimer = setTimeout(() => this.fetchSearch(this.query), 350);
    },
    // Load the stable popular set once. Its own in-flight flag never collides
    // with search seq, so a concurrent search can't stop `preloaded` latching.
    async fetchPopular() {
      const token = this.credential?.token;
      if (!token || this.popularLoading) return;
      this.popularLoading = true;
      try {
        const { data } = await fishOperator.listModels({ self: false, page_size: 30, page_number: 1 }, { token });
        this.popularVoices = data?.items ?? [];
        this.preloaded = true;
      } catch (error) {
        console.error('fish.loadPopularVoices failed', error);
      } finally {
        this.popularLoading = false;
      }
    },
    async fetchSearch(title: string) {
      const token = this.credential?.token;
      if (!token) return;
      const seq = ++this.searchSeq;
      this.searchLoading = true;
      try {
        const { data } = await fishOperator.listModels(
          { self: false, page_size: 30, page_number: 1, title },
          { token }
        );
        if (seq !== this.searchSeq) return;
        this.searchVoices = data?.items ?? [];
      } catch (error) {
        if (seq === this.searchSeq) this.searchVoices = [];
        console.error('fish.searchPublicVoices failed', error);
      } finally {
        if (seq === this.searchSeq) this.searchLoading = false;
      }
    },
    togglePreview(option: IVoiceOption) {
      if (!option.audio) return;
      // Second click on the currently playing/loading clip → stop.
      if (this.playingId === option.value || this.loadingId === option.value) {
        this.stopPreview();
        return;
      }
      this.stopPreview();
      const audio = new Audio(option.audio);
      // Scope handlers to THIS instance: a stale callback from a previously
      // stopped clip must not tear down the clip the user just started.
      const onPlaying = () => {
        if (this.previewAudio !== audio) return;
        this.loadingId = null;
        this.playingId = option.value;
      };
      const onEnd = () => {
        if (this.previewAudio === audio) this.stopPreview();
      };
      audio.addEventListener('playing', onPlaying);
      audio.addEventListener('ended', onEnd);
      audio.addEventListener('error', onEnd);
      this.previewAudio = audio;
      // Show a spinner on the button until the (often slow) R2 clip buffers.
      this.loadingId = option.value;
      this.playingId = null;
      audio.play().catch(() => {
        if (this.previewAudio === audio) this.stopPreview();
      });
    },
    stopPreview() {
      if (this.previewAudio) {
        this.previewAudio.pause();
        this.previewAudio.src = '';
        this.previewAudio = null;
      }
      this.playingId = null;
      this.loadingId = null;
    }
  }
});
</script>

<style lang="scss" scoped>
.field {
  display: flex;
  flex-direction: row;
  align-items: center;

  .title {
    font-size: 14px;
    margin: 0;
    width: 30%;
  }
  .value {
    flex: 1;
  }
}
</style>

<!-- The dropdown popper is teleported to <body>, so it must be styled
     un-scoped. Cap its width (fish descriptions are long) and let each row
     grow to fit a two-line description instead of the default 34px. -->
<style lang="scss">
.fish-voice-popper {
  max-width: 420px;

  .el-select-dropdown__item {
    height: auto;
    min-height: 34px;
    line-height: 1.35;
    padding-top: 6px;
    padding-bottom: 6px;
  }
}
</style>
