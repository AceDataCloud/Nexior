<template>
  <el-dialog v-model="visible" :title="$t('suno.button.extract_vocals')" width="480px" :close-on-click-modal="false">
    <p class="font-medium">{{ audio.title }}</p>
    <p class="text-sm text-[var(--el-text-color-secondary)]">{{ $t('suno.description.vocalRange') }}</p>
    <div class="flex gap-3 my-4">
      <el-input-number
        v-model="start"
        :min="0"
        :max="audio.duration"
        :precision="2"
        :aria-label="$t('suno.name.rangeStart')"
      />
      <el-input-number
        v-model="end"
        :min="0"
        :max="audio.duration"
        :precision="2"
        :aria-label="$t('suno.name.rangeEnd')"
      />
    </div>
    <template v-if="result?.vocal_audio_url">
      <audio :src="result.vocal_audio_url" controls class="w-full my-3" />
      <el-button @click="download">{{ $t('suno.button.download_audio') }}</el-button>
      <el-input v-model="name" class="mt-4" :placeholder="$t('suno.voice.namePlaceholder')" maxlength="50" />
      <el-button class="mt-3" :loading="saving" :disabled="!name.trim()" @click="createPersona">
        {{ $t('suno.button.create_persona') }}
      </el-button>
    </template>
    <template #footer>
      <el-button @click="visible = false">{{ $t('common.button.close') }}</el-button>
      <el-button type="primary" :loading="loading" :disabled="!validRange" @click="extract">
        {{ $t('suno.button.extract_vocals') }}
      </el-button>
    </template>
  </el-dialog>
</template>
<script setup lang="ts">
import { computed, ref, watch, getCurrentInstance } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';
import { ElDialog, ElButton, ElInput, ElInputNumber, ElMessage } from 'element-plus';
import { saveAs } from 'file-saver';
import type { ISunoAudio, ISunoVox } from '@/models';
import { sunoOperator } from '@/operators/suno';
import { sunoPaymentOptions } from '@/utils/x402/sunoPayment';
import { X402PaymentCancelledError } from '@/operators/x402';
import { isValidVocalRange } from '@/utils/suno/vocal';
const props = defineProps<{ modelValue: boolean; audio: ISunoAudio }>();
const emit = defineEmits<{ 'update:modelValue': [boolean] }>();
const store = useStore();
const { t } = useI18n();
const wallet = getCurrentInstance()?.appContext.config.globalProperties.$wallet;
const visible = computed({ get: () => props.modelValue, set: (value) => emit('update:modelValue', value) });
const start = ref<number | undefined>(0);
const end = ref<number | undefined>(20);
const loading = ref(false);
const saving = ref(false);
const name = ref('');
const result = ref<ISunoVox>();
const extractedRange = ref<{ audioId: string; start: number; end: number }>();
let extractRun = 0;
const validRange = computed(() => !!props.audio.id && isValidVocalRange(start.value, end.value, props.audio.duration));
watch(visible, (open) => {
  extractRun += 1;
  loading.value = false;
  if (open) {
    start.value = 0;
    end.value = Math.min(20, props.audio.duration || 20);
    result.value = undefined;
    name.value = props.audio.title || '';
  }
});
async function extract() {
  if (!validRange.value || loading.value) return;
  const options = sunoPaymentOptions({ $store: store, $t: t, $wallet: wallet });
  if (!options) return;
  loading.value = true;
  const run = ++extractRun;
  const range = { audioId: props.audio.id!, start: start.value!, end: end.value! };
  result.value = undefined;
  try {
    const response = await sunoOperator.vox(
      { audio_id: range.audioId, vocal_start: range.start, vocal_end: range.end },
      options
    );
    if (response.data.success === false || !response.data.data?.id || !response.data.data?.vocal_audio_url)
      throw new Error('No vocal result');
    if (run !== extractRun || !visible.value) return;
    result.value = response.data.data;
    extractedRange.value = range;
  } catch (error) {
    if (!(error instanceof X402PaymentCancelledError)) ElMessage.error(t('suno.message.extractVocalsFailed'));
  } finally {
    if (run === extractRun) loading.value = false;
  }
}
async function createPersona() {
  if (!result.value?.id || !extractedRange.value || saving.value || !name.value.trim()) return;
  const options = sunoPaymentOptions({ $store: store, $t: t, $wallet: wallet });
  if (!options) return;
  saving.value = true;
  try {
    const response = await sunoOperator.persona(
      {
        audio_id: extractedRange.value.audioId,
        vox_audio_id: result.value.id,
        name: name.value.trim(),
        vocal_start: extractedRange.value.start,
        vocal_end: extractedRange.value.end
      },
      options
    );
    if (response.data.success === false) throw new Error('Persona failed');
    await store.dispatch('suno/getPersonas');
    ElMessage.success(t('suno.voice.createSuccess'));
  } catch (error) {
    if (!(error instanceof X402PaymentCancelledError)) ElMessage.error(t('suno.voice.createFailed'));
  } finally {
    saving.value = false;
  }
}
async function download() {
  const url = result.value?.vocal_audio_url;
  if (!url) return;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Download failed');
    saveAs(await response.blob(), `${props.audio.title || 'suno'}-vocals.mp3`);
  } catch {
    ElMessage.error(t('suno.message.extractVocalsFailed'));
  }
}
</script>
