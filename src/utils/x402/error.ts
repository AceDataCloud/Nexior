export function continuousPaymentErrorMessage(error: any, fallback: string): string {
  const detail = error?.response?.data?.detail;
  const message = Array.isArray(detail) ? detail.find((value) => typeof value === 'string') : detail;
  const resolved =
    (typeof message === 'string' && message) ||
    (typeof error?.response?.data?.error?.message === 'string' && error.response.data.error.message) ||
    (typeof error?.message === 'string' && error.message) ||
    fallback;
  const traceId = error?.response?.data?.trace_id;
  return typeof traceId === 'string' && traceId ? `${resolved} (${traceId})` : resolved;
}
