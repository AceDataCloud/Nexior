import { defineComponent } from 'vue';
import type { CapabilityKey } from '@/constants/capabilities';
import { consumeShowcase } from './showcaseRecreate';
import { openTaskDrawer } from './taskDrawerMixin';

export function showcaseRecreateMixin(capability: CapabilityKey) {
  return defineComponent({
    watch: {
      '$route.query.showcase': {
        async handler(value, oldValue) {
          if (!value || value === oldValue) return;
          await this.onConsumeShowcase();
        }
      }
    },
    async mounted() {
      await this.onConsumeShowcase();
    },
    methods: {
      async onConsumeShowcase() {
        const result = await consumeShowcase({
          capability,
          route: this.$route,
          router: this.$router,
          store: this.$store,
          site: this.$store.state.site,
          locale: String(this.$i18n.locale || 'en'),
          t: (key, params) => this.$t(key, params || {}) as string
        });
        if (result === 'applied' && window.matchMedia('(max-width: 767px)').matches) {
          openTaskDrawer();
        }
      }
    }
  });
}
