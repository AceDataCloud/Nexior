<template>
  <layout>
    <template #chatdoc> Setting </template>
  </layout>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Layout from '@/layouts/Chatdoc.vue';

export default defineComponent({
  name: 'ChatdocSetting',
  components: {
    Layout
  },
  data() {
    return {};
  },
  async mounted() {},
  methods: {}
});
</script>
