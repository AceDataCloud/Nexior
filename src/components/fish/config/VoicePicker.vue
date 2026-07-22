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
      remote
      :remote-method="onSearch"
      :loading="remoteLoading"
      :loading-text="$t('fish.message.searching')"
      :no-data-text="noDataText"
      @focus="onFocus"
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

      <el-option-group v-if="publicOptions.length" :label="$t('fish.group.publicVoices')">
        <el-option v-for="item in publicOptions" :key="item.value" :label="item.label" :value="item.value">
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
      publicVoices: [] as IFishVoiceModel[],
      remoteLoading: false,
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
    myVoices(): IFishVoiceModel[] {
      return this.$store.state.fish?.voices ?? [];
    },
    myOptions(): IVoiceOption[] {
      return this.myVoices.map(toOption).filter((o) => !!o.value);
    },
    // Remote mode delegates filtering to `remote-method`, so own voices would
    // otherwise stay unfiltered while the user types. Filter them locally by
    // label/description to keep the two groups in sync.
    filteredMyOptions(): IVoiceOption[] {
      const q = this.query.toLowerCase();
      if (!q) return this.myOptions;
      return this.myOptions.filter(
        (o) => o.label.toLowerCase().includes(q) || (o.description || '').toLowerCase().includes(q)
      );
    },
    publicOptions(): IVoiceOption[] {
      const mine = new Set(this.myOptions.map((o) => o.value));
      return this.publicVoices.map(toOption).filter((o) => !!o.value && !mine.has(o.value));
    },
    fallbackOption(): IVoiceOption | null {
      const id = this.value;
      if (!id) return null;
      const inList = this.myOptions.some((o) => o.value === id) || this.publicOptions.some((o) => o.value === id);
      if (inList) return null;
      return { value: id, label: this.labelCache[id] || id };
    },
    noDataText(): string {
      return this.remoteLoading ? this.$t('fish.message.searching') : this.$t('fish.message.searchVoiceHint');
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
        // Refetch the user's own voices when the credential arrives and we have
        // no snapshot yet — covers the picker mounting before the fish
        // credential is resolved, or the user just creating their first voice.
        if (!val?.token) return;
        const voices = this.$store.state.fish?.voices;
        if (voices === undefined || voices.length === 0) {
          this.$store.dispatch('fish/getVoices');
        }
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
    onFocus() {
      // Preload popular public voices so the dropdown is never empty before the
      // user types.
      if (!this.publicVoices.length && !this.remoteLoading) this.fetchPublic('');
    },
    onSearch(query: string) {
      this.query = (query || '').trim();
      // Invalidate any in-flight request immediately so a slower earlier
      // response (e.g. the focus preload) can't repopulate under a newer query.
      this.searchSeq++;
      if (this.searchTimer) clearTimeout(this.searchTimer);
      this.searchTimer = setTimeout(() => this.fetchPublic(this.query), 350);
    },
    async fetchPublic(title: string) {
      const token = this.credential?.token;
      if (!token) return;
      const seq = ++this.searchSeq;
      this.remoteLoading = true;
      try {
        const { data } = await fishOperator.listModels(
          { self: false, page_size: 30, page_number: 1, ...(title ? { title } : {}) },
          { token }
        );
        // Drop stale responses so a slow earlier query can't overwrite a newer one.
        if (seq !== this.searchSeq) return;
        this.publicVoices = data?.items ?? [];
      } catch (error) {
        if (seq === this.searchSeq) this.publicVoices = [];
        console.error('fish.searchPublicVoices failed', error);
      } finally {
        if (seq === this.searchSeq) this.remoteLoading = false;
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
