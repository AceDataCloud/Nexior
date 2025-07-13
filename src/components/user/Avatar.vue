<template>
  <img :src="user?.avatar || defaultAvatar" class="avatar" />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import defaultAvatar from '@/assets/images/avatar.png';

export default defineComponent({
  name: 'UserAvatar',
  data() {
    return {
      defaultAvatar
    };
  },
  computed: {
    user() {
      return this.$store.getters?.user;
    }
  }
});
</script>

<style lang="scss" scoped>
.avatar {
  width: 35px;
  height: 35px;
  max-width: initial;
  max-height: initial;
  border-radius: 50%;
  object-fit: cover;
  cursor: pointer;
  transition: transform 0.3s ease;
}
</style>
