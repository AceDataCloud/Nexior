<template>
  <div class="preview">
    <el-image
      v-if="modelValue?.image_url"
      v-loading="state === midjourneyImagineState.PENDING"
      :src="modelValue?.image_url"
      fit="fill"
      class="image"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElImage } from 'element-plus';
import { IMidjourneyImagineResponse, MidjourneyImagineState } from '@/operators';

export default defineComponent({
  name: 'ImaginePreview',
  components: {
    ElImage
  },
  props: {
    modelValue: {
      type: Object as () => IMidjourneyImagineResponse,
      default: undefined
    },
    state: {
      type: Object as () => MidjourneyImagineState,
      default: undefined
    }
  },
  data() {
    return {
      midjourneyImagineState: MidjourneyImagineState
    };
  }
});
</script>

<style lang="scss" scoped>
.preview {
  width: 100%;
  text-align: center;
  .image {
    width: 200px;
    height: 200px;
  }
}
</style>
