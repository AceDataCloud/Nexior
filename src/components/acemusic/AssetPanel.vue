<template>
  <div class="space-y-2 mb-4">
    <label class="field-label" for="acemusic-assets">{{ $t('acemusic.asset.label') }}</label>
    <div class="flex items-center gap-2">
      <el-select
        id="acemusic-assets"
        :model-value="selectedId"
        class="min-w-0 flex-1"
        clearable
        filterable
        @change="select"
      >
        <el-option
          v-for="asset in items"
          :key="asset.id"
          :value="asset.id"
          :label="asset.name || asset.id"
          :disabled="asset.status !== 'available' || !types.includes(asset.type)"
        >
          {{ asset.name || asset.id }} · {{ typeLabel(asset.type)
          }}{{ asset.status === 'expired' ? ' · ' + $t('acemusic.asset.expired') : '' }}
        </el-option>
      </el-select>
      <el-button :loading="loading" @click="loadPage">{{ $t('common.button.refresh') }}</el-button>
    </div>
    <el-pagination
      v-if="count > 20"
      v-model:current-page="page"
      :page-size="20"
      :total="count"
      layout="prev, pager, next"
      small
    />
    <details v-if="types.length || pending" class="pt-1">
      <summary class="cursor-pointer">{{ $t('acemusic.asset.import') }}</summary>
      <div v-if="types.length && !pending" class="space-y-2 pt-2">
        <el-select v-model="type" :aria-label="$t('acemusic.asset.type')">
          <el-option v-for="kind in types" :key="kind" :value="kind" :label="typeLabel(kind)" />
        </el-select>
        <input type="file" class="block max-w-full" :accept="accept" :disabled="busy" @change="prepareFile" />
        <el-input v-model="url" :aria-label="$t('acemusic.asset.url')" placeholder="https://…" :disabled="busy" />
        <service-pricing-summary :service="service" :value="price" />
      </div>
      <p v-if="pending?.taskId" class="break-all">{{ $t('acemusic.field.taskId') }} · {{ pending.taskId }}</p>
      <el-button :loading="busy" :disabled="!pending && (!type || !url.trim())" @click="submitOrCheck">
        {{ $t(pending ? 'acemusic.asset.check' : 'acemusic.asset.import') }}
      </el-button>
    </details>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useStore } from 'vuex';
import { ElButton, ElInput, ElMessage, ElOption, ElPagination, ElSelect } from 'element-plus';
import { t } from '@/i18n';
import type { AcemusicAssetType, IAcemusicAsset, IAcemusicAssetUpload, IAcemusicSubmission } from '@/models';
import { acemusicOperator } from '@/operators/acemusic';
import { httpClient } from '@/operators/common';
import { ensureLoggedIn, getConsumption } from '@/utils';
import { formatBytes, isUploadSizeAllowed } from '@/utils/uploadSize';
import {
  isDefiniteAcemusicRejection,
  pendingAcemusicSubmission,
  prepareAcemusicSubmission,
  settleAcemusicSubmission
} from '@/utils/acemusicSubmission';
import ServicePricingSummary from '@/components/common/ServicePricingSummary.vue';

const props = defineProps<{ types: readonly AcemusicAssetType[] }>();
const store = useStore();
const token = computed(() => store.state.acemusic.credential?.token as string | undefined);
const scope = computed(() => JSON.stringify([store.state.user?.id, store.state.acemusic.application?.id, token.value]));
const service = computed(() => store.state.acemusic.service);
const selectedId = computed(() => store.state.acemusic.config?.asset_id);
const pending = computed(() => pendingAcemusicSubmission(store, 'assets'));
const type = ref<AcemusicAssetType>();
const typeLabel = (kind: AcemusicAssetType) => (kind === 'midi' ? 'MIDI' : t('common.nav.' + kind));
const maxAssetBytes = 32 * 1024 * 1024;
const accept = computed(
  () =>
    ({ midi: '.mid,.midi', image: 'image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp', video: 'video/mp4,.mp4' })[
      type.value || 'midi'
    ]
);
const price = computed(() =>
  type.value && service.value?.cost?.length
    ? getConsumption({ action: 'upload', type: type.value }, service.value.cost)
    : undefined
);
const page = ref(1),
  count = ref(0),
  items = ref<IAcemusicAsset[]>([]);
const url = ref(''),
  name = ref(''),
  busy = ref(false),
  loading = ref(false);
