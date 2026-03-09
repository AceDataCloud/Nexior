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
        <el-button type="primary" @click="onContact">
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
import { faCloud, faComments } from '@fortawesome/free-solid-svg-icons';

export default defineComponent({
  name: 'AboutSetting',
  components: {
    ElButton,
    FontAwesomeIcon
  },
  data() {
    return {
      faGithub,
      faCloud,
      faComments
    };
  },
  computed: {
    supportUrl(): string {
      return this.$store?.state?.site?.metadata?.support_url || 'https://platform.acedata.cloud';
    }
  },
  methods: {
    onContact() {
      window.open(this.supportUrl, '_blank', 'noopener,noreferrer');
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
