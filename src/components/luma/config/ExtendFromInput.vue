<template>
  <div class="field">
    <div class="box">
      <h2 class="title">{{ $t('luma.name.extend') }}</h2>
    </div>
    <div class="task">
      <div>
        <vue-plyr :options="options" class="video">
          <video controls crossorigin playsinline :data-poster="config?.thumbnail_url">
            <source size="1080" :src="config?.video_url" type="video/mp4" />
          </video>
        </vue-plyr>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
// @ts-ignore
import VuePlyr from '@skjnldsv/vue-plyr';
// @ts-ignore
import { ILumaTask } from '@/models';
import '@skjnldsv/vue-plyr/dist/vue-plyr.css';

export default defineComponent({
  name: 'ExtendFromInput',
  components: { VuePlyr },
  props: {
    modelValue: {
      type: Object as () => ILumaTask | undefined,
      required: true
    }
  },
  data() {
    return {
      options: { quality: { default: '1080p' } }
    };
  },
  computed: {
    config() {
      return this.$store.state.luma?.config;
    }
  }
});
</script>

<style lang="scss" scoped>
.field {
  .box {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    position: relative;
    .title {
      font-size: 14px;
      margin-bottom: 10px;
    }
    .input-wrapper {
      width: 150px;
      margin-left: 30px;
    }
  }
}
</style>
