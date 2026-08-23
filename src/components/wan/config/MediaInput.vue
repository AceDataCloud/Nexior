<template>
  <div class="field">
    <div class="flex items-center mb-2">
      <span class="text-sm font-bold">{{ $t('wan.name.media') }}</span>
    </div>
    <el-input v-model="value" type="textarea" :rows="5" :placeholder="$t('wan.placeholder.media')" />
    <p class="text-xs mt-1 text-[var(--el-text-color-secondary)]">{{ $t('wan.description.media') }}</p>
  </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue';
import { ElInput } from 'element-plus';
export default defineComponent({
  name: 'WanMediaInput',
  components: { ElInput },
  computed: {
    value: {
      get(): string {
        return this.$store.state.wan?.config?.media_text || '';
      },
      set(media_text: string) {
        this.$store.commit('wan/setConfig', { ...this.$store.state.wan?.config, media_text });
      }
    }
  }
});
</script>
