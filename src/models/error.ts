import {
  ERROR_CODE_API_ERROR,
  ERROR_CODE_BAD_REQUEST,
  ERROR_CODE_BUSY,
  ERROR_CODE_FORBIDDEN,
  ERROR_CODE_TIMEOUT,
  ERROR_CODE_TOO_MANY_REQUESTS,
  ERROR_STATUS_API_ERROR,
  ERROR_STATUS_BAD_REQUEST,
  ERROR_STATUS_BUSY,
  ERROR_STATUS_FORBIDDEN,
  ERROR_STATUS_TIMEOUT,
  ERROR_STATUS_TOO_MANY_REQUESTS
} from '@/constants';

export class BaseError extends Error {
  public status: number;
  public code: string;
  public detail: string;
  public extraData?: Record<string, any>;

  constructor(status: number, code: string, detail: string, extraData?: Record<string, any>) {
    super();
    this.status = status;
    this.code = code;
    this.detail = detail;
    this.extraData = extraData;
  }

  get message(): string {
    return `${this.code} - ${this.detail}`;
  }
}

export class BadRequestError extends BaseError {
  constructor(detail: string, extraData?: Record<string, any>) {
    super(ERROR_STATUS_BAD_REQUEST, ERROR_CODE_BAD_REQUEST, detail, extraData);
  }
}

export class ApiError extends BaseError {
  constructor(detail: string, extraData?: Record<string, any>) {
    super(ERROR_STATUS_API_ERROR, ERROR_CODE_API_ERROR, detail, extraData);
  }
}

export class BusyError extends BaseError {
  constructor(detail: string, extraData?: Record<string, any>) {
    super(ERROR_STATUS_BUSY, ERROR_CODE_BUSY, detail, extraData);
  }
}

export class ForbiddenError extends BaseError {
  constructor(detail: string, extraData?: Record<string, any>) {
    super(ERROR_STATUS_FORBIDDEN, ERROR_CODE_FORBIDDEN, detail, extraData);
  }
}

export class TimeoutError extends BaseError {
  constructor(detail: string, extraData?: Record<string, any>) {
    super(ERROR_STATUS_TIMEOUT, ERROR_CODE_TIMEOUT, detail, extraData);
  }
}

export class TooManyRequestsError extends BaseError {
  constructor(detail: string, extraData?: Record<string, any>) {
    super(ERROR_STATUS_TOO_MANY_REQUESTS, ERROR_CODE_TOO_MANY_REQUESTS, detail, extraData);
  }
}
