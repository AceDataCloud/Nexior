<template>
  <layout>
    <template #config>
      <div class="flex flex-col h-full">
        <tab-switcher />
        <div class="flex-1 min-h-0">
          <model-config-panel @create="onCreate" />
        </div>
      </div>
    </template>
    <template #result>
      <model-list-panel :loading="loading" />
    </template>
  </layout>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Layout from '@/layouts/Hailuo.vue';
import ModelConfigPanel from '@/components/fish/ModelConfigPanel.vue';
import ModelListPanel from '@/components/fish/ModelListPanel.vue';
import TabSwitcher from '@/components/fish/TabSwitcher.vue';
import { fishOperator } from '@/operators';
import { ElMessage } from 'element-plus';
import { ERROR_CODE_USED_UP } from '@/constants';

interface IData {
  loading: boolean;
}

export default defineComponent({
  name: 'FishModelIndex',
  components: {
    ModelConfigPanel,
    Layout,
    ModelListPanel,
    TabSwitcher
  },
  inject: ['initialized'],
  data(): IData {
    return {
      loading: false
    };
  },
  computed: {
    credential() {
      return this.$store.state.fish?.credential;
    }
  },
  watch: {
    initialized: {
      async handler(newValue) {
        if (newValue) {
          await this.onGetVoices();
        }
      },
      immediate: true
    }
  },
  async mounted() {
    await this.onGetService();
  },
  methods: {
    async onGetService() {
      await this.$store.dispatch('fish/getService');
    },
    async onGetVoices() {
      await this.$store.dispatch('fish/getVoices');
    },
    async onCreate(payload: {
      title: string;
      voices: string;
      description?: string;
      visibility?: 'public' | 'unlist' | 'private';
      train_mode?: 'fast' | 'precise';
      texts?: string[];
      enhance_audio_quality?: boolean;
      generate_sample?: boolean;
    }) {
      const token = this.credential?.token;
      if (!token) {
        console.error('no token specified');
        return;
      }
      this.loading = true;
      ElMessage.info(this.$t('fish.message.creatingModel'));
      try {
        await fishOperator.createModel(payload, { token });
        ElMessage.success(this.$t('fish.message.createModelSuccess'));
        // Refresh the voice list so the new entry appears immediately.
        await this.onGetVoices();
      } catch (error: any) {
        const response = error?.response?.data;
        if (response?.error?.code === ERROR_CODE_USED_UP) {
          ElMessage.error(this.$t('fish.message.usedUp'));
        } else {
          ElMessage.error(response?.error?.message || this.$t('fish.message.createModelFailed'));
        }
      } finally {
        this.loading = false;
      }
    }
  }
});
</script>
