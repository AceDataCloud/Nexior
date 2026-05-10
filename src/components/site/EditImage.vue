<template>
  <image-cropper
    v-model="editing"
    :title="title"
    :aspect-ratio="aspectRatio"
    :output-width="outputWidth"
    :format-hint="tip"
    shape="rectangle"
    @uploaded="onUploaded"
  />
  <span class="edit" @click="editing = true">
    <el-icon class="icon">
      <edit />
    </el-icon>
  </span>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElIcon } from 'element-plus';
import { Edit } from '@element-plus/icons-vue';
import ImageCropper from '@/components/common/ImageCropper.vue';

export default defineComponent({
  name: 'EditImage',
  components: {
    ElIcon,
    Edit,
    ImageCropper
  },
  props: {
    modelValue: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    tip: {
      type: String,
      required: true
    },
    /**
     * Recommended display width of the field in px (e.g. 200 for the site
     * logo, 32 for the favicon). Used together with `height` to derive the
     * crop frame's aspect ratio so the user cannot save an image at a wrong
     * shape (e.g. a wide banner into the favicon slot).
     */
    width: {
      type: Number,
      default: 200
    },
    height: {
      type: Number,
      default: 200
    }
  },
  emits: ['confirm', 'cancel'],
  data() {
    return {
      editing: false
    };
  },
  computed: {
    aspectRatio(): number {
      return this.width / this.height;
    },
    /**
     * Output canvas width. We keep at least 512px on the longer edge so the
     * uploaded asset remains crisp on hi-DPI screens, even when the on-page
     * display size is small (e.g. a 32x32 favicon → 512x512 output). Encoding
     * (PNG vs JPEG) is decided in ImageCropper based on the source mime so
     * transparent favicons / logos round-trip without a black background.
     */
    outputWidth(): number {
      const longest = Math.max(this.width, this.height);
      const scale = Math.max(1, Math.ceil(512 / longest));
      return this.width * scale;
    }
  },
  methods: {
    onUploaded(url: string) {
      this.$emit('confirm', url);
    }
  }
});
</script>

<style lang="scss" scoped>
.edit {
  cursor: pointer;
  margin-left: 5px;
  position: relative;
  top: 2px;
  .icon {
    font-size: 14px;
  }
}
</style>
