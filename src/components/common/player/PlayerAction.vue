<template>
  <div class="flex justify-end items-center gap-x-2.5">
    <span class="text-xs"> {{ useFormatDuring(progress) }} / {{ useFormatDuring(duration) }} </span>
  </div>
</template>

<script setup lang="ts">
import { useFormatDuring } from '@/utils/number';
import { useAudioState } from './useAudioState';

const { field } = useAudioState();
const progress = field<number>('progress');
const duration = field<number>('duration');
</script>
