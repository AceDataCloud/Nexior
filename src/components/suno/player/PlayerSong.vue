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
import { OpticalDisk } from '@/assets/img';
import { computed, watch } from 'vue';
import { useStore } from 'vuex';

const store = useStore();
const audio = computed({
  get: () => store.state.suno.audio,
  set: (value) => store.commit('suno/setAudio', value)
});

// watch audio change and play
watch(audio, (value, oldValue) => {
  // url changed
  if (value?.audio_url !== oldValue?.audio_url) {
    console.log('audio changed', value);
    if (value.object) {
      console.log('111', value.object);
      // delete old object
      value.object.pause();
      delete value.object;
    }
    const object = new Audio(value.audio_url);
    if (value.state === 'playing') {
      object.play();
    } else {
      object.pause();
    }

    // listen to the time change of audio
    object.addEventListener('loadedmetadata', () => {
      object.currentTime = 0;
      object.addEventListener('timeupdate', () => {
        store.commit('suno/setAudio', {
          ...store.state.suno.audio,
          progress: object.currentTime
        });
      });
    });

    store.commit('suno/setAudio', {
      ...store.state.suno.audio,
      object: object
    });
  } else if (value?.progress !== oldValue?.progress && Math.abs(value.progress - value.object.currentTime) > 2) {
    console.log('progress changed', value.progress);
    const audio = store.state.suno.audio;
    if (audio.object) {
      audio.object.currentTime = audio.progress;
    }
  } else if (value?.state !== oldValue?.state) {
    console.log('state changed', value.state);
    if (value.object) {
      if (value.state === 'playing') {
        value.object.play();
      } else {
        value.object.pause();
      }
    }
  }

  if (value?.volume !== oldValue?.volume) {
    console.log('volume changed', value.volume);
    if (value.object) {
      value.object.volume = value.volume / 100;
    }
  }
});
</script>
