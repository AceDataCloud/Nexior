import { ActionContext } from 'vuex';
import { fishOperator } from '@/operators';
import { IFishTtsConfig, IFishTask, IFishVoiceModel } from '@/models';
import { FISH_SERVICE_ID } from '@/constants';
import { createTaskActions } from '@/store/factories/createTaskActions';
import { IFishTaskFilter } from '@/operators/fish';
import { IRootState } from '@/store/common/models';
import { IFishState } from './models';

const baseActions = createTaskActions<IFishTtsConfig, IFishTask, IFishTaskFilter>({
  serviceId: FISH_SERVICE_ID,
  operator: fishOperator,
  // Default page (`/fish/tts`) lists fish_tts jobs. The /fish/model page
  // overrides via dispatching with a custom filter or — once added in
  // PR #2 — its own dedicated filter shape.
  type: 'fish_tts'
});

/**
 * Refresh the current user's voice-clone model list (GET /fish/model?self=true).
 * Stored on `state.voices` so the TTS page's voice picker can read it
 * without re-fetching on every keystroke.
 */
const getVoices = async ({
  commit,
  state
}: ActionContext<IFishState, IRootState>): Promise<IFishVoiceModel[] | undefined> => {
  const token = state.credential?.token;
  if (!token) return undefined;
  try {
    const { data } = await fishOperator.listModels({ self: true, page_size: 50, page_number: 1 }, { token });
    commit('setVoices', data?.items ?? []);
    return data?.items ?? [];
  } catch (error) {
    console.error('fish.getVoices failed', error);
    return undefined;
  }
};

export default {
  ...baseActions,
  getVoices
};
