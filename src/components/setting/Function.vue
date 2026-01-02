<template>
  <div class="settings-list">
    <section v-for="feature in featureKeys" :key="feature" class="settings-item">
      <div class="settings-label">
        <p class="settings-title">{{ featureLabel(feature) }}</p>
        <p class="settings-tip">
          {{ featureTip(feature) }}
        </p>
      </div>
      <div class="settings-content">
        <el-switch
          :model-value="site.features?.[feature]?.enabled || false"
          inline-prompt
          :active-text="$t('site.button.enabled')"
          :inactive-text="$t('site.button.disabled')"
          @update:model-value="onToggleFeature(feature, $event as boolean)"
        />

        <div v-if="feature === 'support' && site.features?.[feature]?.enabled" class="settings-nested">
          <div class="settings-subitem">
            <span class="settings-sub-label">WeChat</span>
            <el-switch
              :model-value="site.features?.[feature]?.wechat?.enabled || false"
              inline-prompt
              :active-text="$t('site.button.enabled')"
              :inactive-text="$t('site.button.disabled')"
              @update:model-value="onToggleSupportChannel(feature, 'wechat', $event as boolean)"
            />
          </div>

          <div v-show="site.features?.[feature]?.wechat?.enabled" class="settings-subitem">
            <el-image :src="site.features?.[feature]?.wechat?.qr" class="settings-media" fit="contain" />
            <edit-image
              :model-value="site.features?.[feature]?.wechat?.qr"
              :title="$t('site.title.editQR')"
              :tip="$t('site.message.editQRTip')"
              @confirm="
                updateFeature(feature, {
                  wechat: {
                    ...(site.features?.[feature]?.wechat || {}),
                    qr: $event
                  }
                })
              "
            />
          </div>

          <div class="settings-subitem">
            <span class="settings-sub-label">Discord</span>
            <el-switch
              :model-value="site.features?.[feature]?.discord?.enabled || false"
              inline-prompt
              :active-text="$t('site.button.enabled')"
              :inactive-text="$t('site.button.disabled')"
              @update:model-value="onToggleSupportChannel(feature, 'discord', $event as boolean)"
            />
          </div>

          <div v-show="site.features?.[feature]?.discord?.enabled" class="settings-subitem">
            <span class="settings-value">{{ site.features?.[feature]?.discord?.url }}</span>
            <edit-text
              :model-value="site.features?.[feature]?.discord?.url"
              :title="$t('site.title.editUrl')"
              :placeholder="$t('site.placeholder.editUrl')"
              @confirm="
                updateFeature(feature, {
                  discord: {
                    ...(site.features?.[feature]?.discord || {}),
                    url: $event
                  }
                })
              "
            />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElImage, ElSwitch } from 'element-plus';
import EditText from '@/components/site/EditText.vue';
import EditImage from '@/components/site/EditImage.vue';
import { siteOperator } from '@/operators';

const FEATURE_KEYS = [
  'chatgpt',
  'grok',
  'gemini',
  'claude',
  'deepseek',
  'midjourney',
  'qrart',
  'suno',
  'luma',
  'pika',
  'kling',
  'veo',
  'sora',
  'pixverse',
  'flux',
  'hailuo',
  'headshots',
  'nanobanana',
  'seedream',
  'seedance'
];

export default defineComponent({
  name: 'FunctionSetting',
  components: {
    EditText,
    EditImage,
    ElImage,
    ElSwitch
  },
  computed: {
    site() {
      return this.$store.getters.site || { features: {} };
    },
    featureKeys() {
      return FEATURE_KEYS;
    }
  },
  methods: {
    featureLabel(feature: string) {
      return this.$t('site.field.features' + feature.charAt(0).toUpperCase() + feature.slice(1));
    },
    featureTip(feature: string) {
      return this.$t('site.message.features' + feature.charAt(0).toUpperCase() + feature.slice(1));
    },
    updateFeature(feature: string, updates: Record<string, unknown>) {
      this.onSave({
        features: {
          ...(this.site.features || {}),
          [feature]: {
            ...(this.site.features?.[feature] || {}),
            ...updates
          }
        }
      });
    },
    onToggleFeature(feature: string, enabled: boolean) {
      this.updateFeature(feature, { enabled });
    },
    onToggleSupportChannel(feature: string, channel: 'wechat' | 'discord', enabled: boolean) {
      this.updateFeature(feature, {
        [channel]: {
          ...(this.site.features?.[feature]?.[channel] || {}),
          enabled
        }
      });
    },
    onSave(data: any) {
      const payload = {
        ...this.site,
        ...data
      };
      siteOperator.update(this.site?.id, payload).then(() => {
        console.debug('getSite for id', this.site?.id);
        this.$store.dispatch('getSite');
      });
    }
  }
});
</script>

<style lang="scss" scoped>
.settings-nested {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
  width: 100%;
}

.settings-subitem {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
}

.settings-sub-label {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.settings-media {
  max-width: 120px;
  border-radius: 8px;
  background-color: var(--el-fill-color-light);
}

@media (max-width: 640px) {
  .settings-nested {
    align-items: flex-start;
  }

  .settings-subitem {
    align-items: flex-start;
  }
}
</style>
