<template>
  <div class="flex flex-col items-stretch h-20">
    <player-slider />
    <div class="flex grow px-5 items-center">
      <div class="flex-1">
        <player-song />
      </div>
      <div class="flex-1">
        <player-controller />
      </div>
      <div class="flex-1">
        <player-action />
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
