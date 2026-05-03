/**
 * Kling Inspiration & Presets data — mirrors the official kling.ai prompt
 * dictionary. Each chip's display text and the text appended to the prompt
 * both come from i18n, so Chinese users get Chinese chips that prepend
 * Chinese descriptors (matching how kling.ai itself behaves per locale).
 *
 * Group structure: { groupKey, chipKeys[] }
 * - groupKey resolves to `kling.inspiration.group.<groupKey>`
 * - chipKey  resolves to `kling.inspiration.chip.<chipKey>`
 */
export interface IKlingPresetGroup {
  groupKey: string;
  chipKeys: string[];
}

export const KLING_PRESET_GROUPS: IKlingPresetGroup[] = [
  {
    groupKey: 'cameraMovements',
    chipKeys: [
      'rotateAround',
      'stationary',
      'handheld',
      'zoomOut',
      'zoomIn',
      'follow',
      'panRight',
      'tiltUp',
      'tiltDown',
      'orbit'
    ]
  },
  {
    groupKey: 'cameraSpeed',
    chipKeys: ['speedSlow', 'speedMedium', 'speedFast']
  },
  {
    groupKey: 'shotType',
    chipKeys: [
      'shotClose',
      'shotMedium',
      'shotLong',
      'shotLowAngle',
      'shotHighAngle',
      'shotShallowDof',
      'shotFront',
      'shotProfile',
      'shotCloseUp',
      'shotDrone'
    ]
  },
  {
    groupKey: 'light',
    chipKeys: ['lightSunlight', 'lightSoft', 'lightNeon', 'lightWarm', 'lightNature', 'lightCandle', 'lightCityNight']
  },
  {
    groupKey: 'frame',
    chipKeys: ['frameRichDetails', 'frameSimpleBg']
  },
  {
    groupKey: 'atmosphere',
    chipKeys: [
      'atmosphereMysterious',
      'atmospherePeaceful',
      'atmosphereHeartwarming',
      'atmosphereVivid',
      'atmosphereColorful'
    ]
  }
];
