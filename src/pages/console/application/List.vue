<template>
  <el-row class="panel">
    <el-col :span="24">
      <el-row v-for="(application, applicationId) in applications" :key="applicationId">
        <el-col :span="24">
          <application-preview-card :application="application" />
        </el-col>
      </el-row>
    </el-col>
  </el-row>
</template>
<script lang="ts">
import { defineComponent } from 'vue';
import { applicationOperator, IApplication, IApplicationListResponse } from '@/operators';
import ApplicationPreviewCard from '@/components/application/PreviewCard.vue';

interface IData {
  applications: IApplication[];
  loading: boolean;
}

export default defineComponent({
  name: 'ApplicationList',
  components: {
    ApplicationPreviewCard
  },
  data(): IData {
    return {
      applications: [],
      loading: false
    };
  },
  computed: {
    redirect() {
      return this.$route.query.redirect;
    }
  },
  watch: {},
  mounted() {
    this.loading = true;
    applicationOperator
      .getAll({
        user_id: this.$store.getters.user.id
      })
      .then(({ data: data }: { data: IApplicationListResponse }) => {
        this.applications = data.items;
        this.loading = false;
      });
  },
  methods: {}
});
</script>

<style lang="scss" scoped>
.panel {
  padding: 30px;
}
</style>
