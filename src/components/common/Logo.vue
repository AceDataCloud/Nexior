<template>
  <img :src="url" class="logo" @click="$emit('click')" />
</template>

<script lang="ts">
import { getCookie } from 'typescript-cookie';
import { defineComponent } from 'vue';

export default defineComponent({
  emits: ['click'],
  data() {
    return {
      url1: 'https://cdn.acedata.cloud/logo.png/thumb_450x_',
      url2: 'https://cdn.acedata.cloud/logo2.png/thumb_450x_'
    };
  },
  computed: {
    dark() {
      return getCookie('THEME') === 'dark';
    },
    url() {
      return this.dark ? this.url2 : this.url1;
    }
  }
});
</script>
