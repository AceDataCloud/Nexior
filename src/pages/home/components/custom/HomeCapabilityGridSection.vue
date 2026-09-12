<template>
  <article v-if="items.length" class="tenant-home-block tenant-home-capabilities">
    <span v-if="section.subtitle" class="tenant-home-eyebrow">{{ section.subtitle }}</span>
    <h2>{{ section.title }}</h2>
    <div class="tenant-home-capability-grid">
      <router-link
        v-for="item in items"
        :key="item.capability"
        :to="{ name: item.routeName }"
        class="tenant-home-capability-item"
      >
        <img :src="item.icon" alt="" @error="failedIcons[item.capability] = true" />
        <span
          ><strong>{{ item.name }}</strong
          ><small>{{ item.description }}</small></span
        >
      </router-link>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ISite, ISiteHomeSection } from '@/models';
import { CAPABILITY_ICONS, type CapabilityKey } from '@/constants/capabilities';
import { HOME_CAPABILITY_DEFINITIONS } from '../../data';
import { resolveCapabilityPresentation } from '@/utils/capabilityPresentation';
import { isCapabilityAvailableOnBuild } from '@/utils/surface';

const props = defineProps<{ section: ISiteHomeSection; site?: ISite }>();
const { t } = useI18n();
const failedIcons = reactive<Partial<Record<CapabilityKey, boolean>>>({});
const items = computed(() =>
  (props.section.capability_keys || []).flatMap((raw) => {
    const key = raw as CapabilityKey;
    const definition = HOME_CAPABILITY_DEFINITIONS.get(key);
    if (!definition || !props.site?.features?.[key]?.enabled || !isCapabilityAvailableOnBuild(key)) return [];
    const defaultIcon = CAPABILITY_ICONS[key];
    const presentation = resolveCapabilityPresentation(props.site, key, definition.defaultName, defaultIcon);
    return [
      {
        capability: key,
        routeName: definition.routeName,
        name: presentation.displayName,
        description: t(definition.descriptionKey),
        icon: failedIcons[key] ? defaultIcon : presentation.iconUrl
      }
    ];
  })
);
</script>
