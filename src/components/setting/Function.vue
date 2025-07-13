<template>
  <el-form :model="site" class="form" label-width="auto" style="max-width: 600px">
    <el-form-item
      v-for="(feature, featureIndex) in [
        'chatgpt',
        'grok',
        'deepseek',
        'midjourney',
        'qrart',
        'suno',
        'luma',
        'pika',
        'kling',
        'flux',
        'hailuo',
        'headshots'
      ]"
      :key="featureIndex"
      :label="$t('site.field.features' + feature.charAt(0).toUpperCase() + feature.slice(1))"
    >
      <div class="w-full">
        <el-switch
          :model-value="site.features[feature]?.enabled || false"
          inline-prompt
          :active-text="$t('site.button.enabled')"
          :inactive-text="$t('site.button.disabled')"
          @update:model-value="
            onSave({
              features: {
                ...site.features,
                [feature]: {
                  ...site.features[feature],
                  enabled: $event
                }
              }
            })
          "
        />
      </div>
      <span class="block tip w-full">
        {{ $t('site.message.features' + feature.charAt(0).toUpperCase() + feature.slice(1)) }}
      </span>
      <div v-if="feature === 'support'" v-show="site.features[feature]?.enabled">
        <el-form-item label="WeChat">
          <el-switch
            :model-value="site.features[feature]?.wechat?.enabled || false"
            inline-prompt
            :active-text="$t('site.button.enabled')"
            :inactive-text="$t('site.button.disabled')"
            @update:model-value="
              onSave({
                features: {
                  ...site.features,
                  [feature]: {
                    ...site.features[feature],
                    wechat: {
                      ...site.features[feature]?.wechat,
                      enabled: $event
                    }
                  }
                }
              })
            "
          ></el-switch>
        </el-form-item>
        <el-form-item v-show="site.features[feature]?.wechat?.enabled" :label="$t('site.field.qr')">
          <span class="block w-full">
            <el-image :src="site.features[feature]?.wechat?.qr" />
            <edit-image
              :model-value="site.features[feature]?.wechat?.qr"
              :title="$t('site.title.editQR')"
              :tip="$t('site.message.editQRTip')"
              @confirm="
                onSave({
                  features: {
                    ...site.features,
                    [feature]: {
                      ...site.features[feature],
                      wechat: {
                        ...site.features[feature]?.wechat,
                        qr: $event
                      }
                    }
                  }
                })
              "
            />
          </span>
        </el-form-item>
        <el-form-item label="Discord">
          <el-switch
            :model-value="site.features[feature]?.discord?.enabled || false"
            inline-prompt
            :active-text="$t('site.button.enabled')"
            :inactive-text="$t('site.button.disabled')"
            @update:model-value="
              onSave({
                features: {
                  ...site.features,
                  [feature]: {
                    ...site.features[feature],
                    discord: {
                      ...site.features[feature]?.discord,
                      enabled: $event
                    }
                  }
                }
              })
            "
          ></el-switch>
        </el-form-item>
        <el-form-item v-show="site.features[feature]?.discord?.enabled" :label="$t('site.field.url')">
          <span class="block w-full">
            {{ site.features[feature]?.discord?.url }}
            <edit-text
              :model-value="site.features[feature]?.discord?.url"
              :title="$t('site.title.editUrl')"
              :placeholder="$t('site.placeholder.editUrl')"
              @confirm="
                onSave({
                  features: {
                    ...site.features,
                    [feature]: {
                      ...site.features[feature],
                      discord: {
                        ...site.features[feature]?.discord,
                        url: $event
                      }
                    }
                  }
                })
              "
            />
          </span>
        </el-form-item>
      </div>
    </el-form-item>
  </el-form>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElRow, ElCol, ElCard, ElForm, ElFormItem, ElImage, ElDivider, ElSwitch } from 'element-plus';
import EditText from '@/components/site/EditText.vue';
import EditImage from '@/components/site/EditImage.vue';
import EditArray from '@/components/site/EditArray.vue';
import { siteOperator } from '@/operators';
import site from '@/router/site';

export default defineComponent({
  name: 'SiteIndex',
  components: {
    EditText,
    EditImage,
    ElImage,
    ElForm,
    ElSwitch,
    ElFormItem
  },
  data() {
    return {
      editing: {
        title: false
      }
    };
  },
  computed: {
    site() {
      return this.$store.getters.site;
    }
  },
  methods: {
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
.panel {
  padding: 30px;
  background-color: var(--el-bg-color-page);
  overflow-y: auto;
  h2.title {
    font-size: 26px;
    font-weight: bold;
    margin-bottom: 20px;
    color: var(--el-text-color-primary);
  }
  h4.title {
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 20px;
    color: var(--el-text-color-primary);
  }
  .form {
    .logo {
      max-width: 200px;
    }
    .tip {
      color: var(--el-text-color-secondary);
      font-size: 12px;
    }
  }
}
</style>
