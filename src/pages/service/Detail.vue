<template>
  <verification-alert />
</template>

<script lang="ts">
import { serviceOperator } from '@/operators';
import { defineComponent } from 'vue';
import { Clock, MagicStick, Collection, VideoPlay, Goods, Lock } from '@element-plus/icons-vue';
import VerificationAlert from '@/components/common/VerificationAlert.vue';
import { v4 as uuidv4 } from 'uuid';
import { ElMessage } from 'element-plus';

interface IData {
  loading: boolean;
  buying: boolean;
  paid: boolean | undefined;
}

export default defineComponent({
  name: 'ServiceDetail',
  components: {
    Clock,
    Collection,
    MagicStick,
    VerificationAlert,
    VideoPlay,
    Goods,
    Lock
  },
  data(): IData {
    return {
      service: undefined,
      order: undefined,
      episodes: [],
      loading: false,
      buying: false,
      paid: undefined
    };
  },
  computed: {
    verified() {
      return this.$store.getters.user.isVerified;
    },
    id() {
      return parseInt(this.$route.params.id.toString());
    }
  },
  async mounted() {
    this.loading = true;
  },
  methods: {}
});
</script>

<style lang="scss" scoped></style>
