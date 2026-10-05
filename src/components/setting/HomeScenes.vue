<template>
  <section class="scenes-setting">
    <header class="scenes-heading">
      <div>
        <h3>{{ $t('site.homeScenes.title') }}</h3>
        <p>{{ $t('site.homeScenes.tip') }}</p>
      </div>
      <el-button type="primary" :disabled="!management || saving" @click="openCreate">
        {{ $t('site.homeScenes.add') }}
      </el-button>
    </header>

    <div class="scene-list">
      <article v-for="(scene, index) in scenes" :key="scene.id" class="scene-row">
        <img v-if="scene.image_url" :src="scene.image_url" :alt="scene.title" />
        <div v-else class="scene-cover" aria-hidden="true" />
        <div class="scene-summary">
          <strong>{{ scene.title }}</strong>
          <span>{{ scene.description }}</span>
          <small>{{ $t('site.homeScenes.toolCount', { count: scene.tools.length }) }}</small>
        </div>
        <div class="scene-actions">
          <el-button :aria-label="$t('site.homeScenes.up')" :disabled="index === 0" @click="moveScene(index, -1)"
            >↑</el-button
          >
          <el-button
            :aria-label="$t('site.homeScenes.down')"
            :disabled="index === scenes.length - 1"
            @click="moveScene(index, 1)"
            >↓</el-button
          >
          <el-switch v-model="scene.visible" :aria-label="$t('site.homeScenes.visible')" />
          <el-button @click="openEdit(index)">{{ $t('site.homeScenes.edit') }}</el-button>
        </div>
      </article>
    </div>
    <div class="scenes-footer">
      <el-button :disabled="!management || saving" @click="resetDefaults">{{
        $t('site.homeScenes.defaults')
      }}</el-button>
      <el-button type="primary" :loading="saving" :disabled="!management || editing" @click="save">
        {{ $t('site.homeScenes.save') }}
      </el-button>
    </div>

    <el-dialog
      v-model="editing"
      :title="$t('site.homeScenes.edit')"
      width="min(680px, 94vw)"
      append-to-body
      :close-on-click-modal="false"
    >
      <el-form v-if="draft" class="scene-edit-form" label-position="top" @submit.prevent>
        <el-form-item :label="$t('site.homeScenes.sceneTitle')">
          <el-input id="home-scene-title" v-model="draft.title" maxlength="120">
            <template #suffix>
              <auto-translate-toggle
                model="site"
                :field="`home.scenes.${draft.id}.title`"
                :object-id="management?.id"
                :enabled="translatedFields.includes(`scenes.${draft.id}.title`)"
                :current-value="draft.title"
                :disabled-reason="$t('site.homeScenes.saveBeforeTranslate')"
                :disabled="!canTranslate('title')"
                @enabled-success="onTranslationChanged"
                @disabled-success="onTranslationChanged"
              />
            </template>
          </el-input>
        </el-form-item>
        <el-form-item :label="$t('site.homeScenes.sceneDescription')">
          <el-input id="home-scene-description" v-model="draft.description" maxlength="240">
            <template #suffix>
              <auto-translate-toggle
                model="site"
                :field="`home.scenes.${draft.id}.description`"
                :object-id="management?.id"
                :enabled="translatedFields.includes(`scenes.${draft.id}.description`)"
                :current-value="draft.description"
                :disabled-reason="$t('site.homeScenes.saveBeforeTranslate')"
                :disabled="!canTranslate('description')"
                @enabled-success="onTranslationChanged"
                @disabled-success="onTranslationChanged"
              />
            </template>
          </el-input>
        </el-form-item>
        <el-form-item :label="$t('site.homeScenes.image')">
          <div class="cover-picker">
            <img v-if="draft.image_url" class="cover-thumb" :src="draft.image_url" :alt="draft.title" />
            <div v-else class="cover-placeholder" aria-hidden="true" />
            <el-button @click="cropperVisible = true">{{
              $t(draft.image_url ? 'site.homeScenes.replaceImage' : 'site.homeScenes.upload')
            }}</el-button>
          </div>
        </el-form-item>
        <el-form-item :label="$t('site.homeScenes.tools')">
          <el-select
            id="home-scene-tools"
            :model-value="draft.tools.map((tool) => tool.capability)"
            multiple
            filterable
            :placeholder="$t('site.homeScenes.chooseTools')"
            @change="selectTools($event as CapabilityKey[])"
          >
            <el-option
              v-for="tool in catalog"
              :key="tool.capability"
              :value="tool.capability"
              :label="`${tool.name}${tool.enabled ? '' : ` (${$t('site.homeScenes.disabled')})`}`"
            />
          </el-select>
        </el-form-item>
        <div v-for="(tool, index) in draft.tools" :key="tool.capability" class="tool-row">
          <span>{{ toolName(tool.capability) }}</span>
          <el-button :aria-label="$t('site.homeScenes.up')" :disabled="index === 0" @click="moveTool(index, -1)"
            >↑</el-button
          >
          <el-button
            :aria-label="$t('site.homeScenes.down')"
            :disabled="index === draft.tools.length - 1"
            @click="moveTool(index, 1)"
            >↓</el-button
          >
        </div>
        <div class="preview-label">{{ $t('site.homeScenes.preview') }}</div>
        <div class="scene-preview">
          <img v-if="draft.image_url" :src="draft.image_url" alt="" />
          <div class="preview-copy">
            <strong>{{ draft.title }}</strong
            ><span>{{ draft.description }}</span>
          </div>
        </div>
      </el-form>
      <template #footer>
        <div class="scene-dialog-footer">
          <el-button v-if="editIndex !== null" type="danger" plain @click="removeScene">{{
            $t('site.homeScenes.remove')
          }}</el-button>
          <div class="footer-actions">
            <el-button @click="editing = false">{{ $t('common.button.cancel') }}</el-button>
            <el-button type="primary" @click="finishEdit">{{ $t('site.homeScenes.finishEdit') }}</el-button>
          </div>
        </div>
      </template>
    </el-dialog>
    <image-cropper
      v-model="cropperVisible"
      :title="$t('site.homeScenes.image')"
      :aspect-ratio="16 / 9"
      :output-width="1200"
      accept="image/png,image/jpeg,image/webp"
      @uploaded="onImageUploaded"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElMessageBox,
  ElOption,
  ElSelect,
  ElSwitch
} from 'element-plus';
import { CAPABILITY_ICONS, type CapabilityKey } from '@/constants/capabilities';
import type { ISite, ISiteHomeScene } from '@/models';
import { HOME_CATEGORIES, HOME_CAPABILITY_DEFINITIONS } from '@/pages/home/data';
import { siteOperator } from '@/operators';
import { resolveCapabilityPresentation } from '@/utils/capabilityPresentation';
import { withHomeScenes } from '@/utils/siteHome';
import { extractApiErrorMessage } from '@/utils/apiError';
import ImageCropper from '@/components/common/ImageCropper.vue';
import AutoTranslateToggle from '@/components/site/AutoTranslateToggle.vue';

