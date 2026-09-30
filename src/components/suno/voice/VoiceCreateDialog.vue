<template>
  <el-dialog
    v-model="visible"
    :title="$t('suno.voice.createTitle')"
    width="480px"
    :close-on-click-modal="false"
    @close="onClose"
  >
    <el-form label-position="top" class="voice-create-form">
      <el-form-item :label="$t('suno.voice.name')">
        <el-input v-model="form.name" :placeholder="$t('suno.voice.namePlaceholder')" maxlength="50" />
      </el-form-item>
      <el-form-item :label="$t('suno.voice.description')">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="2"
          :placeholder="$t('suno.voice.descriptionPlaceholder')"
          maxlength="200"
        />
      </el-form-item>
      <el-form-item :label="$t('suno.voice.sourceType')">
        <el-radio-group v-model="sourceType" class="w-full">
          <el-radio value="song">{{ $t('suno.voice.fromSong') }}</el-radio>
          <el-radio value="upload">{{ $t('suno.voice.fromUpload') }}</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item v-if="sourceType === 'song'" :label="$t('suno.voice.audioId')">
        <el-select
          v-model="form.audio_id"
          filterable
          allow-create
          default-first-option
          class="w-full"
          :placeholder="$t('suno.voice.selectSong')"
        >
          <el-option v-for="song in songs" :key="song.id" :value="song.id || ''" :label="song.title || song.id || ''" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="sourceType === 'upload'" :label="$t('suno.voice.audioUrl')">
        <el-input v-model="form.audio_url" :placeholder="$t('suno.voice.audioUrlPlaceholder')" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="onClose">{{ $t('common.button.cancel') }}</el-button>
      <el-button type="primary" :loading="loading" :disabled="!canSubmit" @click="onSubmit">
        {{ $t('suno.voice.create') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import {
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElButton,
  ElRadioGroup,
  ElRadio,
  ElMessage,
  ElSelect,
  ElOption
} from 'element-plus';
import type { ISunoAudio } from '@/models';
import { sunoOperator } from '@/operators/suno';
import { sunoPaymentOptions } from '@/utils/x402/sunoPayment';
import { X402PaymentCancelledError } from '@/operators/x402';

export default defineComponent({
  name: 'VoiceCreateDialog',
  components: {
    ElDialog,
    ElForm,
    ElFormItem,
    ElInput,
    ElButton,
    ElRadioGroup,
    ElRadio,
    ElSelect,
    ElOption
  },
  props: {
    sourceAudio: { type: Object as () => ISunoAudio, default: undefined },
    modelValue: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue', 'created'],
  data() {
    return {
      sourceType: 'song' as 'song' | 'upload',
      form: {
        name: '',
        description: '',
        audio_id: '',
        audio_url: ''
      },
      loading: false
    };
  },
  computed: {
    visible: {
      get(): boolean {
        return this.modelValue;
      },
      set(val: boolean) {
        this.$emit('update:modelValue', val);
      }
    },
    songs(): ISunoAudio[] {
      const songs = (this.$store.state.suno?.tasks?.items || []).flatMap((task) =>
        Array.isArray(task.response?.data) ? task.response.data : []
      );
      return songs.filter((audio: ISunoAudio) => audio.id && audio.audio_url);
    },
    token(): string | undefined {
      return this.$store.state.suno?.credential?.token;
    },
    canSubmit(): boolean {
      if (!this.form.name) return false;
      if (this.sourceType === 'song' && !this.form.audio_id) return false;
      if (this.sourceType === 'upload' && !this.form.audio_url) return false;
      return true;
    }
  },
  watch: {
    modelValue: {
      immediate: true,
      handler(open: boolean) {
        if (open && this.sourceAudio?.id) {
          this.sourceType = 'song';
          this.form.audio_id = this.sourceAudio.id;
          this.form.name = this.sourceAudio.title || '';
        }
      }
    }
  },
  methods: {
    onClose() {
      this.visible = false;
      this.resetForm();
    },
    resetForm() {
      this.form = { name: '', description: '', audio_id: '', audio_url: '' };
      this.sourceType = 'song';
    },
    async onSubmit() {
      const options = sunoPaymentOptions(this);
      if (!options) return;
      this.loading = true;
      try {
        if (this.sourceType === 'song') {
          await sunoOperator.persona(
            {
              audio_id: this.form.audio_id,
              name: this.form.name,
              description: this.form.description
            },
            options
          );
        } else {
          await sunoOperator.voices(
            {
              audio_url: this.form.audio_url,
              name: this.form.name,
              description: this.form.description
            },
            options
          );
        }
        ElMessage.success(this.$t('suno.voice.createSuccess'));
        this.$emit('created');
        this.onClose();
      } catch (error) {
        if (error instanceof X402PaymentCancelledError) return;
        ElMessage.error(this.$t('suno.voice.createFailed'));
      } finally {
        this.loading = false;
      }
    }
  }
});
</script>
