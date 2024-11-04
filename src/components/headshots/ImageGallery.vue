<template>
  <div class="image-gallery">
    <div v-for="(image, index) in images" :key="index" class="image-container">
      <img :src="image.image_url" alt="Image" />
      <button class="view-button" @click="viewImage(image.image_url)">{{ $t('headshots.button.viewImage') }}</button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import { IHeadshotsTask } from '@/models';
interface IDataItem {
  image_url: string;
  // Add other properties if necessary
}

interface IResponse {
  data: IDataItem[];
}

export default defineComponent({
  name: 'ImageGallery',
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

    // Method to handle the "View Image" button click
    const viewImage = (url: string) => {
      window.open(url, '_blank');
    };

    return {
      images,
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
  border: 1px solid #ddd;
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
  }
}
</style>
