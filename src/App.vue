<template>
  <router-view />
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  mounted() {
    console.log('9999');
    this.$store.dispatch('getMe');
  }
});
</script>
