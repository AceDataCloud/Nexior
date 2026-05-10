<template>
  <div class="flex player-song">
    <img alt="" class="w-11 h-11 rounded" :src="audio?.image_url || OpticalDisk" />
    <div class="ml-2 text-xs flex flex-col justify-between">
      <div class="w-52 2xl:w-96 cursor-pointer truncate">
        <div class="flex">
          <span>{{ audio?.title || 'Music' }}</span>
          <span class="ml-2 text-dc">- {{ audio?.style || `SmallRuralDog` }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import OpticalDisk from '@/assets/images/disk.png';
import { computed, onBeforeUnmount, watch } from 'vue';
import { useStore } from 'vuex';

const store = useStore();
const audio = computed({
  get: () => store.state.suno.audio,
  set: (value) => store.commit('suno/setAudio', value)
});

// Track the live `<audio>` element + an AbortController scoping its event
// listeners outside the watcher, so we can release them when the URL
// changes (or the component unmounts). Without this, every `audio_url`
// swap leaked the previous Audio element AND its `loadedmetadata` /
// `timeupdate` listeners — old tracks kept ticking timeupdate handlers
// against a stale closure on every navigation.
let currentAudio: HTMLAudioElement | null = null;
let currentAbort: AbortController | null = null;

const teardown = () => {
  if (currentAudio) {
    try {
      currentAudio.pause();
    } catch {
      /* ignore — already detached */
    }
    // Detaching the source lets the browser GC the underlying decoder.
    currentAudio.src = '';
    currentAudio = null;
  }
  if (currentAbort) {
    currentAbort.abort();
    currentAbort = null;
  }
};

// watch audio change and play
watch(audio, (value, oldValue) => {
  // url changed — swap the underlying <audio> element
  if (value?.audio_url !== oldValue?.audio_url) {
    teardown();
    if (!value?.audio_url) {
      return;
    }
    const object = new Audio(value.audio_url);
    currentAudio = object;
    currentAbort = new AbortController();
    const { signal } = currentAbort;

    if (value.state === 'playing') {
      object.play().catch(() => {
        /* autoplay may be blocked — ignore */
      });
    } else {
      object.pause();
    }

    object.addEventListener(
      'loadedmetadata',
      () => {
        object.currentTime = 0;
      },
      { signal }
    );
    object.addEventListener(
      'timeupdate',
      () => {
        store.commit('suno/setAudio', {
          ...store.state.suno.audio,
          progress: object.currentTime
        });
      },
      { signal }
    );

    store.commit('suno/setAudio', {
      ...store.state.suno.audio,
      object: object
    });
  } else if (
    value?.progress !== oldValue?.progress &&
    value?.object &&
    Math.abs(value.progress - value.object.currentTime) > 2
  ) {
    value.object.currentTime = value.progress;
  } else if (value?.state !== oldValue?.state) {
    if (value?.object) {
      if (value.state === 'playing') {
        value.object.play().catch(() => {
          /* autoplay may be blocked — ignore */
        });
      } else {
        value.object.pause();
      }
    }
  }

  if (value?.volume !== oldValue?.volume) {
    if (value?.object) {
      value.object.volume = value.volume / 100;
    }
  }
});

onBeforeUnmount(teardown);
</script>
