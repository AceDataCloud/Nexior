<template>
  <el-dialog v-model="editing" :title="title" width="560px" class="edit-contacts-dialog" append-to-body>
    <p class="hint">{{ $t('common.settings.contactEditorHint') }}</p>
    <div class="rows">
      <div v-for="(row, idx) in rows" :key="row.id" class="contact-row">
        <div class="row-head">
          <font-awesome-icon v-if="contactUsesFontAwesome(row.type)" :icon="rowIcon(row.type)" class="row-icon" />
          <component
            :is="rowIcon(row.type)"
            v-else
            class="row-icon"
            :size="'1em' as any"
            aria-hidden="true"
            focusable="false"
          />
          <el-select
            v-model="row.type"
            filterable
            allow-create
            default-first-option
            class="type-select"
            popper-class="contact-type-options"
            :placeholder="$t('common.settings.contactType')"
            @change="row.type = normalizeType(row.type)"
          >
            <el-option v-for="opt in typeOptions" :key="opt.value" :label="opt.label" :value="opt.value">
              <span class="type-option">
                <font-awesome-icon v-if="opt.fontAwesome" :icon="opt.icon" class="type-option__icon" />
                <component
                  :is="opt.icon"
                  v-else
                  class="type-option__icon"
                  :size="'1em' as any"
                  aria-hidden="true"
                  focusable="false"
                />
                <span>{{ opt.label }}</span>
                <code>{{ opt.value }}</code>
              </span>
            </el-option>
          </el-select>
          <el-button link type="danger" @click="removeRow(idx)">
            <delete :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('common.button.delete') }}
          </el-button>
        </div>
        <el-input v-model="row.label" class="row-field" :placeholder="$t('common.settings.contactLabelPlaceholder')" />
        <el-input v-model="row.value" class="row-field" :placeholder="valuePlaceholder(row.type)" />
        <el-input v-model="row.url" class="row-field" placeholder="https://..." />
        <div class="qr-row">
          <span class="qr-label">{{ $t('common.settings.contactQr') }}</span>
          <el-image
            v-if="row.qr"
            :src="row.qr"
            :preview-src-list="[row.qr]"
            :preview-teleported="true"
            class="qr-thumb"
            fit="contain"
          />
          <span v-else class="qr-empty">{{ $t('common.settings.contactQrEmpty') }}</span>
          <div class="qr-actions">
            <el-button plain round size="small" @click="openQrUploader(row.id)">
              {{ $t(row.qr ? 'common.settings.contactQrReplace' : 'common.settings.contactQrUpload') }}
            </el-button>
            <el-button v-if="row.qr" plain round size="small" type="danger" @click="row.qr = ''">
              {{ $t('common.settings.contactQrClear') }}
            </el-button>
          </div>
        </div>
      </div>
    </div>
    <el-button class="add-btn" @click="addRow">
      <plus :size="'1em' as any" aria-hidden="true" focusable="false" />
      {{ $t('common.settings.contactAdd') }}
    </el-button>
    <template #footer>
      <span class="dialog-footer">
        <el-button round @click="onCancel">{{ $t('common.button.cancel') }}</el-button>
        <el-button round type="primary" @click="onConfirm">{{ $t('common.button.confirm') }}</el-button>
      </span>
    </template>
  </el-dialog>
  <image-cropper
    v-model="qrCropperVisible"
    :title="$t('common.settings.contactQrDialogTitle')"
    :format-hint="$t('common.settings.contactQrTip')"
    :aspect-ratio="1"
    :output-width="512"
    dialog-width="min(640px, calc(100vw - 24px))"
    accept="image/png,image/jpeg,image/webp"
    shape="rectangle"
    @uploaded="onQrUploaded"
  />
  <span
    class="edit"
    role="button"
    tabindex="0"
    :aria-label="$t('common.button.edit')"
    :title="$t('common.button.edit')"
    @click="onOpen"
    @keydown.enter.prevent="onOpen"
    @keydown.space.prevent="onOpen"
  >
    <el-icon class="icon">
      <edit :size="'1em' as any" aria-hidden="true" focusable="false" />
    </el-icon>
  </span>
</template>

