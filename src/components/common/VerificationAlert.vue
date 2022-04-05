<template></template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElMessageBox } from 'element-plus';
import AuthService from '@/services/auth/service';
import { ITokenResponse } from '@/services/auth/types';

export default defineComponent({
  name: 'VerificationAlert',
  computed: {
    verified() {
      return this.$store.getters.user.isVerified;
    },
    refresh() {
      return this.$route.query.refresh;
    }
  },
  methods: {
    checkAndShowVerificationAlert() {
      if (this.verified) {
        return;
      }
      ElMessageBox.alert(this.$t('auth.message.needVerification'), this.$t('common.message.info'), {
        confirmButtonText: this.$t('common.button.verify'),
        // cancelButtonText: this.$t('common.button.cancel'),
        type: 'warning',
        center: true,
        showClose: false,
        showCancelButton: false,
        closeOnClickModal: false,
        closeOnPressEscape: false,
        closeOnHashChange: false
      })
        .then(() => {
          window.open('https://auth.test.zhishuyun.com/user/verify?redirect=' + window.location.href + '?refresh=1');
        })
        .catch(() => {});
    }
  },
  async mounted() {
    if (this.refresh) {
      AuthService.refreshToken({
        refresh: this.$store.getters.refreshToken
      }).then(async ({ data: data }: { data: ITokenResponse }) => {
        await this.$store.dispatch('setAccessToken', data.access);
        await this.$store.dispatch('getMe');
        this.$router.push({
          ...this.$route,
          query: {}
        });
        this.checkAndShowVerificationAlert();
      });
    } else {
      this.checkAndShowVerificationAlert();
    }
  }
});
</script>
