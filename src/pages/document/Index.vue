<template>
  <div class="center">
    <h2>{{ $t('common.title.documentIntroduction') }}</h2>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  components: {},
  data() {},
  computed: {},
  mounted() {}
});
</script>

<style lang="scss" scoped>
.center {
  float: left;
  width: calc(100% - 760px);
  height: 100%;
  padding: 30px;
}

.right {
  float: left;
  width: 480px;
  height: 100%;
  box-shadow: -1px 0 0 #eee;
}
</style>
