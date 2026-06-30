<template>
  <!-- Guests can browse the config panel but have no task history; instead of an
       indefinite skeleton (their tasks never load), show a friendly prompt to
       log in to start a task and see their creations. -->
  <div
    v-if="!authenticated"
    class="guest-prompt h-full w-full flex flex-col items-center justify-center text-center px-6 py-10 text-[var(--el-text-color-secondary)]"
  >
    <button
      type="button"
      class="inline-flex items-center justify-center w-12 h-12 rounded-full border border-[var(--el-color-primary-light-5)] bg-[var(--el-color-primary-light-9)] text-[var(--el-color-primary)] cursor-pointer transition duration-200 hover:bg-[var(--el-color-primary-light-7)] hover:scale-105 active:scale-95"
      :aria-label="$t('common.button.login')"
      @click="onLogin"
    >
      <font-awesome-icon icon="fa-solid fa-magic" class="text-lg" />
    </button>
    <p class="mt-4 text-sm max-w-[260px]">{{ $t('common.message.guestTasks') }}</p>
    <el-button type="primary" round class="mt-4" @click="onLogin">
      {{ $t('common.button.login') }}
    </el-button>
  </div>
  <template v-else>
    <div v-for="_ in 3" :key="_" class="flex mb-4">
      <div class="w-[70px] p-3">
        <el-skeleton animated>
          <template #template>
            <el-skeleton-item variant="image" class="w-[50px] h-[50px] rounded-full" />
          </template>
        </el-skeleton>
      </div>
      <div class="flex-1 p-3">
        <el-skeleton animated>
          <template #template>
            <el-skeleton-item variant="p" class="w-[200px] h-[20px] mb-4 block rounded-lg" />
            <el-skeleton-item variant="p" class="w-full h-[200px] max-w-[300px] block rounded-2xl" />
          </template>
        </el-skeleton>
      </div>
    </div>
  </template>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSkeleton, ElSkeletonItem, ElButton } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { ensureLoggedIn } from '@/utils/login';

export default defineComponent({
  name: 'BotPlaceholder',
  components: {
    ElSkeleton,
    ElSkeletonItem,
    ElButton,
    FontAwesomeIcon
  },
  computed: {
    authenticated(): boolean {
      return this.$store.getters.authenticated;
    }
  },
  methods: {
    onLogin() {
      ensureLoggedIn();
    }
  }
});
</script>
