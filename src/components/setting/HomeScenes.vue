<template>
  <section class="scenes-setting">
    <header class="scenes-heading">
      <div>
        <h3>{{ $t('site.homeScenes.title') }}</h3>
        <p>{{ $t('site.homeScenes.tip') }}</p>
      </div>
      <el-button type="primary" :disabled="!management || saving" @click="addScene">
        {{ $t('site.homeScenes.add') }}
      </el-button>
    </header>
    <div class="scene-copy">
      <label for="scene-heading">{{ $t('site.homeScenes.heading') }}</label>
      <el-input id="scene-heading" v-model="heading" :placeholder="$t('intro.home.quick.title')" maxlength="120" />
      <auto-translate-toggle
        v-if="site?.id && heading"
        model="site"
        field="home.heading"
        :object-id="site.id"
        :enabled="autoFields.includes('heading')"
        :current-value="heading"
        @enabled-success="refresh"
        @disabled-success="refresh"
      />
      <label for="scene-subtitle">{{ $t('site.homeScenes.subtitle') }}</label>
      <el-input id="scene-subtitle" v-model="subtitle" :placeholder="$t('intro.home.quick.subtitle')" maxlength="240" />
      <auto-translate-toggle
        v-if="site?.id && subtitle"
        model="site"
        field="home.subtitle"
        :object-id="site.id"
        :enabled="autoFields.includes('subtitle')"
        :current-value="subtitle"
        @enabled-success="refresh"
        @disabled-success="refresh"
      />
    </div>
    <div class="scene-list">
      <article v-for="(scene, index) in scenes" :key="scene.id" class="scene-editor">
        <div class="scene-toolbar">
          <strong>{{ scene.title || $t('site.homeScenes.untitled') }}</strong>
          <div>
            <el-button :disabled="index === 0" :aria-label="$t('site.homeScenes.up')" @click="moveScene(index, -1)"
              >↑</el-button
            >
            <el-button
              :disabled="index === scenes.length - 1"
              :aria-label="$t('site.homeScenes.down')"
              @click="moveScene(index, 1)"
              >↓</el-button
            >
            <el-switch v-model="scene.visible" :aria-label="$t('site.homeScenes.visible')" />
            <el-button type="danger" plain @click="removeScene(index)">{{ $t('site.homeScenes.remove') }}</el-button>
          </div>
        </div>
        <div class="scene-fields">
          <label :for="`scene-title-${scene.id}`">{{ $t('site.homeScenes.sceneTitle') }}</label>
          <div class="scene-input">
            <el-input :id="`scene-title-${scene.id}`" v-model="scene.title" maxlength="120" />
            <auto-translate-toggle
              v-if="site?.id && scene.title && savedIds.has(scene.id)"
              model="site"
              :field="`home.scenes.${scene.id}.title`"
              :object-id="site.id"
              :enabled="autoFields.includes(`scenes.${scene.id}.title`)"
              :current-value="scene.title"
              @enabled-success="refresh"
              @disabled-success="refresh"
            />
          </div>
          <label :for="`scene-description-${scene.id}`">{{ $t('site.homeScenes.sceneDescription') }}</label>
          <div class="scene-input">
            <el-input :id="`scene-description-${scene.id}`" v-model="scene.description" maxlength="240" />
            <auto-translate-toggle
              v-if="site?.id && scene.description && savedIds.has(scene.id)"
              model="site"
              :field="`home.scenes.${scene.id}.description`"
              :object-id="site.id"
              :enabled="autoFields.includes(`scenes.${scene.id}.description`)"
              :current-value="scene.description"
              @enabled-success="refresh"
              @disabled-success="refresh"
            />
          </div>
          <label :for="`scene-image-${scene.id}`">{{ $t('site.homeScenes.image') }}</label>
          <div class="scene-input">
            <el-input
              :id="`scene-image-${scene.id}`"
              v-model="scene.image_url"
              maxlength="2048"
              placeholder="https://"
            />
            <el-button @click="editingImageId = scene.id">{{ $t('site.homeScenes.upload') }}</el-button>
          </div>
          <img v-if="scene.image_url" :src="scene.image_url" class="scene-preview" :alt="scene.title" />
          <label :for="`scene-tools-${scene.id}`">{{ $t('site.homeScenes.tools') }}</label>
          <el-select
            :id="`scene-tools-${scene.id}`"
            :model-value="scene.tools.map((tool) => tool.capability)"
            multiple
            filterable
            :placeholder="$t('site.homeScenes.chooseTools')"
            @change="selectTools(scene, $event as CapabilityKey[])"
          >
            <el-option
              v-for="tool in catalog"
              :key="tool.capability"
              :label="`${tool.name}${tool.enabled ? '' : ` (${$t('site.homeScenes.disabled')})`}`"
              :value="tool.capability"
            />
          </el-select>
        </div>
        <div v-for="(tool, toolIndex) in scene.tools" :key="tool.capability" class="tool-row">
          <strong>{{ toolName(tool.capability) }}</strong>
          <el-input v-model="tool.description" :placeholder="$t('site.homeScenes.toolDescription')" maxlength="240" />
          <auto-translate-toggle
            v-if="
              site?.id && tool.description && savedIds.has(scene.id) && savedTools[scene.id]?.includes(tool.capability)
            "
            model="site"
            :field="`home.scenes.${scene.id}.tools.${tool.capability}.description`"
            :object-id="site.id"
            :enabled="autoFields.includes(`scenes.${scene.id}.tools.${tool.capability}.description`)"
            :current-value="tool.description"
            @enabled-success="refresh"
            @disabled-success="refresh"
          />
          <el-button
            :disabled="toolIndex === 0"
            :aria-label="$t('site.homeScenes.up')"
            @click="moveTool(scene, toolIndex, -1)"
            >↑</el-button
          >
          <el-button
            :disabled="toolIndex === scene.tools.length - 1"
            :aria-label="$t('site.homeScenes.down')"
            @click="moveTool(scene, toolIndex, 1)"
            >↓</el-button
          >
        </div>
      </article>
    </div>
    <div class="scenes-actions">
      <el-button :disabled="saving || !management" @click="resetDefaults">{{
        $t('site.homeScenes.defaults')
      }}</el-button>
      <el-button type="primary" :loading="saving" :disabled="!management" @click="save">{{
        $t('site.homeScenes.save')
      }}</el-button>
    </div>
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
import { ElButton, ElInput, ElMessage, ElOption, ElSelect, ElSwitch } from 'element-plus';
import type { CapabilityKey } from '@/constants/capabilities';
import type { ISite, ISiteHomeScene } from '@/models';
import { HOME_CATEGORIES, HOME_CAPABILITY_DEFINITIONS } from '@/pages/home/data';
import { siteOperator } from '@/operators';
import { resolveCapabilityPresentation } from '@/utils/capabilityPresentation';
import { CAPABILITY_ICONS } from '@/constants/capabilities';
import { withHomeScenes } from '@/utils/siteHome';
import { extractApiErrorMessage } from '@/utils/apiError';
import ImageCropper from '@/components/common/ImageCropper.vue';
import AutoTranslateToggle from '@/components/site/AutoTranslateToggle.vue';

