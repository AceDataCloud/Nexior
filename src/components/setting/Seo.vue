<template>
  <div class="settings-list">
    <section class="settings-item">
      <div class="settings-label">
        <p class="settings-title">{{ $t('site.field.description') }}</p>
        <p class="settings-tip">
          {{ $t('site.message.descriptionTip') }}
        </p>
      </div>
      <div class="settings-content">
        <span class="settings-value">{{ site.description }}</span>
        <edit-text
          :model-value="site.description"
          :title="$t('site.title.editDescription')"
          :placeholder="$t('site.placeholder.description')"
          @confirm="onSave({ description: $event })"
        />
      </div>
    </section>

    <section class="settings-item">
      <div class="settings-label">
        <p class="settings-title">{{ $t('site.field.keywords') }}</p>
        <p class="settings-tip">
          {{ $t('site.message.keywordsTip') }}
        </p>
      </div>
      <div class="settings-content">
        <span class="settings-value">{{ site.keywords?.join(', ') }}</span>
        <edit-array
          :model-value="site?.keywords || []"
          :title="$t('site.title.editKeywords')"
          :placeholder="$t('site.placeholder.keywords')"
          :tip="$t('site.message.keywordsTip2')"
          @confirm="onSave({ keywords: $event })"
        />
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import EditText from '@/components/site/EditText.vue';
import EditArray from '@/components/site/EditArray.vue';
import { siteOperator } from '@/operators';

export default defineComponent({
  name: 'SettingSeo',
  components: {
    EditText,
    EditArray
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
