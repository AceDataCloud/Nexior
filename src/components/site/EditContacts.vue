<template>
  <el-dialog v-model="editing" :title="title" width="560px" class="edit-contacts-dialog" append-to-body>
    <p class="hint">{{ $t('common.settings.contactEditorHint') }}</p>
    <div class="rows">
      <div v-for="(row, idx) in rows" :key="idx" class="contact-row">
        <div class="row-head">
          <el-select
            v-model="row.type"
            filterable
            allow-create
            default-first-option
            class="type-select"
            :placeholder="$t('common.settings.contactType')"
          >
            <el-option v-for="opt in typeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
          <el-button link type="danger" :icon="Delete" @click="removeRow(idx)">
            {{ $t('common.button.delete') }}
          </el-button>
        </div>
        <el-input v-model="row.label" class="row-field" :placeholder="$t('common.settings.contactLabelPlaceholder')" />
        <el-input v-model="row.value" class="row-field" :placeholder="valuePlaceholder(row.type)" />
        <el-input v-model="row.url" class="row-field" placeholder="https://..." />
        <div class="qr-row">
          <span class="qr-label">{{ $t('common.settings.contactQr') }}</span>
          <el-image v-if="row.qr" :src="row.qr" class="qr-thumb" fit="contain" />
          <edit-image
            :model-value="row.qr"
            :title="$t('common.settings.contactQr')"
            :tip="$t('common.settings.contactQrTip')"
            :width="200"
            :height="200"
            @confirm="row.qr = $event"
          />
          <el-button v-if="row.qr" link type="danger" @click="row.qr = ''">
            {{ $t('common.button.delete') }}
          </el-button>
        </div>
      </div>
    </div>
    <el-button class="add-btn" :icon="Plus" @click="addRow">{{ $t('common.settings.contactAdd') }}</el-button>
    <template #footer>
      <span class="dialog-footer">
        <el-button round @click="onCancel">{{ $t('common.button.cancel') }}</el-button>
        <el-button round type="primary" @click="onConfirm">{{ $t('common.button.confirm') }}</el-button>
      </span>
    </template>
  </el-dialog>
  <span class="edit" @click="onOpen">
    <el-icon class="icon">
      <edit />
    </el-icon>
  </span>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { ElDialog, ElInput, ElButton, ElIcon, ElImage, ElSelect, ElOption, ElMessage } from 'element-plus';
import { Edit, Plus, Delete } from '@element-plus/icons-vue';
import EditImage from '@/components/site/EditImage.vue';
import { contactBrand, contactTypeI18nKey, CONTACT_TYPE_PRESETS } from '@/utils/contactTypes';
import { ISiteContact } from '@/models';

