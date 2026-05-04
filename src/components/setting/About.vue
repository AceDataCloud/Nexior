<template>
  <div class="settings-list">
    <section class="settings-item">
      <div class="settings-label">
        <p class="settings-title">{{ $t('common.settings.poweredBy') }}</p>
        <p class="settings-tip">{{ $t('common.settings.poweredByTip') }}</p>
      </div>
      <div class="settings-content">
        <a href="https://github.com/AceDataCloud/Nexior" target="_blank" rel="noopener noreferrer" class="about-link">
          <font-awesome-icon :icon="faGithub" class="icon" />
          <span>Nexior</span>
        </a>
      </div>
    </section>
    <section class="settings-item">
      <div class="settings-label">
        <p class="settings-title">{{ $t('common.settings.apiService') }}</p>
        <p class="settings-tip">{{ $t('common.settings.apiServiceTip') }}</p>
      </div>
      <div class="settings-content">
        <a href="https://platform.acedata.cloud" target="_blank" rel="noopener noreferrer" class="about-link">
          <font-awesome-icon :icon="faCloud" class="icon" />
          <span>Ace Data Cloud</span>
        </a>
      </div>
    </section>
    <section class="settings-item">
      <div class="settings-label">
        <p class="settings-title">{{ $t('common.settings.buildYourOwn') }}</p>
        <p class="settings-tip">{{ $t('common.settings.buildYourOwnTip') }}</p>
      </div>
      <div class="settings-content">
        <!--
          On the official main site we offer a true one-click subsite create:
          ask the parent dialog (Setting.vue) to switch to the Subsites tab
          with the create form already open. Other hosts (subsites,
          white-label) keep the original "contact us" CTA since they can't
          self-spawn further subsites.
        -->
        <el-button v-if="isMainOfficialHost" type="primary" @click="onBuildOneClick">
          <font-awesome-icon :icon="faRocket" class="mr-1" />
          {{ $t('common.settings.buildNow') }}
        </el-button>
        <el-button v-else type="primary" @click="onContact">
          <font-awesome-icon :icon="faComments" class="mr-1" />
          {{ $t('common.settings.contactUs') }}
        </el-button>
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { faCloud, faComments, faRocket } from '@fortawesome/free-solid-svg-icons';
import { SETTING_TAB_SUBSITES } from '@/constants';
import { isMainOfficial } from '@/utils';

export default defineComponent({
  name: 'AboutSetting',
  components: {
    ElButton,
    FontAwesomeIcon
  },
  emits: ['switch-tab'],
  data() {
    return {
      faGithub,
      faCloud,
      faComments,
      faRocket
    };
  },
  computed: {
    supportUrl(): string {
      return this.$store?.state?.site?.metadata?.support_url || 'https://platform.acedata.cloud';
    },
    isMainOfficialHost(): boolean {
      return isMainOfficial();
    }
  },
  methods: {
    onContact() {
      window.open(this.supportUrl, '_blank', 'noopener,noreferrer');
    },
    onBuildOneClick() {
      // Ask the parent settings dialog to swap to the Subsites tab with
      // the create form pre-opened. Plain Vue emit, no global event bus.
      this.$emit('switch-tab', { tab: SETTING_TAB_SUBSITES, autoOpenCreateSubsite: true });
    }
  }
});
</script>

<style lang="scss" scoped>
.about-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--el-text-color-regular);
  text-decoration: none;
  transition: color 0.3s;
  font-size: 14px;

  .icon {
    font-size: 18px;
  }

  &:hover {
    color: var(--el-color-primary);
  }
}
</style>
