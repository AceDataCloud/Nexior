<template>
  <layout>
    <template #chatdoc>
      <div class="wrapper">
        <div class="title">
          {{ $t('chatdoc.title.manage') }}
        </div>
        <div class="introduction">
          {{ $t('chatdoc.message.introductionForKnowledge') }}
        </div>
        <div class="status">
          <application-status
            :show-price="false"
            :initializing="initializing"
            :application="application"
            :need-apply="needApply"
            :service="service"
            @refresh="$store.dispatch('chatdoc/getApplications')"
          />
        </div>
        <div class="operations">
          <upload-document />
        </div>
        <div class="documents">
          <el-table v-loading="loading" :data="documents" border>
            <el-table-column prop="id" label="ID" />
            <el-table-column prop="file_name" :label="$t('chatdoc.field.fileName')" />
            <el-table-column :label="$t('chatdoc.field.fileExtension')" width="100px">
              <template #default="scope">
                {{ scope.row.file_name.split('.').pop() }}
              </template>
            </el-table-column>
            <el-table-column :label="$t('chatdoc.field.createdAt')" width="200px">
              <template #default="scope">
                {{ scope.row.created_at ? $dayjs.format(scope.row.created_at) : '' }}
              </template>
            </el-table-column>
            <el-table-column :label="$t('chatdoc.field.state')" width="180px">
              <template #default="scope">
                <el-tag v-if="scope.row.state === 'processing'" type="info">
                  {{ $t('chatdoc.field.stateProcessing') }}
                </el-tag>
                <el-tag v-if="scope.row.state === 'failed'" type="danger">
                  {{ $t('chatdoc.field.stateFailed') }}
                </el-tag>
                <el-tag v-if="scope.row.state === 'completed'" type="success">
                  {{ $t('chatdoc.field.stateCompleted') }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column>
              <template #default="scope">
                <el-button type="primary" round size="small" @click="onPreview(scope.row.file_url)">
                  {{ $t('common.button.preview') }}
                </el-button>
                <el-button type="danger" round size="small" @click="onDelete(scope.row.id)">
                  {{ $t('common.button.delete') }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </template>
  </layout>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Layout from '@/layouts/Chatdoc.vue';
import { IChatdocRepository } from '@/models';
import { ElButton, ElTag, ElTable, ElTableColumn, ElMessage } from 'element-plus';
import UploadDocument from '@/components/chatdoc/UploadDocument.vue';
import { Status } from '@/models';
import ApplicationStatus from '@/components/application/Status.vue';

export default defineComponent({
  name: 'ChatdocKnowledge',
  components: {
    Layout,
    ElButton,
    ElTable,
    ElTag,
    ApplicationStatus,
    ElTableColumn,
    UploadDocument
  },
  data() {
    return {
      loading: false,
      repositoryId: this.$route.params.repositoryId.toString()
    };
  },
  computed: {
    repository(): IChatdocRepository | undefined {
      return this.$store.state?.chatdoc?.repositories?.find((repository) => repository.id === this.repositoryId);
    },
    documents() {
      return this.repository?.documents;
    },
    needApply() {
      return this.$store.state.chatdoc.status.getApplications === Status.Success && !this.application;
    },
    service() {
      return this.$store.state.chatdoc.service;
    },
    application() {
      return this.$store.state.chatdoc.application;
    },
    initializing() {
      return this.$store.state.chatdoc.status.getApplications === Status.Request;
    }
  },
  async mounted() {
    console.log('start get documents');
    this.loading = true;
    this.$store
      .dispatch('chatdoc/getDocuments', { repositoryId: this.repositoryId })
      .then(() => {
        this.loading = false;
      })
      .catch(() => {
        this.loading = false;
      });
  },
  methods: {
    onDelete(id: string) {
      this.$store.dispatch('chatdoc/deleteDocument', { id }).then(() => {
        ElMessage.success(this.$t('chatdoc.message.deleteDocumentSuccess'));
        this.$store.dispatch('chatdoc/getDocuments', {
          repositoryId: this.repositoryId
        });
      });
    },
    onPreview(url: string) {
      window.open(url, '_blank');
    }
  }
});
</script>

<style lang="scss" scoped>
.wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 30px;
}

.el-button {
  border-radius: 20px;
}

.title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 20px;
}

.introduction {
  margin-bottom: 20px;
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.operations {
  margin-bottom: 20px;
}
.documents {
  width: 100%;
}

.status {
  margin-bottom: 10px;
  width: fit-content;
}
</style>
