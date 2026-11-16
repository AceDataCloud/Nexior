<template>
  <div class="acemusic-config">
    <div class="config-fields">
      <h1 class="text-xl font-semibold mb-1">{{ displayName }}</h1>
      <p class="text-xs text-[var(--el-text-color-secondary)] mb-5">{{ $t('acemusic.description') }}</p>
      <el-tabs v-model="mode" class="scenario-tabs mb-4">
        <el-tab-pane :label="$t('acemusic.mode.idea')" name="idea" />
        <el-tab-pane :label="$t('acemusic.mode.custom')" name="custom" />
      </el-tabs>
      <div v-if="pendingLyricsSubmission && !writingLyrics" class="lyrics-recovery mb-4">
        <p class="text-xs mb-2">{{ $t('acemusic.message.recover') }}</p>
        <el-button size="small" @click="generateLyrics(true)">{{ $t('acemusic.button.recoverLyrics') }}</el-button>
      </div>
      <div v-if="pendingLyrics" class="lyrics-recovery mb-4">
        <p class="text-xs mb-2">{{ $t('acemusic.message.unknown') }}</p>
        <p class="text-xs break-all mb-2">{{ $t('acemusic.field.taskId') }}: {{ pendingLyrics.id }}</p>
        <el-button size="small" :loading="checkingLyrics" @click="checkLyrics">{{
          $t('acemusic.button.checkLyrics')
        }}</el-button>
      </div>
      <label class="field-label" for="acemusic-model">{{ $t('acemusic.field.model') }}</label>
      <el-select id="acemusic-model" v-model="model" class="w-full mb-4" :aria-label="$t('acemusic.field.model')">
        <el-option v-for="item in models" :key="item" :value="item" :label="item" />
      </el-select>
      <template v-if="!config.custom">
        <label class="field-label" for="acemusic-prompt">{{ $t('acemusic.field.prompt') }}</label>
        <el-input
          id="acemusic-prompt"
          v-model="prompt"
          type="textarea"
          :rows="7"
          :placeholder="$t('acemusic.placeholder.prompt')"
        />
      </template>
      <template v-else>
        <div class="flex items-center justify-between mb-2">
          <label class="field-label !mb-0" for="acemusic-lyric">{{ $t('acemusic.field.lyric') }}</label>
          <el-button size="small" @click="lyricsVisible = true">{{ $t('acemusic.button.lyrics') }}</el-button>
        </div>
        <el-input
          id="acemusic-lyric"
          v-model="lyric"
          type="textarea"
          :rows="9"
          :placeholder="$t('acemusic.placeholder.lyric')"
        />
        <label class="field-label mt-4" for="acemusic-style">{{ $t('acemusic.field.style') }}</label>
        <el-input
          id="acemusic-style"
          v-model="style"
          type="textarea"
          :rows="2"
          :placeholder="$t('acemusic.placeholder.style')"
        />
        <label class="field-label mt-4" for="acemusic-title">{{ $t('acemusic.field.title') }}</label>
        <el-input id="acemusic-title" v-model="title" :placeholder="$t('acemusic.placeholder.title')" />
      </template>
    </div>
    <div class="config-footer">
      <service-pricing-summary :value="generationCost" :service="service" :note="$t('acemusic.price.generation')" />
      <el-button
        type="primary"
        class="w-full"
        round
        :loading="submitting"
        :disabled="!valid || Boolean(pendingAudioSubmission)"
        @click="$emit('generate')"
        >{{ $t('acemusic.button.generate') }}</el-button
      >
      <api-code-button path="/acemusic/audios" :body="request" button-type="" class="mt-2" />
    </div>
    <el-dialog
      v-model="lyricsVisible"
      :title="$t('acemusic.button.lyrics')"
      width="min(560px, 94vw)"
      :close-on-click-modal="!writingLyrics"
    >
      <label class="field-label" for="acemusic-lyrics-prompt">{{ $t('acemusic.field.prompt') }}</label>
      <el-input
        id="acemusic-lyrics-prompt"
        v-model="lyricsPrompt"
        type="textarea"
        :rows="4"
        :placeholder="$t('acemusic.placeholder.lyricsPrompt')"
      />
      <label class="field-label mt-4" for="acemusic-lyrics-style">{{ $t('acemusic.field.style') }}</label>
      <el-input id="acemusic-lyrics-style" v-model="lyricsStyle" :placeholder="$t('acemusic.placeholder.style')" />
      <p class="text-xs text-[var(--el-text-color-secondary)] mt-3">{{ $t('acemusic.price.lyrics') }}</p>
      <service-pricing-summary :value="lyricsCost" :service="service" />
      <template #footer
        ><el-button
          type="primary"
          :loading="writingLyrics"
          :disabled="!lyricsPrompt.trim() || Boolean(pendingLyrics) || Boolean(pendingLyricsSubmission)"
          @click="generateLyrics()"
          >{{ $t('acemusic.button.lyrics') }}</el-button
        ></template
      >
    </el-dialog>
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue';
import { useStore } from 'vuex';
import { ElButton, ElDialog, ElInput, ElMessage, ElOption, ElSelect, ElTabPane, ElTabs } from 'element-plus';
import { ACEMUSIC_MODELS } from '@/constants';
import type { AcemusicModel, IAcemusicConfig } from '@/models';
import { acemusicOperator, buildAcemusicAudioRequest } from '@/operators/acemusic';
import { ensureLoggedIn, getConsumption } from '@/utils';
import { resolveCapabilityPresentation } from '@/utils/capabilityPresentation';
import { t } from '@/i18n';
import {
  pendingAcemusicSubmission,
  prepareAcemusicSubmission,
  settleAcemusicSubmission,
  isDefiniteAcemusicRejection
} from '@/utils/acemusicSubmission';
import ServicePricingSummary from '@/components/common/ServicePricingSummary.vue';
import ApiCodeButton from '@/components/common/ApiCodeButton.vue';

