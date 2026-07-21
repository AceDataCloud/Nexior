<template>
  <discovery-home v-if="view === 'discovery'" @open-studio="view = 'studio'" />
  <studio-workspace v-else @back-home="view = 'discovery'" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import DiscoveryHome from '@/components/poivelle/DiscoveryHome.vue';
import StudioWorkspace from '@/components/poivelle/StudioWorkspace.vue';

const view = ref<'discovery' | 'studio'>('discovery');
</script>