let revision = 0;
let mounted = true;
onBeforeUnmount(() => {
  mounted = false;
  revision++;
});
const current = (owner: string) => mounted && scope.value === owner;
const report = (error: any) => ElMessage.error(error?.response?.data?.error?.message || t('acemusic.message.failed'));
function select(id?: string) {
  const asset = items.value.find((x) => x.id === id && x.status === 'available' && props.types.includes(x.type));
  const config = store.state.acemusic.config;
  store.commit('acemusic/setConfig', {
    ...config,
    asset_id: asset?.id,
    asset_type: asset?.type,
    ...(asset ? { model: 'acemusic-v1.1' } : {})
  });
}
async function loadPage() {
  const version = ++revision;
  if (!token.value) return;
  loading.value = true;
  try {
    const { data } = await acemusicOperator.assets(page.value, { token: token.value });
    if (version === revision) {
      items.value = data.items;
      count.value = data.count;
    }
  } catch (error) {
    if (version === revision) report(error);
  } finally {
    if (version === revision) loading.value = false;
  }
}
watch(
  scope,
  (_, prev) => {
    items.value = [];
    count.value = 0;
    url.value = '';
    name.value = '';
    busy.value = false;
    loading.value = false;
    revision++;
    if (prev && selectedId.value) select();
    if (page.value !== 1) page.value = 1;
    else void loadPage();
  },
  { immediate: true }
);
watch(page, loadPage);
watch(
  () => props.types,
  (types) => {
    if (!type.value || !types.includes(type.value)) type.value = types[0];
  },
  { immediate: true }
);
watch(type, () => {
  url.value = '';
  name.value = '';
});
async function prepareFile(event: Event) {
  const input = event.target as HTMLInputElement,
    file = input.files?.[0];
  input.value = '';
  if (!file || !ensureLoggedIn()) return;
  if (!isUploadSizeAllowed(file.size, maxAssetBytes)) {
    ElMessage.warning(
      t('common.message.uploadTooLarge', { size: formatBytes(file.size), max: formatBytes(maxAssetBytes) })
    );
    return;
  }
  const owner = scope.value,
    kind = type.value;
  busy.value = true;
  try {
    const body = new FormData();
    body.append('file', file);
    const { data } = await httpClient.post<{ file_url: string }>('/files/', body);
    if (current(owner) && type.value === kind) {
      url.value = data.file_url;
      name.value = file.name;
    }
  } catch (error) {
    if (current(owner)) report(error);
  } finally {
    if (current(owner)) busy.value = false;
  }
}
async function submitOrCheck() {
  if (busy.value || !ensureLoggedIn()) return;
  if (!token.value || !store.state.user?.id || !store.state.acemusic.application?.id) {
    ElMessage.warning(t('acemusic.message.credential'));
    return;
  }
  const owner = scope.value,
    options = { token: token.value };
  let saved: IAcemusicSubmission | undefined = pending.value;
  if (!saved) {
    if (!type.value || !props.types.includes(type.value)) return;
    saved = prepareAcemusicSubmission(store, 'assets', {
      action: 'upload',
      type: type.value,
      url: url.value.trim(),
      ...(name.value ? { name: name.value } : {}),
      async: true
    });
  }
  busy.value = true;
  try {
    if (!saved.taskId) {
      const { data } = await acemusicOperator.uploadAsset(saved.request as IAcemusicAssetUpload, {
        ...options,
        idempotencyKey: saved.key
      });
      if (!current(owner)) return;
      if (!data.task_id) throw new Error('Missing task ID');
      saved = { ...saved, taskId: data.task_id };
      store.commit('acemusic/setSubmission', saved);
    }
    const { data } = await acemusicOperator.task<{
      state: string;
      response?: { success: boolean; data?: IAcemusicAsset; error?: { message: string } };
    }>(saved.taskId!, options);
    if (!current(owner)) return;
    if (data.state === 'succeeded' && data.response?.data?.id) {
      const asset = data.response.data;
      settleAcemusicSubmission(store, saved);
      url.value = '';
      name.value = '';
      items.value = [asset, ...items.value.filter((x) => x.id !== asset.id)];
      select(asset.id);
      if (page.value !== 1) page.value = 1;
      else await loadPage();
    } else if (['failed', 'partial_failed'].includes(data.state)) {
      settleAcemusicSubmission(store, saved);
      ElMessage.error(data.response?.error?.message || t('acemusic.message.failed'));
    } else ElMessage.info(t('acemusic.message.unknown'));
  } catch (error) {
    if (!current(owner)) return;
    if (!saved.taskId && isDefiniteAcemusicRejection(error)) settleAcemusicSubmission(store, saved);
    report(error);
  } finally {
    if (current(owner)) busy.value = false;
  }
}
</script>
