<template>
  <button type="button" class="brand-logo" :aria-label="siteTitle" @click="$emit('click')">
    <img :src="url" class="brand-logo__image" :alt="siteTitle" />
  </button>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  emits: ['click'],
  computed: {
    siteTitle() {
      return this.$store.state.site?.title || 'AceData';
    },
    url() {
      return (
        this.$store.state.site?.logo || this.$store.state.site?.favicon || 'https://cdn.acedata.cloud/8c6ed0e068.png'
      );
    }
  }
});
</script>

<style lang="scss" scoped>
.brand-logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;

  &__image {
    display: block;
    width: auto;
    max-width: 44px;
    height: 44px;
    object-fit: contain;
    object-position: center;
    transition: height 0.2s ease;
  }

  .collapsed & {
    &__image {
      height: 28px;
      max-width: 28px;
    }
  }
}
</style>