const props = defineProps<{ site: ISite | null | undefined }>();
const emit = defineEmits<{ saved: [] }>();
const { t } = useI18n();
const scenes = ref<ISiteHomeScene[]>([]);
const management = ref<ISite | null>(null);
const heading = ref('');
const subtitle = ref('');
const saving = ref(false);
const restoreDefaults = ref(false);
const editingImageId = ref<string>();
const cropperVisible = computed({
  get: () => Boolean(editingImageId.value),
  set: (value: boolean) => {
    if (!value) editingImageId.value = undefined;
  }
});
const autoFields = computed(() => management.value?.home_auto_translated_fields || []);
const savedIds = computed(() => new Set(management.value?.home_source?.scenes?.map((scene) => scene.id) || []));
const savedTools = computed(() =>
  Object.fromEntries(
    (management.value?.home_source?.scenes || []).map((scene) => [scene.id, scene.tools.map((tool) => tool.capability)])
  )
);
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
    visible: !(management.value?.home_source?.sections?.categories?.disabled_item_ids || []).includes(category.id),
    tools: category.candidates.map((tool) => ({ capability: tool.capability }))
  }));
}

function copyScenes(rows: ISiteHomeScene[]): ISiteHomeScene[] {
  return rows.map((scene) => ({ ...scene, tools: scene.tools.map((tool) => ({ ...tool })) }));
}

