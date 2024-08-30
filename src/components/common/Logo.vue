<template>
  <img :src="url" class="logo" @click="$emit('click')" />
</template>

<script lang="ts">
import { getCookie } from 'typescript-cookie';
import { BASE_HOST_HUB } from '@/constants';
import { isOfficial } from '@/utils';

export default {
  emits: ['click'],
  data() {
    return {
      url1: 'https://cdn.acedata.cloud/logo.png/thumb_450x_',
      url2: 'https://cdn.acedata.cloud/logo2.png/thumb_450x_',
      dark: getCookie('THEME') === 'dark',
      url: '',
      isOfficial: isOfficial(),
      interval: undefined as number | undefined
    };
  },
  watch: {
    dark() {
      this.updateUrl();
    }
  },
  mounted() {
    this.interval = window.setInterval(this.checkCookie, 500);
    this.updateUrl();
  },
  unmounted() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  },
  methods: {
    checkCookie() {
      this.dark = getCookie('THEME') === 'dark';
    },
    updateUrl() {
      if (this.isOfficial) {
        this.url = this.dark ? this.url2 : this.url1;
      } else {
        this.url = this.$store.state.site?.logo || '';
      }
    }
  }
};
</script>
