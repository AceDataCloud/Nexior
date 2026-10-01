<template>
  <div>
    <el-upload
      ref="uploader"
      v-model:file-list="fileList"
      :accept="MAESTRO_FILE_ACCEPT"
      name="file"
      class="w-full"
      :limit="MAESTRO_FILE_LIMIT"
      :multiple="true"
      :before-upload="beforeUploadSizeGuard"
      :action="uploadUrl"
      :headers="headers"
      :on-exceed="onExceed"
      :on-error="onError"
      :on-success="onChange"
      :on-remove="onChange"
    >
      <el-button size="small" round>
        <attachment-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
        {{ $t('maestro.button.uploadFiles') }}
      </el-button>
    </el-upload>
    <div v-for="url in value" :key="url" class="flex items-center gap-2 mt-2">
      <span class="text-xs flex-1 truncate">{{ fileName(url) }}</span>
      <el-select
        :model-value="assetRole(url)"
        size="small"
        class="w-36"
        :aria-label="$t('maestro.name.assetRole')"
        @update:model-value="setRole(url, $event)"
      >
        <el-option
          v-for="role in MAESTRO_ASSET_ROLES"
          :key="role"
          :value="role"
          :label="$t(`maestro.option.assetRole.${role}`)"
        />
      </el-select>
    </div>
  </div>
</template>

<script lang="ts">
import { AttachmentIcon } from '@acedatacloud/core/icons/components';
import { defineComponent } from 'vue';
import { ElButton, ElUpload, ElMessage, ElSelect, ElOption, UploadFiles, UploadFile } from 'element-plus';
import { getBaseUrlPlatform, dropUploadMixin, uploadSizeGuardMixin } from '@/utils';
import { MAESTRO_FILE_ACCEPT, MAESTRO_FILE_LIMIT, MAESTRO_ASSET_ROLES } from '@/constants';
import type { IMaestroAssetRole } from '@/models';
import { getMaestroMediaUrls } from '@/utils/maestro';

interface IData {
  fileList: UploadFiles;
  uploadUrl: string;
  MAESTRO_FILE_ACCEPT: string;
  MAESTRO_FILE_LIMIT: number;
  MAESTRO_ASSET_ROLES: typeof MAESTRO_ASSET_ROLES;
}

export default defineComponent({
  name: 'MaestroFileUrlsInput',
  components: {
    AttachmentIcon,
    ElUpload,
    ElButton,
    ElSelect,
    ElOption
  },
  mixins: [dropUploadMixin, uploadSizeGuardMixin],
  data(): IData {
    return {
      fileList: [],
      uploadUrl: getBaseUrlPlatform() + '/api/v1/files/',
      MAESTRO_FILE_ACCEPT,
      MAESTRO_FILE_LIMIT,
      MAESTRO_ASSET_ROLES
    };
  },
  computed: {
    headers() {
      return {
        Authorization: `Bearer ${this.$store.state.token.access}`
      };
    },
    value(): string[] {
      return getMaestroMediaUrls(this.$store.state.maestro?.config);
    }
  },
  watch: {
    value: {
      immediate: true,
      handler(urls: string[]) {
        const existingByUrl = new Map(
          this.fileList.map((file) => [((file?.response as any)?.file_url as string) || file.url, file])
        );
        const synced = urls.map(
          (url) =>
            existingByUrl.get(url) ||
            ({
              name: url.split('/').pop() || url,
              url,
              status: 'success',
              percentage: 100,
              response: { file_url: url }
            } as UploadFile)
        );
        const uploading = this.fileList.filter((file) => !((file?.response as any)?.file_url || file.url));
        this.fileList = [...synced, ...uploading];
      }
    }
  },
  methods: {
    fileName(url: string): string {
      return (
        this.fileList.find((file) => file.url === url || (file.response as any)?.file_url === url)?.name ||
        url.split('/').pop() ||
        url
      );
    },
    assetRole(url: string): IMaestroAssetRole {
      return this.$store.state.maestro?.config?.assets?.find((asset) => asset.url === url)?.role || 'reference';
    },
    setRole(url: string, role: IMaestroAssetRole) {
      const config = this.$store.state.maestro?.config || {};
      const existing = config.assets?.find((asset) => asset.url === url);
      const assets = (config.assets || []).filter((asset) => asset.url !== url);
      const file_urls = (config.file_urls || []).filter((item) => item !== url);
      if (role === 'reference') file_urls.push(url);
      else assets.push({ id: existing?.id || `asset-${crypto.randomUUID()}`, role, url, name: this.fileName(url) });
      this.$store.commit('maestro/setConfig', { ...config, file_urls, assets });
    },
    onExceed() {
      ElMessage.warning(this.$t('maestro.message.uploadExceed'));
    },
    onError() {
      ElMessage.error(this.$t('maestro.message.uploadError'));
    },
    onChange() {
      // Only files that finished uploading have a response.file_url.
      const urls = this.fileList
        .map((file: UploadFile) => ((file?.response as any)?.file_url as string | undefined) || file.url)
        .filter((url: string | undefined): url is string => !!url);
      this.$store.commit('maestro/setConfig', {
        ...this.$store.state.maestro?.config,
        file_urls: urls.filter((url) => !this.$store.state.maestro?.config?.assets?.some((asset) => asset.url === url)),
        ...(this.$store.state.maestro?.config?.assets !== undefined
          ? {
              assets: this.$store.state.maestro.config.assets.filter((asset) => urls.includes(asset.url))
            }
          : {})
      });
    }
  }
});
</script>