defineProps<{ submitting: boolean }>();
defineEmits<{ generate: [] }>();
const store = useStore();
const models = ACEMUSIC_MODELS;
const config = computed<IAcemusicConfig>(
  () => store.state.acemusic.config || { model: 'acemusic-v1.1', custom: false }
);
const patch = (value: Partial<IAcemusicConfig>) => store.commit('acemusic/setConfig', { ...config.value, ...value });
const field = (key: 'prompt' | 'lyric' | 'style' | 'title') =>
  computed({ get: () => config.value[key] || '', set: (value: string) => patch({ [key]: value }) });
const prompt = field('prompt'),
  lyric = field('lyric'),
  style = field('style'),
  title = field('title');
const mode = computed({
  get: () => (config.value.custom ? 'custom' : 'idea'),
  set: (value: string) => patch({ custom: value === 'custom' })
});
const model = computed({ get: () => config.value.model, set: (value: AcemusicModel) => patch({ model: value }) });
const service = computed(() => store.state.acemusic.service);
const displayName = computed(
  () => resolveCapabilityPresentation(store.state.site, 'acemusic', 'ACE Music', '').displayName
);
const request = computed(() => buildAcemusicAudioRequest(config.value));
const valid = computed(() =>
  config.value.custom
    ? Boolean(lyric.value.trim() && title.value.trim() && style.value.trim())
    : Boolean(prompt.value.trim())
);
const generationCost = computed(() =>
  service.value?.cost?.length ? getConsumption(request.value, service.value.cost) : undefined
);
const lyricsCost = computed(() =>
  service.value?.cost?.length ? getConsumption({ action: 'lyrics' }, service.value.cost) : undefined
);
const pendingAudioSubmission = computed(() => pendingAcemusicSubmission(store, 'audios'));
const pendingLyricsSubmission = computed(() => pendingAcemusicSubmission(store, 'lyrics'));
const pendingLyrics = computed(() => {
  const task = store.state.acemusic.lyricsTask;
  return task && task.userId === store.state.user?.id && task.applicationId === store.state.acemusic.application?.id
    ? task
    : undefined;
});
const checkingLyrics = ref(false);
const lyricsVisible = ref(false),
  writingLyrics = ref(false),
  lyricsPrompt = ref(''),
  lyricsStyle = ref('');
