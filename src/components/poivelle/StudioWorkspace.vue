<template>
  <main class="poivelle-studio">
    <studio-header
      :project-title="currentProject?.title"
      :graph-version="graph?.graph_version"
      :can-run="canEdit && (projection === 'overview' ? !!guideNextNode || guideRequiresReview : !!selectedNode)"
      :can-edit="canEdit"
      :primary-label="
        projection === 'overview'
          ? guideRequiresReview
            ? $t('poivelle.guide.chooseResults')
            : guidePrimaryLabel
          : undefined
      "
      @open-projects="projectDialogVisible = true"
      @home="$emit('back-home')"
      @commit="commitRevision"
      @run="runPrimary"
    />

    <div v-if="error" class="error-banner">
      <AlertTriangle :size="15" aria-hidden="true" />
      <span>{{ error }}</span>
      <button type="button" @click="bootstrap">{{ $t('poivelle.action.retry') }}</button>
    </div>

    <div v-if="loading && !graph" class="loading-state">
      <LoaderCircle :size="25" class="is-spinning" aria-hidden="true" />
      <span>{{ $t('poivelle.status.loading') }}</span>
    </div>

    <template v-else-if="currentProject && graph">
      <div class="studio-body">
        <production-rail
          v-if="projection !== 'overview'"
          :projects="projects"
          :current-project-id="currentProject.id"
          :assets="assets"
          :revisions="revisions"
          :can-edit="canEdit"
          @select-project="loadProject"
          @create-project="openProjectDialog"
          @import-asset="assetDialogVisible = true"
        />
        <section class="projection-workspace">
          <projection-tabs
            :model-value="projection"
            :can-edit="canEdit"
            @update:model-value="setProjection"
            @create-node="nodeDialogVisible = true"
          />
          <div class="projection-content">
            <project-guide
              v-if="projection === 'overview'"
              :project-title="currentProject.title"
              :graph="graph"
              :storyboard="storyboard"
              :artifacts="artifacts"
              :takes="takes"
              :selections="selections"
              :can-edit="canEdit"
              :busy="submitting"
              @generate-node="startNode"
              @open-storyboard="setProjection('storyboard')"
            />
            <graph-canvas
              v-else-if="projection === 'canvas'"
              :graph="graph"
              :selected-node-id="selectedNodeId"
              :can-edit="canEdit"
              @select-node="selectNode"
              @create-node="nodeDialogVisible = true"
            />
            <storyboard-view
              v-else-if="projection === 'storyboard'"
              :graph="graph"
              :storyboard="storyboard"
              :artifacts="artifacts"
              :takes="takes"
              :selections="selections"
              :selected-node-id="selectedNodeId"
              :can-edit="canEdit"
              :can-select="canEdit && revisions.length > 0"
              @select-node="selectNode"
              @select-take="selectTake"
            />
            <timeline-view
              v-else-if="projection === 'timeline'"
              :timeline="timeline"
              :graph="graph"
              :artifacts="artifacts"
              :can-edit="canEdit"
              @move-clip="moveTimelineClip"
            />
            <review-view
              v-else
              :graph="graph"
              :proposals="proposals"
              :revisions="revisions"
              :runs="runs"
              :active-run="activeRun"
              :evaluations="evaluations"
              :forensic-validations="forensicValidations"
              :costs="costs"
              :can-edit="canEdit"
              @reject-proposal="rejectProposal"
              @cancel-run="cancelRun"
              @open-run="loadRun"
              @retry-step="retryStep"
            />
          </div>
          <agent-dock
            v-if="projection !== 'overview'"
            :proposals="proposals"
            :selected-node-id="selectedNodeId"
            :skill="currentProject.active_skill"
            :can-edit="canEdit"
            @run="runSelected"
            @open-proposal="openProposal"
          />
        </section>
        <inspector-panel
          v-if="canEdit && projection === 'canvas'"
          :node="selectedNode"
          @update="updateNode"
          @delete="deleteNode"
        />
      </div>
    </template>

    <section v-else class="onboarding">
      <div class="onboarding-number">01 / STUDIO</div>
      <Film :size="34" stroke-width="1.25" aria-hidden="true" />
      <h1>{{ $t('poivelle.onboarding.title') }}</h1>
      <p>{{ $t('poivelle.onboarding.body') }}</p>
      <button v-if="!workspaces.length" type="button" @click="workspaceDialogVisible = true">
        <Plus :size="15" aria-hidden="true" />
        {{ $t('poivelle.workspace.create') }}
      </button>
      <button v-else-if="canEdit" type="button" @click="openProjectDialog">
        <Clapperboard :size="15" aria-hidden="true" />
        {{ $t('poivelle.project.create') }}
      </button>
    </section>

    <el-dialog v-model="workspaceDialogVisible" :title="$t('poivelle.workspace.create')" width="420px">
      <el-form label-position="top" @submit.prevent>
        <el-form-item :label="$t('poivelle.workspace.name')">
          <el-input v-model="workspaceForm.name" maxlength="120" autofocus />
        </el-form-item>
        <el-form-item :label="$t('poivelle.workspace.budget')">
          <el-input-number v-model="workspaceForm.monthly_limit_microcredits" :min="0" :step="1000000" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="workspaceDialogVisible = false">{{ $t('common.button.cancel') }}</el-button>
        <el-button type="primary" :loading="submitting" @click="createWorkspace">
          {{ $t('common.button.confirm') }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="projectDialogVisible" :title="$t('poivelle.project.create')" width="460px">
      <el-form label-position="top" @submit.prevent>
        <el-form-item :label="$t('poivelle.project.workspace')">
          <el-select v-model="projectForm.workspace_id" style="width: 100%">
            <el-option
              v-for="workspace in workspaces"
              :key="workspace.id"
              :label="workspace.name"
              :value="workspace.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('poivelle.project.title')">
          <el-input v-model="projectForm.title" maxlength="200" />
        </el-form-item>
        <el-form-item :label="$t('poivelle.project.workflow')">
          <el-segmented v-model="projectForm.workflow" :options="workflowOptions" block />
        </el-form-item>
        <template v-if="projectForm.workflow === 'commercial_tvc'">
          <el-form-item :label="$t('poivelle.project.productName')">
            <el-input v-model="projectForm.product_name" maxlength="120" />
          </el-form-item>
          <el-form-item :label="$t('poivelle.project.productCategory')">
            <el-input v-model="projectForm.product_category" maxlength="180" />
          </el-form-item>
          <el-form-item :label="$t('poivelle.project.brandTone')">
            <el-input v-model="projectForm.brand_tone" type="textarea" :rows="2" maxlength="240" />
          </el-form-item>
          <el-form-item :label="$t('poivelle.project.aspectRatio')">
            <el-segmented v-model="projectForm.aspect_ratio" :options="['16:9', '9:16', '1:1']" />
          </el-form-item>
        </template>
        <el-form-item :label="$t('poivelle.project.skill')">
          <el-select v-if="projectForm.workflow === 'blank'" v-model="projectForm.skill" style="width: 100%">
            <el-option label="Short drama · professional" value="film.drama.short@1.0.0" />
            <el-option label="Commercial film · professional" value="film.commercial@1.0.0" />
            <el-option label="Music video · professional" value="film.music-video@1.0.0" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="projectDialogVisible = false">{{ $t('common.button.cancel') }}</el-button>
        <el-button type="primary" :loading="submitting" @click="createProject">
          {{ $t('common.button.confirm') }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="nodeDialogVisible" :title="$t('poivelle.node.create')" width="460px">
      <el-form label-position="top" @submit.prevent>
        <el-form-item :label="$t('poivelle.field.type')">
          <el-select v-model="nodeForm.node_type" style="width: 100%">
            <el-option v-for="type in nodeTypes" :key="type" :label="type" :value="type" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('poivelle.field.title')">
          <el-input v-model="nodeForm.title" maxlength="240" />
        </el-form-item>
        <el-form-item :label="$t('poivelle.field.prompt')">
          <el-input v-model="nodeForm.prompt" type="textarea" :rows="5" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="nodeDialogVisible = false">{{ $t('common.button.cancel') }}</el-button>
        <el-button type="primary" :loading="submitting" @click="createNode">
          {{ $t('common.button.confirm') }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="assetDialogVisible" :title="$t('poivelle.asset.import')" width="500px">
      <el-form label-position="top" @submit.prevent>
        <el-form-item :label="$t('poivelle.asset.title')"
          ><el-input v-model="assetForm.title" maxlength="240"
        /></el-form-item>
        <el-form-item :label="$t('poivelle.field.type')">
          <el-select v-model="assetForm.kind" style="width: 100%">
            <el-option v-for="kind in assetKinds" :key="kind" :label="kind" :value="kind" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('poivelle.asset.url')"><el-input v-model="assetForm.source_url" /></el-form-item>
        <el-form-item :label="$t('poivelle.asset.hash')">
          <el-input v-model="assetForm.content_hash" placeholder="sha256:..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="assetDialogVisible = false">{{ $t('common.button.cancel') }}</el-button>
        <el-button type="primary" :loading="submitting" @click="importAsset">{{
          $t('common.button.confirm')
        }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="dryRunDialogVisible" :title="$t('poivelle.run.confirmTitle')" width="520px">
      <div v-if="dryRun" class="dry-run-summary">
        <div>
          <span>{{ $t('poivelle.run.targets') }}</span
          ><strong>{{ dryRun.dependency_closure.length }}</strong>
        </div>
        <div>
          <span>{{ $t('poivelle.run.maximum') }}</span
          ><strong>{{ formatCredits(dryRun.max_cost_microcredits) }}</strong>
        </div>
        <div>
          <span>{{ $t('poivelle.run.approval') }}</span
          ><strong>{{ dryRun.required_approval }}</strong>
        </div>
      </div>
      <p class="dry-run-note">{{ $t('poivelle.run.confirmBody') }}</p>
      <template #footer>
        <el-button @click="dryRunDialogVisible = false">{{ $t('common.button.cancel') }}</el-button>
        <el-button type="primary" :loading="submitting" @click="confirmRun">{{ $t('poivelle.run.confirm') }}</el-button>
      </template>
    </el-dialog>
  </main>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue';
import { useStore } from 'vuex';
import {
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElMessageBox,
  ElOption,
  ElSegmented,
  ElSelect
} from 'element-plus';
import { AlertTriangle, Clapperboard, Film, LoaderCircle, Plus } from '@lucide/vue';
import { t } from '@/i18n';
import {
  Status,
  type IPoivelleGraphNode,
  type IPoivelleStepRun,
  type PoivelleNodeType,
  type PoivelleProjection
} from '@/models';
import StudioHeader from './StudioHeader.vue';
import ProductionRail from './ProductionRail.vue';
import ProjectionTabs from './ProjectionTabs.vue';
import GraphCanvas from './GraphCanvas.vue';
import StoryboardView from './StoryboardView.vue';
import TimelineView from './TimelineView.vue';
import ReviewView from './ReviewView.vue';
import InspectorPanel from './InspectorPanel.vue';
import AgentDock from './AgentDock.vue';
import ProjectGuide from './ProjectGuide.vue';

defineEmits<{ 'back-home': [] }>();

const store = useStore();
const state = computed(() => store.state.poivelle);
const workspaces = computed(() => state.value?.workspaces ?? []);
const projects = computed(() => state.value?.projects ?? []);
const graph = computed(() => state.value?.graph);
const assets = computed(() => state.value?.assets ?? []);
const artifacts = computed(() => state.value?.artifacts ?? []);
const takes = computed(() => state.value?.takes ?? []);
const selections = computed(() => state.value?.selections ?? []);
const storyboard = computed(() => state.value?.storyboard);
const revisions = computed(() => state.value?.revisions ?? []);
const proposals = computed(() => state.value?.proposals ?? []);
const runs = computed(() => state.value?.runs ?? []);
const activeRun = computed(() => state.value?.activeRun);
const evaluations = computed(() => state.value?.evaluations ?? []);
const forensicValidations = computed(() => state.value?.forensicValidations ?? []);
const costs = computed(() => state.value?.costs);
const timeline = computed(() => state.value?.timeline);
const projection = computed<PoivelleProjection>(() => state.value?.projection ?? 'overview');
const selectedNodeId = computed<string | undefined>(() => state.value?.selectedNodeId);
const selectedNode = computed<IPoivelleGraphNode | undefined>(() =>
  graph.value?.nodes.find((node: IPoivelleGraphNode) => node.id === selectedNodeId.value)
);
const currentProject = computed(() =>
  projects.value.find((project: any) => project.id === state.value?.currentProjectId)
);
const canEdit = computed(() =>
  ['owner', 'producer', 'director', 'editor'].includes(state.value?.currentMembership?.role ?? '')
);
const dryRun = computed(() => state.value?.dryRun);
const error = computed(() => state.value?.error);
const loading = computed(() => [state.value?.status?.bootstrap, state.value?.status?.graph].includes(Status.Request));
const readyNodeIds = computed(
  () =>
    new Set([
      ...artifacts.value
        .filter((artifact: any) => artifact.state === 'committed')
        .flatMap((artifact: any) => artifact.node_id ?? []),
      ...takes.value.filter((take: any) => take.state === 'ready').map((take: any) => take.target_node_id)
    ])
);
const selectedNodeIds = computed(() => new Set(selections.value.map((selection: any) => selection.target_node_id)));
const guideImageNodeIds = computed(() =>
  storyboard.value
    ? storyboard.value.sections.flatMap((section: any) => section.shots.flatMap((shot: any) => shot.image_node_ids))
    : (graph.value?.nodes
        .filter((node: IPoivelleGraphNode) => node.node_type === 'image')
        .map((node: IPoivelleGraphNode) => node.id) ?? [])
);
const guideVideoNodeIds = computed(() =>
  storyboard.value
    ? storyboard.value.sections.flatMap((section: any) => section.shots.flatMap((shot: any) => shot.video_node_ids))
    : (graph.value?.nodes
        .filter((node: IPoivelleGraphNode) => node.node_type === 'video')
        .map((node: IPoivelleGraphNode) => node.id) ?? [])
);
const guideRequiresReview = computed(
  () =>
    (guideImageNodeIds.value.length > 0 &&
      guideImageNodeIds.value.every((nodeId: string) => readyNodeIds.value.has(nodeId)) &&
      guideImageNodeIds.value.some((nodeId: string) => !selectedNodeIds.value.has(nodeId))) ||
    (guideVideoNodeIds.value.length > 0 &&
      guideVideoNodeIds.value.every((nodeId: string) => readyNodeIds.value.has(nodeId)) &&
      guideVideoNodeIds.value.some((nodeId: string) => !selectedNodeIds.value.has(nodeId)))
);
const guideNextNode = computed(() => {
  const nextImageId = guideImageNodeIds.value.find((nodeId: string) => !readyNodeIds.value.has(nodeId));
  if (nextImageId) return graph.value?.nodes.find((node: IPoivelleGraphNode) => node.id === nextImageId);
  if (guideImageNodeIds.value.some((nodeId: string) => !selectedNodeIds.value.has(nodeId))) return undefined;
  const nextVideoId = guideVideoNodeIds.value.find((nodeId: string) => !readyNodeIds.value.has(nodeId));
  if (nextVideoId) return graph.value?.nodes.find((node: IPoivelleGraphNode) => node.id === nextVideoId);
  if (guideVideoNodeIds.value.some((nodeId: string) => !selectedNodeIds.value.has(nodeId))) return undefined;
  const node = graph.value?.nodes.find(
    (item: IPoivelleGraphNode) => item.node_type === 'audio' && !readyNodeIds.value.has(item.id)
  );
  if (node) return node;
  return undefined;
});
const guidePrimaryLabel = computed(() => {
  if (guideNextNode.value?.node_type === 'image') return t('poivelle.guide.generateNextFrame');
  if (guideNextNode.value?.node_type === 'video') return t('poivelle.guide.generateNextMotion');
  if (guideNextNode.value?.node_type === 'audio') return t('poivelle.guide.generateScore');
  return t('poivelle.guide.continue');
});

const submitting = ref(false);
const workspaceDialogVisible = ref(false);
const projectDialogVisible = ref(false);
const nodeDialogVisible = ref(false);
const assetDialogVisible = ref(false);
const dryRunDialogVisible = ref(false);
const workspaceForm = reactive({ name: '', monthly_limit_microcredits: undefined as number | undefined });
const projectForm = reactive({
  workspace_id: '',
  title: '',
  workflow: 'blank' as 'blank' | 'commercial_tvc',
  skill: 'film.drama.short@1.0.0',
  product_name: '',
  product_category: 'professional action imaging device',
  brand_tone: 'precise, fearless, cinematic, premium',
  aspect_ratio: '16:9' as '16:9' | '9:16' | '1:1'
});
const workflowOptions = [
  { label: t('poivelle.project.blankWorkflow'), value: 'blank' },
  { label: t('poivelle.project.commercialTVC'), value: 'commercial_tvc' }
];
const nodeForm = reactive({ node_type: 'scene' as PoivelleNodeType, title: '', prompt: '' });
const assetForm = reactive({ title: '', kind: 'image', source_url: '', content_hash: '' });
const nodeTypes: PoivelleNodeType[] = [
  'script',
  'character',
  'location',
  'prop',
  'storyboard',
  'scene',
  'shot',
  'image',
  'video',
  'audio',
  'subtitle',
  'composition',
  'output',
  'note'
];
const assetKinds = ['character', 'location', 'prop', 'image', 'video', 'voice', 'music', 'sfx', 'brand'];

const bootstrap = () => store.dispatch('poivelle/bootstrap');
const loadProject = (projectId: string) => store.dispatch('poivelle/loadProject', projectId);
const selectNode = (nodeId?: string) => store.dispatch('poivelle/selectNode', nodeId);
const setProjection = (value: PoivelleProjection) => store.dispatch('poivelle/setProjection', value);
const openProjectDialog = () => {
  projectForm.workspace_id = state.value?.currentWorkspaceId ?? workspaces.value[0]?.id ?? '';
  projectDialogVisible.value = true;
};
const createWorkspace = async () => {
  if (!workspaceForm.name.trim()) return;
  await submittingTask(async () => {
    await store.dispatch('poivelle/createWorkspace', { ...workspaceForm, name: workspaceForm.name.trim() });
    workspaceDialogVisible.value = false;
    openProjectDialog();
  });
};
const createProject = async () => {
  if (!projectForm.workspace_id || !projectForm.title.trim()) return;
  await submittingTask(async () => {
    if (projectForm.workflow === 'commercial_tvc') {
      await store.dispatch('poivelle/createCommercialTVCProject', {
        workspace_id: projectForm.workspace_id,
        title: projectForm.title.trim(),
        product_name: projectForm.product_name.trim() || projectForm.title.trim(),
        product_category: projectForm.product_category.trim(),
        brand_tone: projectForm.brand_tone.trim(),
        aspect_ratio: projectForm.aspect_ratio,
        managed_execution: false
      });
      setProjection('storyboard');
    } else {
      await store.dispatch('poivelle/createProject', {
        workspace_id: projectForm.workspace_id,
        title: projectForm.title.trim(),
        skill: projectForm.skill,
        domain: 'film.drama.short'
      });
    }
    projectDialogVisible.value = false;
    projectForm.title = '';
  });
};
const createNode = async () => {
  if (!nodeForm.title.trim()) return;
  await submittingTask(async () => {
    await store.dispatch('poivelle/createNode', {
      node_type: nodeForm.node_type,
      title: nodeForm.title.trim(),
      payload: { prompt: nodeForm.prompt }
    });
    nodeDialogVisible.value = false;
    nodeForm.title = '';
    nodeForm.prompt = '';
  });
};
const importAsset = async () => {
  if (!state.value?.currentWorkspaceId || !assetForm.title || !assetForm.source_url || !assetForm.content_hash) return;
  await submittingTask(async () => {
    await store.dispatch('poivelle/importAsset', { ...assetForm, project_id: state.value.currentProjectId });
    assetDialogVisible.value = false;
  });
};
const updateNode = (payload: { path: string; value: unknown }) =>
  store.dispatch('poivelle/updateSelectedNode', payload);
const deleteNode = async () => {
  await ElMessageBox.confirm(t('poivelle.node.deleteConfirm'), '', { type: 'warning' });
  await store.dispatch('poivelle/deleteSelectedNode');
};
const commitRevision = async () => {
  await store.dispatch('poivelle/commitRevision', 'Studio checkpoint');
  ElMessage.success(t('poivelle.revision.committed'));
};
const runSelected = async () => {
  if (!selectedNode.value) return;
  await submittingTask(async () => {
    await store.dispatch('poivelle/dryRun', selectedNode.value?.node_type === 'composition' ? 'compose' : 'generate');
    dryRunDialogVisible.value = true;
  });
};
const startNode = async (nodeId: string) => {
  await selectNode(nodeId);
  await nextTick();
  await runSelected();
};
const runPrimary = async () => {
  if (projection.value === 'overview') {
    if (guideNextNode.value) await startNode(guideNextNode.value.id);
    else if (guideRequiresReview.value) setProjection('storyboard');
    return;
  }
  if (selectedNode.value) {
    await runSelected();
  }
};
const confirmRun = async () => {
  await submittingTask(async () => {
    const run = await store.dispatch('poivelle/confirmDryRun');
    dryRunDialogVisible.value = false;
    if (run) ElMessage.success(t('poivelle.run.queued'));
  });
};
const openProposal = (proposalId: string) => {
  setProjection('review');
  ElMessage.info(`${t('poivelle.agent.proposal')} ${proposalId.slice(-8)}`);
};
const rejectProposal = async (proposalId: string) => {
  await ElMessageBox.confirm(t('poivelle.review.rejectConfirm'), '', { type: 'warning' });
  await submittingTask(() => store.dispatch('poivelle/rejectProposal', proposalId));
};
const cancelRun = async (runId: string) => {
  await ElMessageBox.confirm(t('poivelle.run.cancelConfirm'), '', { type: 'warning' });
  await submittingTask(() => store.dispatch('poivelle/cancelRun', runId));
};
const loadRun = (runId: string) => submittingTask(() => store.dispatch('poivelle/loadRun', runId));
const retryStep = async (step: IPoivelleStepRun) => {
  await submittingTask(async () => {
    await store.dispatch('poivelle/retryStep', step);
    dryRunDialogVisible.value = true;
  });
};
const moveTimelineClip = async (payload: { trackId: string; clipId: string; direction: -1 | 1 }) => {
  if (!timeline.value) return;
  const clips = timeline.value.clips.map((clip: any) => ({ ...clip }));
  const trackClips = clips
    .filter((clip: any) => clip.track_id === payload.trackId)
    .sort((left: any, right: any) => left.timeline_start_ms - right.timeline_start_ms);
  const currentIndex = trackClips.findIndex((clip: any) => clip.id === payload.clipId);
  const nextIndex = currentIndex + payload.direction;
  if (currentIndex < 0 || nextIndex < 0 || nextIndex >= trackClips.length) return;
  [trackClips[currentIndex], trackClips[nextIndex]] = [trackClips[nextIndex], trackClips[currentIndex]];
  let cursor = 0;
  trackClips.forEach((clip: any) => {
    const speed = typeof clip.speed === 'number' && Number.isFinite(clip.speed) && clip.speed > 0 ? clip.speed : 1;
    clip.timeline_start_ms = cursor;
    cursor += (clip.source_out_ms - clip.source_in_ms) / speed;
  });
  await submittingTask(() => store.dispatch('poivelle/saveTimeline', { ...timeline.value, clips }));
};
const selectTake = async (payload: { target_node_id: string; take_id: string }) => {
  await submittingTask(async () => {
    await store.dispatch('poivelle/selectTake', payload);
    ElMessage.success(t('poivelle.storyboard.selectionSaved'));
  });
};
const formatCredits = (microcredits: number) => `${(microcredits / 1_000_000).toFixed(2)} credits`;
const submittingTask = async (task: () => Promise<void>) => {
  submitting.value = true;
  try {
    await task();
  } catch (error: any) {
    ElMessage.error(
      error?.response?.data?.detail?.message ??
        error?.response?.data?.detail ??
        error?.message ??
        t('poivelle.error.generic')
    );
  } finally {
    submitting.value = false;
  }
};

onMounted(bootstrap);
</script>

<style scoped>
.poivelle-studio {
  --poivelle-ink: var(--el-text-color-primary);
  --poivelle-muted: var(--el-text-color-secondary);
  --poivelle-red: var(--app-brand-hex);
  --poivelle-green: var(--el-color-success);
  --poivelle-mint: var(--app-badge-bg);
  --poivelle-paper: var(--app-bg-surface);
  --poivelle-canvas: var(--app-bg-section);
  --poivelle-hover: rgba(var(--app-brand-rgb), 0.08);
  --poivelle-line: var(--app-border-subtle);
  --poivelle-line-strong: var(--el-border-color);
  --poivelle-grid: rgba(var(--app-brand-rgb), 0.055);
  --poivelle-radius: var(--adc-radius-card);
  --poivelle-radius-small: var(--adc-radius-control);
  --poivelle-shadow: var(--app-shadow-sm);
  --poivelle-media-stage: #050706;
  --poivelle-media-overlay: rgb(5 7 6 / 78%);
  --poivelle-on-media: var(--el-color-white);
  --poivelle-on-media-danger: var(--el-color-danger-light-3);
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  color: var(--poivelle-ink);
  background: var(--poivelle-canvas);
  font-family: var(--adc-font-family-sans);
}

.studio-body {
  display: flex;
  flex: 1;
  min-height: 0;
}
.projection-workspace {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}
.projection-content {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.error-banner {
  display: flex;
  align-items: center;
  min-height: 36px;
  gap: 8px;
  padding: 0 12px;
  border-bottom: 1px solid color-mix(in srgb, var(--el-color-danger) 28%, transparent);
  color: var(--el-color-danger);
  background: color-mix(in srgb, var(--el-color-danger) 9%, var(--poivelle-paper));
  font-size: 12px;
}
.error-banner span {
  flex: 1;
}
.error-banner button {
  border: 0;
  color: inherit;
  background: transparent;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.loading-state,
.onboarding {
  display: grid;
  place-content: center;
  justify-items: center;
  flex: 1;
  color: var(--poivelle-muted);
}
.loading-state {
  gap: 10px;
  font-size: 12px;
}
.is-spinning {
  animation: spin 0.9s linear infinite;
}
.onboarding {
  padding: 28px;
  text-align: center;
  background: var(--poivelle-canvas);
}
.onboarding-number {
  margin-bottom: 20px;
  color: var(--app-brand-hex);
  font-size: 11px;
  font-weight: 650;
}
.onboarding h1 {
  max-width: 620px;
  margin: 15px 0 8px;
  font-size: 30px;
  font-weight: 650;
  letter-spacing: 0;
}
.onboarding > p {
  max-width: 520px;
  margin: 0 0 22px;
  color: var(--poivelle-muted);
  font-size: 14px;
  line-height: 1.6;
}
.onboarding > button {
  display: flex;
  align-items: center;
  height: 38px;
  gap: 8px;
  padding: 0 15px;
  border: 1px solid var(--app-brand-hex);
  border-radius: var(--poivelle-radius-small);
  color: #fff;
  background: var(--app-brand-hex);
  box-shadow: var(--app-shadow-sm);
  font: inherit;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

.dry-run-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border: 1px solid var(--poivelle-line-strong);
  border-radius: var(--poivelle-radius);
  overflow: hidden;
}
.dry-run-summary div {
  display: grid;
  gap: 5px;
  padding: 12px;
  border-right: 1px solid var(--poivelle-line);
}
.dry-run-summary div:last-child {
  border-right: 0;
}
.dry-run-summary span {
  color: var(--poivelle-muted);
  font-size: 10px;
}
.dry-run-summary strong {
  font-size: 13px;
}
.dry-run-note {
  margin: 14px 0 0;
  color: var(--poivelle-muted);
  font-size: 11px;
  line-height: 1.5;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 767px) {
  .studio-body {
    overflow: hidden;
  }
  .projection-content {
    overflow: auto;
  }
  .onboarding h1 {
    font-size: 29px;
  }
  .dry-run-summary {
    grid-template-columns: 1fr;
  }
  .dry-run-summary div {
    border-right: 0;
    border-bottom: 1px solid var(--poivelle-line);
  }
}
</style>
