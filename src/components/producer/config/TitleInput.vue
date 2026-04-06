<template>
  <div class="field">
    <div class="flex items-center mb-1">
      <span class="text-sm font-bold">{{ $t('producer.name.title') }}</span>
      <info-icon :content="$t('producer.description.title')" />
    </div>
    <el-input v-model="title" :placeholder="$t('producer.placeholder.title')" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElInput } from 'element-plus';
import InfoIcon from '@/components/common/InfoIcon.vue';

export default defineComponent({
  name: 'TitleInput',
  components: {
    ElInput,
    InfoIcon
  },
  computed: {
    title: {
      get() {
        return this.$store.state.producer?.config?.title;
      },
      set(val: string) {
        this.$store.commit('producer/setConfig', {
          ...this.$store.state.producer?.config,
          title: val
        });
      }
    }
  }
});
</script>
