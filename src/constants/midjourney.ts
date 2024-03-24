import i18n from '@/i18n';
import { IMidjourneyMode } from '@/models';

export const MIDJOURNEY_MODE_NAME_FAST = 'fast';
export const MIDJOURNEY_MODE_NAME_RELAX = 'relax';
export const MIDJOURNEY_MODE_NAME_TURBO = 'turbo';

export const MIDJOURNEY_SERVICE_ID = 'd87e5e99-b797-4ade-9e73-b896896b0461';

export const MIDJOURNEY_MODE_FAST: IMidjourneyMode = {
  icon: 'fa-solid fa-wind',
  name: MIDJOURNEY_MODE_NAME_FAST,
  getDisplayName: () => i18n.global.t('midjourney.button.fast')
};

export const MIDJOURNEY_MODE_RELAX: IMidjourneyMode = {
  icon: 'fa-solid fa-mug-saucer',
  name: MIDJOURNEY_MODE_NAME_RELAX,
  getDisplayName: () => i18n.global.t('midjourney.button.relax')
};

export const MIDJOURNEY_MODE_TURBO: IMidjourneyMode = {
  icon: 'fa-solid fa-bolt',
  name: MIDJOURNEY_MODE_NAME_TURBO,
  getDisplayName: () => i18n.global.t('midjourney.button.turbo')
};
