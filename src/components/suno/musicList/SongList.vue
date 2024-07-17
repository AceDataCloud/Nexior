<template>
  <div class="mt-2">
    <div class="text-sm">
      <template v-for="song in songs.slice(0, pageSize * page)" :key="song.id">
        <song-list-item :song="song" show-ar-name show-al-name />
      </template>
    </div>
    <div v-if="songs.length > pageSize && !noMore" class="flex justify-center py-5">
      <el-button type="text" class="text-center w-full" @click="loadMore">加载更多</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ISunoAudio, ISunoAudioLyric } from '@/models';
import SongListItem from '@/components/suno/musicList/SongListItem.vue';
import { computed, ref } from 'vue';
import { ElImage, ElAlert, ElButton, ElScrollbar } from 'element-plus';
const props = defineProps<{
  songs: (ISunoAudio | ISunoAudioLyric)[];
}>();

const pageSize = ref(10);
const page = ref(1);

const noMore = computed(() => {
  return page.value - props.songs.length / pageSize.value >= 0;
});

const loadMore = () => {
  page.value = page.value + 1;
};
</script>
<style lang="scss"></style>
