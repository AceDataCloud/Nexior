<template>
  <div class="field">
    <div class="flex items-center justify-between mb-1">
      <div class="flex items-center">
        <span class="text-sm font-bold">{{ $t('suno.name.style') }}</span>
        <info-icon :content="$t('suno.description.style')" />
      </div>
      <el-button size="small" :loading="optimizing" round @click="onOptimizeStyle">
        <font-awesome-icon v-if="!optimizing" icon="fa-solid fa-wand-magic-sparkles" class="mr-1" />
        {{ $t('suno.button.optimize_style') }}
      </el-button>
    </div>
    <el-input v-model="style" :rows="2" type="textarea" :placeholder="$t('suno.placeholder.style')" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElInput, ElButton, ElMessage } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import InfoIcon from '@/components/common/InfoIcon.vue';
import { sunoOperator } from '@/operators';

export default defineComponent({
  name: 'StyleInput',
  components: {
    ElInput,
    ElButton,
    FontAwesomeIcon,
    InfoIcon
  },
  data() {
    return {
      optimizing: false
    };
  },
  computed: {
    style: {
      get() {
        return this.$store.state.suno?.config?.style;
      },
      set(val: string) {
        this.$store.commit('suno/setConfig', {
          ...this.$store.state.suno?.config,
          style: val
        });
      }
    },
    credential() {
      return this.$store.state.suno?.credential;
    }
  },
  methods: {
    async onOptimizeStyle() {
      const token = this.credential?.token;
      if (!token || !this.style) return;

      this.optimizing = true;
      ElMessage.info(this.$t('suno.message.optimizingStyle'));
      try {
        const response = await sunoOperator.style({ prompt: this.style }, { token });
        const text = response.data?.text || (response.data as any)?.data?.text;
        if (text) {
          this.style = text;
          ElMessage.success(this.$t('suno.message.optimizeStyleSuccess'));
        }
      } catch {
        ElMessage.error(this.$t('suno.message.optimizeStyleFailed'));
      } finally {
        this.optimizing = false;
      }
    }
  }
});
</script>
