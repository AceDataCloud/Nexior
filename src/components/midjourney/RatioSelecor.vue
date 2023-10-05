<template>
  <div>
    <div v-for="(option, optionKey) in options" :key="optionKey" class="item">
      <div class="preview" :class="option.label">
        <div class="rect"></div>
      </div>
      <p>
        {{ option.label }}
      </p>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'RatioSelector',
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
  width: 30px;
  height: 50px;
  border: 2px solid red;

  .preview {
    width: 30px;
    height: 30px;
    border: 1px solid blue;
  }
}
</style>