const props = defineProps<{ site: ISite | null | undefined }>();
const emit = defineEmits<{ saved: [] }>();
const { t } = useI18n();
const management = ref<ISite | null>(null);
const scenes = ref<ISiteHomeScene[]>([]);
const editing = ref(false);
const draft = ref<ISiteHomeScene | null>(null);
const editIndex = ref<number | null>(null);
const saving = ref(false);
const restoreDefaults = ref(false);
const cropperVisible = ref(false);
const translatedFields = computed(() => management.value?.home_auto_translated_fields || []);
const catalog = computed(() =>
  [...HOME_CAPABILITY_DEFINITIONS.values()].map((tool) => ({
    capability: tool.capability,
    name: resolveCapabilityPresentation(
      props.site,
      tool.capability,
      tool.defaultName,
      CAPABILITY_ICONS[tool.capability]
    ).displayName,
    enabled: Boolean(props.site?.features?.[tool.capability]?.enabled)
  }))
);

function defaults(): ISiteHomeScene[] {
  return HOME_CATEGORIES.map((category) => ({
    id: category.id,
    title: t(category.titleKey),
    description: t(category.descriptionKey),
    image_url: category.imageUrl,
    visible: !(management.value?.home?.sections?.categories?.disabled_item_ids || []).includes(category.id),
    tools: category.candidates.map((tool) => ({ capability: tool.capability }))
  }));
}
function copyScene(scene: ISiteHomeScene): ISiteHomeScene {
  return { ...scene, tools: scene.tools.map((tool) => ({ capability: tool.capability })) };
}
function hydrate() {
  scenes.value = (management.value?.home_source || management.value?.home)?.scenes?.map(copyScene) || defaults();
  restoreDefaults.value = false;
  editing.value = false;
}
async function refresh() {
  if (!props.site?.id) return;
  try {
    management.value = (await siteOperator.get(props.site.id)).data;
    hydrate();
    emit('saved');
  } catch (error: unknown) {
    ElMessage.error(extractApiErrorMessage(error) || t('site.homeScenes.saveFailed'));
  }
}
watch(
  () => props.site?.id,
  () => {
    management.value = null;
    void refresh();
  },
  { immediate: true }
);

