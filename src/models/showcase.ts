import type { CapabilityKey } from '@/constants/capabilities';

export type ShowcaseMediaType = 'Image' | 'Video' | 'Audio';
export type ShowcaseLayout = 'Portrait' | 'Square' | 'Landscape';
export type ShowcaseProvenance = 'native_generation' | 'imported_master' | 'validation_delivery';

export interface IShowcasePresentation {
  title?: string;
  description?: string;
}

export interface IShowcaseTaskData {
  type?: string;
  presentation?: IShowcasePresentation;
  request?: Record<string, unknown>;
  response?: Record<string, unknown>;
  created_at?: number;
  started_at?: number;
  finished_at?: number;
  elapsed?: number;
  [key: string]: unknown;
}

export interface IShowcase {
  id: string;
  service: string;
  task_id: string | null;
  provenance?: ShowcaseProvenance | null;
  data: IShowcaseTaskData;
}

export interface ResolvedShowcase {
  id: string;
  service: string;
  capability: CapabilityKey;
  routeName: string;
  name: string;
  description: string;
  icon: string;
  defaultIcon: string;
  title: string;
  altText: string;
  mediaType: ShowcaseMediaType;
  posterUrl: string;
  previewUrl: string;
  layout: ShowcaseLayout;
  prompt: string;
  model: string;
  parameters: Array<{ key: string; value: string }>;
  canCreateSimilar: boolean;
}
