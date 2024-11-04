<template>
  <el-row class="panel">
    <el-col :span="24">
      <el-row>
        <el-col :span="24">
          <h2 class="title">{{ $t('common.title.site') }}</h2>
        </el-col>
      </el-row>
      <el-row :gutter="15">
        <el-col :md="12" :xs="24">
          <el-card shadow="hover" class="mb-4">
            <h4 class="title">
              {{ $t('site.title.basicConfig') }}
            </h4>
            <el-divider />
            <el-form :model="site" class="form" label-width="auto" style="max-width: 600px">
              <el-form-item :label="$t('site.field.origin')">
                <span class="block w-full">{{ site.origin }}</span>
                <span class="block tip">
                  {{ $t('site.message.originTip') }}
                </span>
              </el-form-item>
              <el-form-item :label="$t('site.field.title')">
                <span class="block w-full">
                  {{ site.title }}
                  <edit-text
                    :model-value="site.title"
                    :title="$t('site.title.editTitle')"
                    :placeholder="$t('site.placeholder.title')"
                    @confirm="onSave({ title: $event })"
                  />
                </span>
                <span class="block tip">
                  {{ $t('site.message.titleTip') }}
                </span>
              </el-form-item>
              <el-form-item :label="$t('site.field.logo')">
                <span class="block w-full">
                  <el-image :src="site.logo" class="logo" />
                  <edit-image
                    :model-value="site.logo"
                    :title="$t('site.title.editLogo')"
                    :tip="$t('site.message.editLogoTip')"
                    @confirm="onSave({ logo: $event })"
                  />
                </span>
                <span class="block tip">
                  {{ $t('site.message.logoTip') }}
                </span>
              </el-form-item>
              <el-form-item :label="$t('site.field.favicon')">
                <span class="block w-full">
                  <el-image :src="site.favicon" class="favicon" />
                  <edit-image
                    :model-value="site.favicon"
                    :title="$t('site.title.editFavicon')"
                    :tip="$t('site.message.editFaviconTip')"
                    @confirm="onSave({ favicon: $event })"
                  />
                </span>
                <span class="block tip">
                  {{ $t('site.message.faviconTip') }}
                </span>
              </el-form-item>
              <el-divider border-style="dashed" />
              <el-form-item :label="$t('site.field.admins')">
                <span class="block w-full">
                  {{ site.admins?.join(', ') }}
                  <edit-array
                    :model-value="site?.admins || []"
                    :title="$t('site.title.editAdmins')"
                    :placeholder="$t('site.placeholder.admins')"
                    :tip="$t('site.message.adminsTip2')"
                    :min="1"
                    :min-error-message="$t('site.message.atLeastOneAdmin')"
                    @confirm="onSave({ admins: $event })"
                  />
                </span>
                <span class="block tip">
                  {{ $t('site.message.adminsTip') }}
                </span>
              </el-form-item>
            </el-form>
          </el-card>
          <el-card shadow="hover">
            <h4 class="title">
              {{ $t('site.title.seoConfig') }}
            </h4>
            <el-divider />
            <el-form :model="site" class="form" label-width="auto" style="max-width: 600px">
              <el-form-item :label="$t('site.field.description')">
                <span class="block w-full">
                  {{ site.description }}
                  <edit-text
                    :model-value="site.description"
                    :title="$t('site.title.editDescription')"
                    :placeholder="$t('site.placeholder.description')"
                    @confirm="onSave({ description: $event })"
                  />
                </span>
                <span class="block tip">
                  {{ $t('site.message.descriptionTip') }}
                </span>
              </el-form-item>
              <el-form-item :label="$t('site.field.keywords')">
                <span class="block w-full">
                  {{ site.keywords?.join(', ') }}
                  <edit-array
                    :model-value="site?.keywords || []"
                    :title="$t('site.title.editKeywords')"
                    :placeholder="$t('site.placeholder.keywords')"
                    :tip="$t('site.message.keywordsTip2')"
                    @confirm="onSave({ keywords: $event })"
                  />
                </span>
                <span class="block tip">
                  {{ $t('site.message.keywordsTip') }}
                </span>
              </el-form-item>
            </el-form>
          </el-card>
        </el-col>
        <el-col :md="12" :xs="24">
          <el-card shadow="hover" class="mb-4">
            <h4 class="title">
              {{ $t('site.title.distributionConfig') }}
            </h4>
            <el-divider />
            <el-form :model="site" class="form" label-width="auto" style="max-width: 600px">
              <el-form-item :label="$t('site.field.distributionDefaultInviterId')">
                {{ site.distribution?.default_inviter_id }}
                <edit-text
                  :model-value="site.distribution?.default_inviter_id"
                  :title="$t('site.title.editDistributionDefaultInviterId')"
                  :placeholder="$t('site.placeholder.editDistributionDefaultInviterId')"
                  @confirm="
                    onSave({
                      distribution: {
                        ...site.distribution,
                        default_inviter_id: $event
                      }
                    })
                  "
                />
                <span class="block tip">
                  {{ $t('site.message.distributionDefaultInviterIdTip') }}
                </span>
              </el-form-item>
              <el-form-item :label="$t('site.field.distributionForceInviterId')">
                {{ site.distribution?.force_inviter_id }}
                <edit-text
                  :model-value="site.distribution?.force_inviter_id"
                  :title="$t('site.title.editDistributionForceInviterId')"
                  :placeholder="$t('site.placeholder.editDistributionForceInviterId')"
                  @confirm="
                    onSave({
                      distribution: {
                        ...site.distribution,
                        force_inviter_id: $event
                      }
                    })
                  "
                />
                <span class="block tip">
                  {{ $t('site.message.distributionForceInviterIdTip') }}
                </span>
              </el-form-item>
            </el-form>
          </el-card>
          <el-card shadow="hover">
            <h4 class="title">
              {{ $t('site.title.featuresConfig') }}
            </h4>
            <el-divider />
            <el-form :model="site" class="form" label-width="auto" style="max-width: 600px">
              <el-form-item
                v-for="(feature, featureIndex) in [
                  'chat',
                  'midjourney',
                  'qrart',
                  'suno',
                  'luma',
                  'headshots',
                  'support'
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
          </el-card>
        </el-col>
      </el-row>
    </el-col>
  </el-row>
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
    EditArray,
    ElDivider,
    ElRow,
    ElImage,
    ElCol,
    ElCard,
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
