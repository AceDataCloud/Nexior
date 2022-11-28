<template>
  <div>
    <el-form ref="ruleFormRef" status-icon label-width="120px" class="demo-ruleForm">
      <el-form-item label="Password">
        <el-input v-model="form.content" autocomplete="off" />
      </el-form-item>
      <el-form-item>
        <el-button @click="onCreate">Create</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { commentService } from '@/services/comment/service';

export default defineComponent({
  name: 'CreateComment',
  props: {
    episodeId: {
      type: Number,
      required: true
    }
  },
  data() {
    return {
      form: {
        content: ''
      }
    };
  },
  computed: {
    // active() {
    //   return this.$route.matched[0].path;
    // },
    // user() {
    //   return this.$store.getters.user;
    // }
  },
  methods: {
    onCreate() {
      commentService.createForEpisode(this.episodeId, {
        content: this.form.content
      });
    }
  },
  mounted() {}
});
</script>
