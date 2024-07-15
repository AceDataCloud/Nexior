<template>
  <div class="flex flex-col items-stretch h-20">
    <!-- 歌曲进度条 -->
    <PlayerSlider />
    <div class="flex grow px-5 items-center">
      <div class="flex-1">
        <PlayerSong />
      </div>
      <div class="flex-1">
        <PlayerController />
      </div>
      <div class="flex-1">
        <PlayerAction />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import PlayerSlider from './PlayerSlider.vue';
import PlayerSong from './PlayerSong.vue';
import PlayerAction from './PlayerAction.vue';
import PlayerController from './PlayerController.vue';
</script>
<style lang="scss"></style>
