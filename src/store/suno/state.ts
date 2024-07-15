import { ISunoState } from './models';
import { Status, Song, SongUrl } from '@/models';

const KEYS = {
  volume: 'PLAYER-VOLUME'
};
export default (): ISunoState => {
  return {
    service: undefined,
    application: undefined,
    tasks: undefined,
    credential: undefined,
    config: undefined,
    status: {
      getService: Status.None,
      getApplication: Status.None,
      getTasks: Status.None
    },
    music: {
      audio: new Audio(),
      loopType: 0, //循环模式 0 单曲循环 1 列表循环 2随机播放
      volume: Number(localStorage.getItem(KEYS.volume)) || 60, //音量
      playList: [] as Song[], //播放列表,
      showPlayList: false,
      id: 0,
      url: '',
      songUrl: {} as SongUrl,
      song: {} as Song,
      isPlaying: false, //是否播放中
      isPause: false, //是否暂停
      sliderInput: false, //是否正在拖动进度条
      ended: false, //是否播放结束
      muted: false, //是否静音
      currentTime: 0, //当前播放时间
      duration: 0 //总播放时长
    }
  };
};