async function generateLyrics(recover = false) {
  if (
    writingLyrics.value ||
    pendingLyrics.value ||
    (!recover && (pendingLyricsSubmission.value || !lyricsPrompt.value.trim())) ||
    !ensureLoggedIn()
  )
    return;
  const token = store.state.acemusic.credential?.token;
  if (!token || !store.state.user?.id || !store.state.acemusic.application?.id) {
    ElMessage.warning(t('acemusic.message.credential'));
    return;
  }
  const submission = prepareAcemusicSubmission(store, 'lyrics', {
    prompt: lyricsPrompt.value.trim(),
    style: lyricsStyle.value.trim() || undefined
  });
  writingLyrics.value = true;
  try {
    const { data } = await acemusicOperator.lyrics(submission.request as { prompt: string; style?: string }, {
      token,
      idempotencyKey: submission.key
    });
    if (data.task_id || data.success === true) settleAcemusicSubmission(store, submission);
    if (token !== store.state.acemusic.credential?.token) return;
    const result = data.data?.[0];
    if (data.success !== true || !result?.text) {
      if (data.task_id && data.success !== false) {
        store.commit('acemusic/setLyricsTask', {
          id: data.task_id,
          userId: store.state.user?.id,
          applicationId: store.state.acemusic.application?.id
        });
        lyricsVisible.value = false;
        return;
      }
      throw new Error(t('acemusic.message.lyricsFailed'));
    }
    patch({
      custom: true,
      lyric: result.text,
      title: result.title || title.value,
      style: submission.request.style || style.value
    });
    lyricsVisible.value = false;
  } catch (error: any) {
    if (error?.response?.data?.task_id || isDefiniteAcemusicRejection(error))
      settleAcemusicSubmission(store, submission);
    else lyricsVisible.value = false;
    ElMessage.error(t('acemusic.message.lyricsFailed'));
  } finally {
    writingLyrics.value = false;
  }
}
async function checkLyrics() {
  const taskId = pendingLyrics.value?.id,
    token = store.state.acemusic.credential?.token;
  if (!taskId || !token || checkingLyrics.value) return;
  checkingLyrics.value = true;
  try {
    const { data } = await acemusicOperator.task<{
      state?: string;
      status?: string;
      response?: { success?: boolean; data?: Array<{ title?: string; text?: string }> };
    }>(taskId, { token });
    if (token !== store.state.acemusic.credential?.token || pendingLyrics.value?.id !== taskId) return;
    const result = data.response?.data?.[0];
    if (data.response?.success === true && result?.text) {
      patch({ custom: true, lyric: result.text, title: result.title || title.value });
      store.commit('acemusic/setLyricsTask', undefined);
    } else if (data.state === 'failed' || data.status === 'failed' || data.response?.success === false) {
      store.commit('acemusic/setLyricsTask', undefined);
      ElMessage.error(t('acemusic.message.lyricsFailed'));
    } else ElMessage.info(t('acemusic.message.unknown'));
  } catch {
    ElMessage.error(t('acemusic.message.lyricsFailed'));
  } finally {
    checkingLyrics.value = false;
  }
}
</script>
<style scoped>
.acemusic-config {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}
.config-fields {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 20px;
}
.config-footer {
  padding: 12px 20px 20px;
  border-top: 1px solid var(--app-border-subtle);
  text-align: center;
}
.lyrics-recovery {
  padding: 10px;
  background: var(--el-color-warning-light-9);
  border-radius: 8px;
}
.field-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 7px;
}
</style>
