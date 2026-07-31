<template>
  <button type="button" class="brand-logo" :aria-label="siteTitle" @click="$emit('click')">
    <img v-if="tenantLogo" :src="tenantLogo" class="brand-logo__image" :alt="siteTitle" />
    <img v-else-if="collapsed" :src="logoMark" class="brand-logo__mark" alt="" aria-hidden="true" />
    <span v-else class="brand-logo__wordmark">
      <span class="brand-logo__wordmark-inner">
        <img :src="logoMark" class="brand-logo__wordmark-mark" alt="" aria-hidden="true" />
        <span class="brand-logo__wordmark-text" :style="wordmarkStyle" aria-hidden="true" />
      </span>
    </span>
  </button>
</template>

<script lang="ts">
import logoMark from '@/assets/images/logos/acedata-mark.png';
import logoWordmarkMask from '@/assets/images/logos/acedata-wordmark-mask.png';
import { defineComponent } from 'vue';
import { isOfficial } from '@/utils/is';

export default defineComponent({
  props: {
    collapsed: {
      type: Boolean,
      default: false
    }
  },
  emits: ['click'],
  data() {
    return { logoMark };
  },
  computed: {
    siteTitle() {
      return this.$store.state.site?.title || 'AceData';
    },
    // Official hosts render the built-in wordmark (mask + currentColor) so it
    // flips with dark mode; white-label tenants keep their own raster logo.
    tenantLogo(): string {
      if (isOfficial()) return '';
      const site = this.$store.state.site;
      const fallback = 'https://platform.acedata.cloud/favicon.ico';
      if (this.collapsed) {
        return site?.favicon || site?.logo || fallback;
      }
      return site?.logo || site?.favicon || fallback;
    },
    wordmarkStyle() {
      return { '--logo-wordmark-mask': `url(${logoWordmarkMask})` };
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
    max-width: 132px;
    height: 40px;
    object-fit: contain;
    object-position: center;
    transition: height 0.2s ease;
  }

  &__mark {
    display: block;
    height: 28px;
    width: 28px;
    object-fit: contain;
  }

  &__wordmark {
    align-items: center;
    color: #555555;
    display: flex;
    justify-content: center;
    overflow: hidden;
  }

  &__wordmark-inner {
    height: 39.44px;
    position: relative;
    width: 119.2px;
  }

  &__wordmark-mark {
    height: 26.57px;
    left: 6.67px;
    object-fit: contain;
    position: absolute;
    top: 6.43px;
    width: 27.47px;
  }

  &__wordmark-text {
    background-color: currentColor;
    height: 19.02px;
    left: 35.73px;
    mask: var(--logo-wordmark-mask) center / 100% 100% no-repeat;
    position: absolute;
    top: 13.99px;
    width: 76.8px;
    -webkit-mask: var(--logo-wordmark-mask) center / 100% 100% no-repeat;
  }

  .collapsed & {
    &__image {
      height: 35px;
      max-width: 35px;
    }
  }
}

html.dark .brand-logo__wordmark {
  color: #ffffff;
}

@media only screen and (max-width: 768px) {
  .brand-logo__image {
    max-width: 116px;
    height: 38px;
  }
}
</style>
