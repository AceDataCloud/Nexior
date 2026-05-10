import { IApplication, IConfigResponse, ISite, IToken, IUser, Status } from '@/models';
import { IMidjourneyState } from '../midjourney/models';
import { IChatState } from '../chat/models';
import { IQrartState } from '../qrart/models';
import { ILumaState } from '../luma/models';
import { IPikaState } from '../pika/models';
import { IKlingState } from '../kling/models';
import { IVeoState } from '../veo/models';
import { ISoraState } from '../sora/models';
import { IPixverseState } from '../pixverse/models';
import { IFluxState } from '../flux/models';
import { IHailuoState } from '../hailuo/models';
import { IHeadshotsState } from '../headshots/models';
import { ISunoState } from '../suno/models';
import { IProducerState } from '../producer/models';
import { INanobananaState } from '../nanobanana/models';
import { IOpenAIImageState } from '../openaiimage/models';
import { ISeedreamState } from '../seedream/models';
import { ISeedanceState } from '../seedance/models';
import { ISerpState } from '../serp/models';
import { IWanState } from '../wan/models';
import { IFishState } from '../fish/models';

export interface ISetting {
  // Optional user-selected wallpaper. When set, painted by `body::before`
  // as a fixed full-viewport layer behind every page so the per-layout
  // `var(--app-content-bg)` surfaces become semi-transparent on top.
  // Persisted in localStorage so it sticks per-browser. Empty string /
  // undefined disables the wallpaper.
  backgroundImage?: string;
  // 0..100 — how opaque the content surfaces stay above the wallpaper.
  // 100 = no wallpaper visible (all opaque), 0 = wallpaper fully visible.
  // Default 85 keeps text readable.
  backgroundOpacity?: number;
}

export interface ICommonState {
  token: IToken;
  user?: IUser;
  setting?: ISetting;
  site?: ISite;
  config?: IConfigResponse;
  currency: string;
  fingerprint?: string;
  auth: {
    flow: 'popup' | 'redirect';
    visible: boolean;
  };
  exchange:
    | {
        [key: string]: number;
      }
    | undefined;
  applications: IApplication[] | undefined;
  status: {
    getService: Status | undefined;
    getApplications: Status | undefined;
    getTasks: Status | undefined;
  };
}

export interface IAppState {
  midjourney: IMidjourneyState;
  chat: IChatState;
  qrart: IQrartState;
  luma: ILumaState;
  pika: IPikaState;
  kling: IKlingState;
  veo: IVeoState;
  sora: ISoraState;
  pixverse: IPixverseState;
  flux: IFluxState;
  hailuo: IHailuoState;
  headshots: IHeadshotsState;
  suno: ISunoState;
  producer: IProducerState;
  nanobanana: INanobananaState;
  openaiimage: IOpenAIImageState;
  seedream: ISeedreamState;
  seedance: ISeedanceState;
  serp: ISerpState;
  wan: IWanState;
  fish: IFishState;
}

export interface IRootState extends ICommonState, IAppState {}