function openCreate() {
  if (scenes.value.length >= 16) return;
  draft.value = { id: crypto.randomUUID(), title: '', description: '', visible: true, tools: [] };
  editIndex.value = null;
  editing.value = true;
}
function openEdit(index: number) {
  draft.value = copyScene(scenes.value[index]);
  editIndex.value = index;
  editing.value = true;
}
function canTranslate(field: 'title' | 'description'): boolean {
  if (editIndex.value === null || !draft.value || restoreDefaults.value) return false;
  const saved = (management.value?.home_source || management.value?.home)?.scenes?.find(
    (scene) => scene.id === draft.value?.id
  );
  return Boolean(
    saved &&
    saved[field] === draft.value[field] &&
    scenes.value[editIndex.value]?.[field] === draft.value[field] &&
    JSON.stringify(scenes.value.map(copyScene)) ===
      JSON.stringify(((management.value?.home_source || management.value?.home)?.scenes || []).map(copyScene)) &&
    JSON.stringify(copyScene(draft.value)) === JSON.stringify(copyScene(scenes.value[editIndex.value]))
  );
}
async function onTranslationChanged() {
  const sceneId = draft.value?.id;
  await refresh();
  if (sceneId) {
    const index = scenes.value.findIndex((scene) => scene.id === sceneId);
    if (index >= 0) openEdit(index);
  }
}
function finishEdit() {
  if (!draft.value?.title.trim()) {
    ElMessage.warning(t('site.homeScenes.titleRequired'));
    return;
  }
  const item = copyScene(draft.value);
  if (!item.image_url?.trim()) delete item.image_url;
  if (editIndex.value === null) scenes.value.push(item);
  else scenes.value[editIndex.value] = item;
  restoreDefaults.value = false;
  editing.value = false;
}
function removeScene() {
  if (editIndex.value !== null) scenes.value.splice(editIndex.value, 1);
  restoreDefaults.value = false;
  editing.value = false;
}
function moveScene(index: number, delta: number) {
  const [scene] = scenes.value.splice(index, 1);
  scenes.value.splice(index + delta, 0, scene);
  restoreDefaults.value = false;
}
function selectTools(selected: CapabilityKey[]) {
  if (!draft.value) return;
  draft.value.tools = selected.map((capability) => ({ capability }));
}
function moveTool(index: number, delta: number) {
  if (!draft.value) return;
  const [tool] = draft.value.tools.splice(index, 1);
  draft.value.tools.splice(index + delta, 0, tool);
}
function toolName(capability: CapabilityKey): string {
  return catalog.value.find((tool) => tool.capability === capability)?.name || capability;
}
function onImageUploaded(url: string) {
  if (draft.value) draft.value.image_url = url;
}
async function resetDefaults() {
  try {
    await ElMessageBox.confirm(t('site.homeScenes.resetConfirm'), t('site.homeScenes.defaults'), { type: 'warning' });
  } catch {
    return;
  }
  scenes.value = defaults();
  restoreDefaults.value = true;
  editing.value = false;
}
async function save() {
  if (!props.site?.id || !management.value) return;
  saving.value = true;
  try {
    const { data: current } = await siteOperator.get(props.site.id);
    if (current.configuration_revision !== management.value.configuration_revision) {
      ElMessage.warning(t('site.homeScenes.conflict'));
      await refresh();
      return;
    }
    const home = withHomeScenes({ ...current, home: current.home_source || current.home }, scenes.value.map(copyScene));
    if (restoreDefaults.value) home.scenes = null;
    await siteOperator.update(props.site.id, { home }, current.configuration_revision);
    await refresh();
    ElMessage.success(t('site.homeScenes.saved'));
  } catch (error: unknown) {
    const status = (error as { response?: { status?: number } })?.response?.status;
    ElMessage.error(
      status === 409 ? t('site.homeScenes.conflict') : extractApiErrorMessage(error) || t('site.homeScenes.saveFailed')
    );
    if (status === 409) await refresh();
  } finally {
    saving.value = false;
  }
}
</script>

