<template>
  <div class="field">
    <h2 class="title">{{ $t('luma.name.startImageUrl') }}</h2>
    <el-input v-model="value" class="value" :placeholder="$t('luma.placeholder.startImageUrl')" />
    <info-icon :content="$t('luma.description.startImageUrl')" class="info" />
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { ElInput } from 'element-plus';
import InfoIcon from '@/components/common/InfoIcon.vue';
export default defineComponent({
  name: 'StartImageUrlInput',
  components: {
    ElInput,
    InfoIcon
  },
  data() {
    return {};
  },
  computed: {
    value: {
      get() {
        return this.$store.state.luma?.config?.start_image_url;
      },
      set(val) {
        console.debug('set start_image_url', val);
        this.$store.commit('luma/setConfig', {
          ...this.$store.state.luma?.config,
          start_image_url: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = undefined;
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
