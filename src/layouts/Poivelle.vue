<template>
  <div class="poivelle-shell">
    <router-view class="poivelle-view" />
    <navigator class="poivelle-navigator" :direction="mobile ? 'row' : 'column'" />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import Navigator from '@/components/common/Navigator.vue';

const mobile = ref(typeof window !== 'undefined' && window.innerWidth < 768);
const updateViewport = () => {
  mobile.value = window.innerWidth < 768;
};

onMounted(() => window.addEventListener('resize', updateViewport));
onBeforeUnmount(() => window.removeEventListener('resize', updateViewport));
</script>

<style scoped>
.poivelle-shell {
  position: relative;
  display: flex;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: var(--app-content-bg);
}

.poivelle-view {
  flex: 1;
  min-width: 0;
  min-height: 0;
}

.poivelle-navigator {
  flex: none;
  order: -1;
}

@media (max-width: 767px) {
  .poivelle-shell {
    flex-direction: column;
  }

  .poivelle-navigator {
    order: 1;
  }
}
</style>