<style lang="scss" scoped>
.scenes-setting,
.scene-list {
  display: grid;
  gap: var(--app-card-gap);
}
.scenes-heading,
.scene-row,
.scenes-footer,
.scene-actions,
.tool-row,
.cover-picker {
  display: flex;
  align-items: center;
  gap: 12px;
}
.scenes-heading,
.scenes-footer {
  justify-content: space-between;
  flex-wrap: wrap;
}
.scenes-heading h3 {
  margin: 0;
  font-size: 16px;
}
.scenes-heading p,
.scene-summary span,
.scene-summary small {
  color: var(--el-text-color-secondary);
}
.scenes-heading p {
  margin: 4px 0 0;
}
.scene-row {
  border: 1px solid var(--el-border-color);
  border-radius: 12px;
  padding: 12px;
  min-width: 0;
}
.scene-row > img,
.scene-cover {
  width: 96px;
  height: 66px;
  border-radius: 8px;
  object-fit: cover;
  background: var(--el-fill-color);
  flex: none;
}
.scene-summary {
  display: grid;
  gap: 3px;
  flex: 1;
  min-width: 0;
}
.scene-summary strong,
.scene-summary span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.scene-actions {
  flex: none;
}
.cover-picker {
  width: 100%;
  flex-wrap: wrap;
}
.cover-thumb,
.cover-placeholder {
  width: 170px;
  height: 96px;
  max-width: 100%;
  border-radius: 10px;
  object-fit: cover;
  background: var(--el-fill-color);
}
.el-select {
  width: 100%;
}
.tool-row {
  border-top: 1px solid var(--el-border-color-lighter);
  padding-block: 8px;
}
.tool-row span {
  flex: 1;
}
.preview-label {
  margin-block: 18px 8px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
.scene-preview {
  position: relative;
  height: 160px;
  max-width: 100%;
  border-radius: 12px;
  overflow: hidden;
  background: #111a27;
  color: #fff;
}
.scene-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.preview-copy {
  position: absolute;
  bottom: 16px;
  left: 16px;
  right: 16px;
  display: grid;
  gap: 4px;
  text-shadow: 0 2px 8px #000;
}
.preview-copy strong {
  font-size: 20px;
}
.scene-edit-form {
  padding-bottom: 6px;
}
.scene-edit-form .el-form-item {
  margin-bottom: 22px;
}
.scene-edit-form .el-input__suffix .auto-translate-toggle {
  margin-left: 0;
}
.scene-dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  flex-wrap: wrap;
}
.footer-actions {
  display: flex;
  gap: 10px;
  margin-left: auto;
}
.scene-dialog-footer .el-button + .el-button,
.footer-actions .el-button + .el-button {
  margin-left: 0;
}
@media (max-width: 600px) {
  .scene-dialog-footer {
    align-items: stretch;
  }
  .footer-actions {
    width: 100%;
    margin-left: 0;
  }
  .footer-actions .el-button {
    flex: 1;
  }
}
@media (max-width: 600px) {
  .scene-row {
    flex-wrap: wrap;
  }
  .scene-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
