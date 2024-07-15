<template>
  <div class="flex-1 flex flex-col">
    <!-- 歌曲列表 -->
    <div class="flex-1 overflow-hidden">
      <ElScrollbar>
        <div class="container mx-auto">
          歌曲列表
          <MusicList />
        </div>
      </ElScrollbar>
    </div>
    <div class="h-20">
      <Footer />
    </div>
  </div>
  <PlayList />
</template>

<script>
import { defineComponent } from 'vue';
import { ElScrollbar } from 'element-plus';
// import PlayList from '@/components/suno/playList/PlayList.vue';
// import MusicList from '@/components/suno/musicList/MusicList.vue';
import Footer from '@/components/suno/footer/Footer.vue';
import '@/assets/base.scss';

export default defineComponent({
  name: 'PresetPanel',
  components: {
    ElScrollbar,
    Footer
    // MusicList,
    // PlayList,
  }
  // emits: ['generate'],
  // computed: {
  //   config() {
  //     return this.$store.state.suno?.config;
  //   }
  // }
});
</script>