function hydrate() {
  const source = management.value?.home_source || management.value?.home;
  restoreDefaults.value = false;
  scenes.value = source?.scenes ? copyScenes(source.scenes) : defaults();
  heading.value = source?.heading || '';
  subtitle.value = source?.subtitle || '';
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

function addScene() {
  if (scenes.value.length >= 16) return;
  restoreDefaults.value = false;
  scenes.value.push({ id: crypto.randomUUID(), title: '', description: '', visible: true, tools: [] });
}
function removeScene(index: number) {
  scenes.value.splice(index, 1);
}
function moveScene(index: number, delta: number) {
  const [scene] = scenes.value.splice(index, 1);
  scenes.value.splice(index + delta, 0, scene);
}
function moveTool(scene: ISiteHomeScene, index: number, delta: number) {
  const [tool] = scene.tools.splice(index, 1);
  scene.tools.splice(index + delta, 0, tool);
}
function selectTools(scene: ISiteHomeScene, selected: CapabilityKey[]) {
  scene.tools = selected.map(
    (capability) => scene.tools.find((tool) => tool.capability === capability) || { capability }
  );
}
function toolName(capability: CapabilityKey): string {
  return catalog.value.find((item) => item.capability === capability)?.name || capability;
}
function onImageUploaded(url: string) {
  const scene = scenes.value.find((item) => item.id === editingImageId.value);
  if (scene) scene.image_url = url;
  editingImageId.value = undefined;
}
async function resetDefaults() {
  restoreDefaults.value = true;
  scenes.value = defaults();
  heading.value = '';
  subtitle.value = '';
  await save();
}
async function save() {
  if (!props.site?.id || !management.value) return;
  if (!restoreDefaults.value && scenes.value.some((scene) => !scene.title.trim())) {
    ElMessage.warning(t('site.homeScenes.titleRequired'));
    return;
  }
  saving.value = true;
  try {
    const { data: current } = await siteOperator.get(props.site.id);
    if (current.configuration_revision !== management.value.configuration_revision) {
      ElMessage.warning(t('site.homeScenes.conflict'));
      await refresh();
      return;
    }
    const cleanedScenes = copyScenes(scenes.value).map((scene) => {
      if (!scene.image_url?.trim()) delete scene.image_url;
      scene.tools = scene.tools.map((tool) => (tool.description?.trim() ? tool : { capability: tool.capability }));
      return scene;
    });
    const home = withHomeScenes(
      { ...current, home: current.home_source || current.home },
      cleanedScenes,
      heading.value,
      subtitle.value
    );
    if (restoreDefaults.value) {
      home.scenes = null;
    }
    if (!heading.value.trim()) home.heading = null;
    if (!subtitle.value.trim()) home.subtitle = null;
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
.scenes-setting {
  display: grid;
  gap: 16px;
}
.scenes-heading,
.scene-toolbar,
.scenes-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.scenes-heading h3 {
  margin: 0;
  font-size: 16px;
}
.scenes-heading p {
  margin: 4px 0 0;
  color: var(--el-text-color-secondary);
}
.scene-copy,
.scene-fields {
  display: grid;
  gap: 8px;
}
.scene-copy label,
.scene-fields label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.scene-list {
  display: grid;
  gap: 12px;
}
.scene-editor {
  padding: 16px;
  border: 1px solid var(--el-border-color);
  border-radius: 12px;
  min-width: 0;
}
.scene-toolbar > div,
.scene-input,
.tool-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex-wrap: wrap;
}
.scene-toolbar {
  margin-bottom: 12px;
}
.scene-input .el-input {
  flex: 1 1 220px;
}
.scene-preview {
  display: block;
  width: 100%;
  max-width: 420px;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  border-radius: 10px;
  margin-block: 8px;
}
.tool-row {
  padding-block: 8px;
  border-top: 1px solid var(--el-border-color-lighter);
}
.tool-row strong {
  min-width: 120px;
}
.tool-row .el-input {
  flex: 1 1 220px;
}
@media (max-width: 600px) {
  .scene-editor {
    padding: 12px;
  }
  .tool-row strong {
    width: 100%;
  }
}
</style>
