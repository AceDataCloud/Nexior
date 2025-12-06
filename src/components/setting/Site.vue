<template>
  <div class="settings-list">
    <section class="settings-item">
      <div class="settings-label">
        <p class="settings-title">{{ $t('site.field.origin') }}</p>
        <p class="settings-tip">
          {{ $t('site.message.originTip') }}
        </p>
      </div>
      <div class="settings-content">
        <span class="settings-value">{{ site.origin }}</span>
      </div>
    </section>

    <section class="settings-item">
      <div class="settings-label">
        <p class="settings-title">{{ $t('site.field.title') }}</p>
        <p class="settings-tip">
          {{ $t('site.message.titleTip') }}
        </p>
      </div>
      <div class="settings-content">
        <span class="settings-value">{{ site.title }}</span>
        <edit-text
          :model-value="site.title"
          :title="$t('site.title.editTitle')"
          :placeholder="$t('site.placeholder.title')"
          @confirm="onSave({ title: $event })"
        />
      </div>
    </section>

    <section class="settings-item">
      <div class="settings-label">
        <p class="settings-title">{{ $t('site.field.logo') }}</p>
        <p class="settings-tip">
          {{ $t('site.message.logoTip') }}
        </p>
      </div>
      <div class="settings-content">
        <el-image :src="site.logo" class="settings-media" fit="contain" />
        <edit-image
          :model-value="site.logo"
          :title="$t('site.title.editLogo')"
          :tip="$t('site.message.editLogoTip')"
          @confirm="onSave({ logo: $event })"
        />
      </div>
    </section>

    <section class="settings-item">
      <div class="settings-label">
        <p class="settings-title">{{ $t('site.field.favicon') }}</p>
        <p class="settings-tip">
          {{ $t('site.message.faviconTip') }}
        </p>
      </div>
      <div class="settings-content">
        <el-image :src="site.favicon" class="settings-media favicon" fit="contain" />
        <edit-image
          :model-value="site.favicon"
          :title="$t('site.title.editFavicon')"
          :tip="$t('site.message.editFaviconTip')"
          @confirm="onSave({ favicon: $event })"
        />
      </div>
    </section>

    <section class="settings-item">
      <div class="settings-label">
        <p class="settings-title">{{ $t('site.field.admins') }}</p>
        <p class="settings-tip">
          {{ $t('site.message.adminsTip') }}
        </p>
      </div>
      <div class="settings-content">
        <span class="settings-value">{{ site.admins?.join(', ') }}</span>
        <edit-array
          :model-value="site?.admins || []"
          :title="$t('site.title.editAdmins')"
          :placeholder="$t('site.placeholder.admins')"
          :tip="$t('site.message.adminsTip2')"
          :min="1"
          :min-error-message="$t('site.message.atLeastOneAdmin')"
          @confirm="onSave({ admins: $event })"
        />
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElImage } from 'element-plus';
import EditText from '@/components/site/EditText.vue';
import EditImage from '@/components/site/EditImage.vue';
import EditArray from '@/components/site/EditArray.vue';
import { siteOperator } from '@/operators';

export default defineComponent({
  name: 'SiteSetting',
  components: {
    EditText,
    EditImage,
    EditArray,
    ElImage
  },
  computed: {
    site() {
      return this.$store.getters.site || {};
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
.settings-media {
  max-width: 120px;
  border-radius: 8px;
  background-color: var(--el-fill-color-light);
}

.favicon {
  max-width: 64px;
}
</style>
