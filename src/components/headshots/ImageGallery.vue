<template>
  <div class="image-gallery">
    <div v-for="(image, index) in images" :key="index" class="image-container">
      <img :src="image.image_url" alt="Image" class="cursor-zoom-in" @click="onPreview(image.image_url)" />
      <button v-if="image.image_url" class="view-button" @click.stop="viewImage(image.image_url)">
        {{ $t('headshots.button.viewImage') }}
      </button>
    </div>
    <el-image-viewer
      v-if="previewIndex !== null"
      :url-list="previewList"
      :initial-index="previewIndex"
      teleported
      hide-on-click-modal
      @close="previewIndex = null"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from 'vue';
import { ElImageViewer } from 'element-plus';
import { IHeadshotsTask } from '@/models';

export default defineComponent({
  name: 'ImageGallery',
  components: {
    ElImageViewer
  },
  props: {
    modelValue: {
      type: Object as () => IHeadshotsTask | undefined,
      required: true
    }
  },
  setup(props) {
    // Computed property to extract the first two images
    const images = computed(() => {
      return props.modelValue?.response?.data?.slice(0, 2) || [];
    });

    const previewIndex = ref<number | null>(null);
    const previewList = computed(() => images.value.map((image) => image.image_url).filter(Boolean) as string[]);

    // Open the lightbox at the clicked image's position within the filtered list.
    const onPreview = (url?: string) => {
      if (!url) {
        return;
      }
      const index = previewList.value.indexOf(url);
      if (index === -1) {
        return;
      }
      previewIndex.value = index;
    };

    // Method to handle the "View Image" button click
    const viewImage = (url: string) => {
      window.open(url, '_blank');
    };

    return {
      images,
      previewIndex,
      previewList,
      onPreview,
      viewImage
    };
  }
});
</script>

<style lang="scss" scoped>
.image-gallery {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.image-container {
  position: relative;
  width: 48%; /* Ensures two images fit side by side with some space */
  overflow: hidden;
  box-shadow: var(--app-shadow-sm);
  border-radius: 8px;

  img {
    width: 100%;
    height: auto;
    display: block;
    transition: transform 0.3s ease;
  }

  /* Zoom effect on hover */
  &:hover img {
    transform: scale(1.05);
  }

  .view-button {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: rgba(0, 0, 0, 0.6);
    color: #fff;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    cursor: pointer;
    opacity: 0;
    /* Hidden by default so center clicks reach the image (open the lightbox); only clickable on hover. */
    pointer-events: none;
    transition: opacity 0.3s ease;

    /* Optional: Add a slight delay for smoother appearance */
    transition-delay: 0.1s;

    &:hover {
      background-color: rgba(0, 0, 0, 0.8);
    }
  }

  /* Show the button on hover */
  &:hover .view-button {
    opacity: 1;
    pointer-events: auto;
  }
}
</style>
