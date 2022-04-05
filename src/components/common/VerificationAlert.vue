<template></template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElMessageBox } from 'element-plus';

export default defineComponent({
  name: 'VerificationAlert',
  mounted() {
    ElMessageBox.alert(this.$t('auth.message.needVerification'), this.$t('common.message.info'), {
      confirmButtonText: this.$t('common.button.verify'),
      // cancelButtonText: this.$t('common.button.cancel'),
      type: 'warning',
      center: true,
      showClose: false,
      'show-cancel-button': false,
      'close-on-click-modal': false,
      'close-on-press-escape': false,
      'close-on-hash-change': false
    })
      .then(() => {
        window.open('https://auth.test.zhishuyun.com/user/verify');
      })
      .catch(() => {});
  }
});
</script>