<script lang="ts">
import { EditIcon as Edit, AddIcon as Plus, DeleteIcon as Delete } from '@acedatacloud/core/icons/components';
import { defineComponent, PropType, type Component } from 'vue';
import { ElDialog, ElInput, ElButton, ElIcon, ElImage, ElSelect, ElOption, ElMessage } from 'element-plus';
import { v4 as uuidv4 } from 'uuid';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import ImageCropper from '@/components/common/ImageCropper.vue';
import {
  contactIcon,
  contactBrand,
  contactTypeI18nKey,
  contactUsesFontAwesome,
  CONTACT_TYPE_PRESETS
} from '@/utils/contactTypes';
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
  id: string;
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
    Plus,
    Delete,
    ImageCropper,
    FontAwesomeIcon
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
      rows: this.toRows(this.modelValue),
      qrCropperVisible: false,
      activeQrContactId: null as string | null
    };
  },
  computed: {
    typeOptions(): {
      value: string;
      label: string;
      icon: IconDefinition | Component;
      fontAwesome: boolean;
    }[] {
      const buildOption = (value: string) => ({
        value,
        label: this.typeLabel(value),
        icon: contactIcon(value),
        fontAwesome: contactUsesFontAwesome(value)
      });
      const seen = new Set(CONTACT_TYPE_PRESETS);
      const options = CONTACT_TYPE_PRESETS.map(buildOption);
      for (const row of this.rows) {
        const t = (row.type || '').trim().toLowerCase();
        if (t && !seen.has(t)) {
          seen.add(t);
          options.push(buildOption(t));
        }
      }
      return options;
    }
  },
  watch: {
    // When the saved value changes while the dialog is closed (e.g. after a
    // save refreshes the store, or the site loads late), keep the form in
    // sync so the next open always shows the current contacts. A shallow
    // watch suffices: getSite replaces the whole site object, so the
    // contacts array is a new reference each refresh.
    modelValue(value: ISiteContact[]) {
      if (!this.editing) this.rows = this.toRows(value);
    }
  },
  methods: {
    contactUsesFontAwesome,
    normalizeType(type?: string): string {
      return (type || '').trim().toLowerCase().slice(0, 32);
    },
    toRows(list?: ISiteContact[]): ContactRow[] {
      return (list || []).map((c) => ({
        id: c.id || uuidv4(),
        type: c.type || '',
        label: c.label || '',
        value: c.value || '',
        url: c.url || '',
        qr: c.qr || ''
      }));
    },
    rowIcon(type: string) {
      return contactIcon(type);
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
      // never lingers in the form. Start with one empty row when there is
      // nothing yet, so the dialog never looks blank/broken.
      this.rows = this.toRows(this.modelValue);
      if (this.rows.length === 0) this.addRow();
      this.editing = true;
    },
    onCancel() {
      this.editing = false;
      this.qrCropperVisible = false;
      this.activeQrContactId = null;
      this.$emit('cancel');
    },
    addRow() {
      this.rows.push({ id: uuidv4(), type: '', label: '', value: '', url: '', qr: '' });
    },
    removeRow(idx: number) {
      this.rows.splice(idx, 1);
    },
    openQrUploader(contactId: string) {
      this.activeQrContactId = contactId;
      this.qrCropperVisible = true;
    },
    onQrUploaded(url: string) {
      const value = url.trim();
      if (!this.activeQrContactId || !HTTP_URL_RE.test(value)) return;
      const row = this.rows.find((item: ContactRow) => item.id === this.activeQrContactId);
      if (row) row.qr = value;
      this.activeQrContactId = null;
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
          const contact: ISiteContact = { id: r.id, type: this.normalizeType(r.type) };
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

    .row-icon {
      font-size: 18px;
      width: 20px;
      text-align: center;
      color: var(--el-text-color-regular);
      flex: none;
    }

    .type-select {
      flex: 1;
      min-width: 0;
    }
  }

  .qr-row {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;

    .qr-label {
      font-size: 13px;
      color: var(--el-text-color-regular);
    }

    .qr-thumb {
      flex: none;
      width: 56px;
      height: 56px;
      border-radius: 8px;
      border: 1px solid var(--el-border-color-lighter);
      background: #fff;
      cursor: zoom-in;
    }

    .qr-empty {
      flex: 1;
      min-width: 100px;
      color: var(--el-text-color-placeholder);
      font-size: 13px;
    }

    .qr-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
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
  flex-wrap: wrap;
}

@media (max-width: 600px) {
  .contact-row .row-head {
    flex-wrap: wrap;

    .type-select {
      flex-basis: calc(100% - 44px);
    }
  }

  .contact-row .qr-row {
    align-items: flex-start;

    .qr-label {
      flex-basis: 100%;
    }
  }
}
</style>

<style lang="scss">
.edit-contacts-dialog {
  max-width: calc(100vw - 24px);
}

.contact-type-options .type-option {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-width: 0;

  .type-option__icon {
    flex: none;
    width: 18px;
    text-align: center;
  }

  code {
    margin-left: auto;
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }
}
</style>
