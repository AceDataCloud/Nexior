<template>
  <div class="field">
    <h2 class="title font-bold">{{ $t('veo.name.videoId') }}</h2>
    <el-input v-model="value" class="value" type="text" :placeholder="$t('veo.placeholder.videoId')" clearable />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElInput } from 'element-plus';

// video_id picker. The user can paste an ID directly here, or click
// one of the action buttons on a recent task's Preview to seed it
// automatically.
export default defineComponent({
  name: 'VideoIdInput',
  components: { ElInput },
  computed: {
    value: {
      get() {
        return this.$store.state.veo?.config?.video_id;
      },
      set(val: string) {
        this.$store.commit('veo/setConfig', {
          ...this.$store.state.veo.config,
          video_id: val
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
