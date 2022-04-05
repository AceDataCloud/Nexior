<template>
  <router-view />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import UserService from '@/services/user/service';
import { IUserDetailResponse } from './services/user/types';

export default defineComponent({
  mounted() {
    UserService.getMe().then(({ data: data }: { data: IUserDetailResponse }) => {
      console.log('data', data);
      this.$store.dispatch('setUser', data);
    });
  }
});
</script>
