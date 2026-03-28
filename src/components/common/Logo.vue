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
      return this.$store.state.site?.logo || this.$store.state.site?.favicon;
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
    max-width: 180px;
    height: 42px;
    object-fit: contain;
    object-position: left center;
  }
}
</style>
