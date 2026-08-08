import {
  IQrartConfig,
  IQrartGenerateRequest,
  IQrartGenerateResponse,
  IQrartTaskResponse,
  IQrartTasksResponse
} from '@/models';
import { BaseTaskOperator, ITaskListFilter } from './baseTaskOperator';

export function buildQrartRequest(config?: IQrartConfig): IQrartGenerateRequest {
  const source = config || ({} as IQrartConfig);
  return {
    type: source.type,
    content: source.content,
    content_image_url: source.content_image_url,
    prompt: source.prompt,
    aspect_ratio: source.aspect_ratio,
    async: true,
    qrw: source.qrw,
    steps: source.steps,
    preset: source.preset,
    ...(source.advanced
      ? {
          position: source.position,
          pixel_style: source.pixel_style,
          marker_shape: source.marker_shape,
          sub_marker: source.sub_marker,
          rotate: source.rotate,
          ecl: source.ecl,
          seed: source.seed,
          padding_level: source.padding_level,
          padding_noise: source.padding_noise
        }
      : {})
  };
}

class QrartOperator extends BaseTaskOperator<
  IQrartGenerateRequest,
  IQrartGenerateResponse,
  IQrartTaskResponse,
  IQrartTasksResponse,
  ITaskListFilter
> {
  constructor() {
    super({ tasksPath: '/qrart/tasks', generatePath: '/qrart/generate' });
  }
}

export const qrartOperator = new QrartOperator();
