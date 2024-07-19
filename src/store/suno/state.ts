import { RootState } from './models';
import { Status, Song } from '@/models';

const KEYS = {
  volume: 'PLAYER-VOLUME'
};

export default (): RootState => {
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
    player: {
      audio: new Audio(),
      loopType: 0,
      volume: parseInt(localStorage.getItem(KEYS.volume) || '60'),
      playList: [],
      showPlayList: false,
      id: '',
      url: '',
      song: undefined,
      isPlaying: false,
      isPause: false,
      sliderInput: false,
      ended: false,
      muted: false,
      currentTime: 0,
      duration: 0
    }
  };
};
