<template>
  <div class="page">
    <div class="presets">
      <preset-panel />
    </div>
    <div class="main"></div>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import PresetPanel from '@/components/midjourney/PresetPanel.vue';

export default defineComponent({
  name: 'MidjourneyIndex',
  components: {
    PresetPanel
  }
});
</script>

<style lang="scss">
.page {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: row;
  .presets {
    width: 260px;
    height: 100%;
    background-color: var(--el-bg-color-page);
  }
  .main {
    flex: 1;
  }
}
</style>
