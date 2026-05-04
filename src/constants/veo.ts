export const VEO_SERVICE_ID = '73cd74ba-a1bd-4a12-8df6-11d64c38df14';

export const VEO_LOGO = 'https://cdn.acedata.cloud/8nxyy9.jpg';

export const VEO_DEFAULT_MODEL = 'veo31-fast';
export const VEO_DEFAULT_ACTION = 'text2video';
export const VEO_DEFAULT_ASPECT_RATIO = '16:9';
export const VEO_DEFAULT_TRANSLATION = false;
export const VEO_DEFAULT_EXTEND_IMG = false;

// /veo/upsample
export const VEO_UPSAMPLE_ACTIONS = ['1080p', '4k', 'gif'] as const;
export const VEO_DEFAULT_UPSAMPLE_ACTION = '1080p';

// /veo/extend (only veo31 series supported by upstream)
export const VEO_EXTEND_MODELS = ['veo31-fast', 'veo31'] as const;
export const VEO_DEFAULT_EXTEND_MODEL = 'veo31-fast';

// /veo/objects
export const VEO_OBJECT_ACTIONS = ['insert', 'remove'] as const;
export const VEO_DEFAULT_OBJECT_ACTION = 'insert';

// /veo/reshoot — short uppercase aliases mapped server-side to upstream
// RESHOOT_MOTION_TYPE_* values. Order chosen to surface common picks first.
export const VEO_MOTION_TYPES = [
  'STATIONARY',
  'LEFT_TO_RIGHT',
  'RIGHT_TO_LEFT',
  'FORWARD',
  'BACKWARD',
  'UP',
  'DOWN',
  'STATIONARY_UP',
  'STATIONARY_DOWN',
  'STATIONARY_LEFT',
  'STATIONARY_RIGHT',
  'DOLLY_IN_ZOOM_OUT',
  'DOLLY_OUT_ZOOM_IN',
  'STATIONARY_DOLLY_IN_ZOOM_OUT',
  'STATIONARY_DOLLY_OUT_ZOOM_IN'
] as const;
export const VEO_DEFAULT_MOTION_TYPE = 'LEFT_TO_RIGHT';
