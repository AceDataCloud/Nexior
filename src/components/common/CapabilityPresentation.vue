<template>
  <el-image v-if="part === 'avatar'" :src="iconUrl" @error="iconFailed = true" />
  <span v-else>{{ presentation.displayName }}</span>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import { ElImage } from 'element-plus';
import { CAPABILITY_ICONS, type CapabilityKey } from '@/constants/capabilities';
import { resolveCapabilityPresentation } from '@/utils/capabilityPresentation';

export default defineComponent({
  name: 'CapabilityPresentation',
  components: { ElImage },
  props: {
    capability: {
      type: String as PropType<CapabilityKey>,
      required: true
    },
    part: {
      type: String as PropType<'avatar' | 'name'>,
      required: true
    }
  },
  data() {
    return { iconFailed: false };
  },
  computed: {
    presentation() {
      return resolveCapabilityPresentation(
        this.$store.state.site,
        this.capability,
        this.$t(`common.nav.${this.capability}`),
        CAPABILITY_ICONS[this.capability]
      );
    },
    iconUrl(): string {
      return this.iconFailed ? CAPABILITY_ICONS[this.capability] : this.presentation.iconUrl;
    }
  },
  watch: {
    'presentation.iconUrl'() {
      this.iconFailed = false;
    }
  }
});
</script>
