<template>
  <el-dialog v-model="visible" :title="$t('suno.button.mashup_lyrics')" width="640px" :close-on-click-modal="false">
    <p class="text-sm text-[var(--el-text-color-secondary)]">{{ $t('suno.description.mashupLyrics') }}</p>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
      <el-input v-model="lyricsA" type="textarea" :rows="8" :placeholder="$t('suno.placeholder.lyricsA')" />
      <el-input v-model="lyricsB" type="textarea" :rows="8" :placeholder="$t('suno.placeholder.lyricsB')" />
    </div>
    <template #footer>
      <el-button @click="visible = false">{{ $t('common.button.cancel') }}</el-button>
      <el-button type="primary" :loading="loading" :disabled="!lyricsA.trim() || !lyricsB.trim()" @click="generate">
        {{ $t('suno.button.mashup_lyrics') }}
      </el-button>
    </template>
  </el-dialog>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';
import { ElDialog, ElInput, ElButton, ElMessage } from 'element-plus';
import type { ISunoAudio, ISunoTask } from '@/models';
import { sunoOperator } from '@/operators/suno';
import { isSunoWalletMode } from '@/utils/x402/sunoPayment';
const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{ 'update:modelValue': [boolean]; generated: [string] }>();
const store = useStore();
const { t } = useI18n();
const visible = computed({ get: () => props.modelValue, set: (value) => emit('update:modelValue', value) });
const lyricsA = ref('');
const lyricsB = ref('');
const loading = ref(false);
watch(visible, (open) => {
  if (!open) return;
  const ids: string[] = store.state.suno.config?.mashup_audio_ids || [];
  const songs: ISunoAudio[] = (store.state.suno.tasks?.items || []).flatMap((task: ISunoTask) =>
    Array.isArray(task.response?.data) ? task.response.data : []
  );
  lyricsA.value = songs.find((song) => song.id === ids[0])?.lyric || store.state.suno.config?.lyric || '';
  lyricsB.value = songs.find((song) => song.id === ids[1])?.lyric || '';
});
async function generate() {
  const token = store.state.suno?.credential?.token;
  if (!token || isSunoWalletMode() || loading.value || !lyricsA.value.trim() || !lyricsB.value.trim()) return;
  loading.value = true;
  try {
    const response = await sunoOperator.mashupLyrics(
      { lyrics_a: lyricsA.value.trim(), lyrics_b: lyricsB.value.trim() },
      { token }
    );
    if (response.data.success === false || !response.data.data?.text) throw new Error('No lyrics');
    emit('generated', response.data.data.text);
    visible.value = false;
    ElMessage.success(t('suno.message.generateLyricsSuccess'));
  } catch {
    ElMessage.error(t('suno.message.generateLyricsFailed'));
  } finally {
    loading.value = false;
  }
}
</script>
