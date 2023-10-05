<template>
  <ratio-selector />
</template>

<script>
import { defineComponent } from 'vue';
import RatioSelector from './RatioSelecor.vue';

export default defineComponent({
  name: 'PresetPanel',
  components: {
    RatioSelector
  },
  data() {
    return {
      options: [
        {
          value: '1:1',
          label: '1:1'
        }
      ]
    };
  }
});
</script>

<style lang="scss">
.item {
  width: 60px;
  height: 100px;
}
</style>
