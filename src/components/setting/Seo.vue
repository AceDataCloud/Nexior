<template>
  <div class="settings-list">
    <section-notice tone="admin" :text="$t('common.settings.adminOnlyHint')" />
    <section class="settings-item">
      <div class="settings-label">
        <p class="settings-title">{{ $t('site.field.description') }}</p>
        <p class="settings-tip">
          {{ $t('site.message.descriptionTip') }}
        </p>
      </div>
      <div class="settings-content">
        <span class="settings-value">{{ descriptionSource }}</span>
        <div class="settings-actions">
          <edit-text
            :model-value="descriptionSource"
            :title="$t('site.title.editDescription')"
            :placeholder="$t('site.placeholder.description')"
            @confirm="onSave({ description: $event })"
          />
          <auto-translate-toggle
            model="site"
            field="description"
            :object-id="site.id"
            :enabled="autoTranslatedFields.includes('description')"
            :current-value="descriptionSource"
            @enabled-success="onTranslationChanged"
            @disabled-success="onTranslationChanged"
          />
        </div>
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
import AutoTranslateToggle from '@/components/site/AutoTranslateToggle.vue';
import SectionNotice from '@/components/setting/SectionNotice.vue';
import { siteOperator } from '@/operators';

export default defineComponent({
  name: 'SettingSeo',
  components: {
    EditText,
    EditArray,
    AutoTranslateToggle,
    SectionNotice
  },
  computed: {
    site() {
      return this.$store.getters.site || {};
    },
    // See ``Site.vue`` ``titleSource`` — same rationale: the
    // ``description`` column may be a ``$t(...)`` ref when
    // auto-translate is ON, so we always edit the raw zh-cn source.
    descriptionSource(): string {
      return this.site?.description_source ?? this.site?.description ?? '';
    },
    autoTranslatedFields(): string[] {
      return this.site?.auto_translated_fields ?? [];
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
    },
    onTranslationChanged() {
      // Toggle endpoints mutate the row server-side; refresh so the
      // ``description`` / ``description_source`` /
      // ``auto_translated_fields`` we bind to come back in sync.
      this.$store.dispatch('getSite');
    }
  }
});
</script>

<style lang="scss" scoped>
.settings-actions {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
</style>
