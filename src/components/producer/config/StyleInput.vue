<template>
  <div class="field">
    <div class="flex items-center justify-between mb-1">
      <div class="flex items-center">
        <span class="text-sm font-bold">{{ $t('producer.name.style') }}</span>
        <info-icon :content="$t('producer.description.style')" />
      </div>
    </div>
    <el-input v-model="style" :rows="2" type="textarea" :placeholder="$t('producer.placeholder.style')" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElInput } from 'element-plus';
import InfoIcon from '@/components/common/InfoIcon.vue';

export default defineComponent({
  name: 'StyleInput',
  components: {
    ElInput,
    InfoIcon
  },
  computed: {
    style: {
      get() {
        return this.$store.state.producer?.config?.style;
      },
      set(val: string) {
        this.$store.commit('producer/setConfig', {
          ...this.$store.state.producer?.config,
          style: val
        });
      }
    }
  }
});
</script>