// Client-side mirrors of the backend validators in
// ``PlatformBackend/app/utils/site_branding.py``. They give the site owner an
// inline error instead of a silent 400 — the backend stays the source of truth.
const TYPE_RE = /^[a-z][a-z0-9_-]{0,31}$/;
const HTTP_URL_RE = /^https?:\/\/[^\s/?#]+/i; // require a non-empty host after //
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const PHONE_RE = /^[+()\-.\s0-9]{3,40}$/;
const MAX_URL_LEN = 2048;
const MAX_EMAIL_LEN = 254;
const MAX_VALUE_LEN = 200;
const MAX_LABEL_LEN = 100;
const MAX_CONTACTS = 30;

interface ContactRow {
  type: string;
  label: string;
  value: string;
  url: string;
  qr: string;
}

export default defineComponent({
  name: 'EditContacts',
  components: {
    ElDialog,
    ElInput,
    ElButton,
    ElIcon,
    ElImage,
    ElSelect,
    ElOption,
    Edit,
    EditImage
  },
  props: {
    modelValue: {
      type: Array as PropType<ISiteContact[]>,
      default: () => []
    },
    title: {
      type: String,
      required: true
    }
  },
  emits: ['confirm', 'cancel'],
  data() {
    return {
      Plus,
      Delete,
      editing: false,
      rows: this.toRows(this.modelValue)
    };
  },
  computed: {
    typeOptions(): { value: string; label: string }[] {
      return CONTACT_TYPE_PRESETS.map((value) => ({ value, label: this.typeLabel(value) }));
    }
  },
  methods: {
    toRows(list?: ISiteContact[]): ContactRow[] {
      return (list || []).map((c) => ({
        type: c.type || '',
        label: c.label || '',
        value: c.value || '',
        url: c.url || '',
        qr: c.qr || ''
      }));
    },
    typeLabel(slug: string): string {
      const brand = contactBrand(slug);
      if (brand) return brand;
      const key = contactTypeI18nKey(slug);
      return key ? (this.$t(key) as string) : slug;
    },
    valuePlaceholder(type: string): string {
      const t = (type || '').trim().toLowerCase();
      if (t === 'phone') return '+86 400-000-0000';
      if (t === 'email') return 'support@example.com';
      return this.$t('common.settings.contactValuePlaceholder');
    },
    onOpen() {
      // Re-seed from the latest saved value each time so a cancelled edit
      // never lingers in the form.
      this.rows = this.toRows(this.modelValue);
      this.editing = true;
    },
    onCancel() {
      this.editing = false;
      this.$emit('cancel');
    },
    addRow() {
      this.rows.push({ type: '', label: '', value: '', url: '', qr: '' });
    },
    removeRow(idx: number) {
      this.rows.splice(idx, 1);
    },
    isBlankRow(r: ContactRow): boolean {
      return !r.type.trim() && !r.label.trim() && !r.value.trim() && !r.url.trim() && !r.qr.trim();
    },
    validate(): string {
      const filled = this.rows.filter((r: ContactRow) => !this.isBlankRow(r));
      if (filled.length > MAX_CONTACTS) {
        return this.$t('common.settings.contactTooMany', { max: MAX_CONTACTS });
      }
      const badUrl = (v: string) => !HTTP_URL_RE.test(v) || v.length > MAX_URL_LEN;
      for (const r of filled) {
        const type = r.type.trim().toLowerCase();
        if (!TYPE_RE.test(type)) return this.$t('common.settings.contactInvalidType');
        const value = r.value.trim();
        const url = r.url.trim();
        const qr = r.qr.trim();
        if (!value && !url && !qr) return this.$t('common.settings.contactRowNeedsValue');
        if (r.label.trim().length > MAX_LABEL_LEN) return this.$t('common.settings.contactInvalidValue');
        if (url && badUrl(url)) return this.$t('common.settings.contactInvalidUrl', { field: this.typeLabel(type) });
        if (qr && badUrl(qr)) {
          return this.$t('common.settings.contactInvalidUrl', { field: this.$t('common.settings.contactQr') });
        }
        if (value) {
          if (type === 'phone' && !PHONE_RE.test(value)) return this.$t('common.settings.contactInvalidPhone');
          if (type === 'email' && (!EMAIL_RE.test(value) || value.length > MAX_EMAIL_LEN)) {
            return this.$t('common.settings.contactInvalidEmail');
          }
          if (type !== 'phone' && type !== 'email' && value.length > MAX_VALUE_LEN) {
            return this.$t('common.settings.contactInvalidValue');
          }
        }
      }
      return '';
    },
    buildContacts(): ISiteContact[] {
      return this.rows
        .filter((r: ContactRow) => !this.isBlankRow(r))
        .map((r: ContactRow) => {
          const contact: ISiteContact = { type: r.type.trim().toLowerCase() };
          if (r.label.trim()) contact.label = r.label.trim();
          if (r.value.trim()) contact.value = r.value.trim();
          if (r.url.trim()) contact.url = r.url.trim();
          if (r.qr.trim()) contact.qr = r.qr.trim();
          return contact;
        });
    },
    onConfirm() {
      const error = this.validate();
      if (error) {
        ElMessage.error(error);
        return;
      }
      this.$emit('confirm', this.buildContacts());
      this.editing = false;
    }
  }
});
</script>

<style lang="scss" scoped>
.edit {
  cursor: pointer;
  margin-left: 5px;
  position: relative;
  top: 2px;
  .icon {
    font-size: 14px;
  }
}

.hint {
  margin: 0 0 12px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.rows {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 52vh;
  overflow-y: auto;
}

.contact-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;

  .row-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;

    .type-select {
      flex: 1;
    }
  }

  .qr-row {
    display: flex;
    align-items: center;
    gap: 12px;

    .qr-label {
      font-size: 13px;
      color: var(--el-text-color-regular);
    }

    .qr-thumb {
      width: 56px;
      height: 56px;
      border-radius: 8px;
      border: 1px solid var(--el-border-color-lighter);
    }
  }
}

.add-btn {
  margin-top: 12px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
