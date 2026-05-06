<template>
  <div class="field">
    <h2 class="title font-bold">{{ $t('veo.name.imageMask') }}</h2>
    <el-input v-model="value" class="value" type="text" :placeholder="$t('veo.placeholder.imageMask')" clearable />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElInput } from 'element-plus';

// Mask input. Accepts either a public HTTP(S) JPEG URL or a base64 string
// (with or without the data:image/jpeg;base64, prefix). The
// platform-service worker normalises both to base64 JPEG before
// forwarding upstream.
export default defineComponent({
  name: 'ImageMaskInput',
  components: { ElInput },
  computed: {
    value: {
      get() {
        return this.$store.state.veo?.config?.image_mask;
      },
      set(val: string) {
        this.$store.commit('veo/setConfig', {
          ...this.$store.state.veo.config,
          image_mask: val
        });
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.field {
  display: flex;
  flex-direction: row;
  align-items: center;

  .title {
    font-size: 14px;
    margin: 0;
    width: 30%;
  }
  .value {
    flex: 1;
  }
}
</style>
