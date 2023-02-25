<template>
  <div class="title">
    {{ proxy?.title }}
  </div>
  <div class="url">
    <span v-if="proxy?.endpoint" class="endpoint">{{ proxy?.endpoint }}</span>
  </div>
  <div class="introduction">
    <p>{{ proxy?.introduction }}</p>
  </div>
</template>

<script lang="ts">
import { IProxy } from '@/operators';
import { defineComponent } from 'vue';
import urlJoin from 'url-join';

export default defineComponent({
  name: 'ProxyInfo',
  components: {},
  props: {
    proxy: {
      type: Object as () => IProxy,
      required: true
    }
  },
  methods: {
    urlJoin
  }
});
</script>

<style lang="scss" scoped>
.title {
  font-size: 26px;
  font-weight: 500;
  line-height: 1.2;
  margin-bottom: 10px;
}
.url {
  margin-bottom: 10px;
  .method {
    border-radius: 10px;
    padding: 1px 0px;
    font-size: 10px;
    transform: scale(0.8);
    transform-origin: left;
  }
  .endpoint {
    font-size: 12px;
  }
}
.introduction {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 10px;
}
</style>
