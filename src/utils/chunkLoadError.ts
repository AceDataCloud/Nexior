// Stale-chunk recovery now lives in @acedatacloud/core; this thin shim keeps
// the existing import sites (main.ts, router/index.ts) and the nexior-specific
// sessionStorage prefix / reload query param unchanged.
import { createChunkLoadErrorHandler } from '@acedatacloud/core';

const handler = createChunkLoadErrorHandler({
  storagePrefix: 'nexior:chunk-load-reload',
  reloadQueryParam: '__nexior_reload'
});

export const isChunkLoadError = handler.isChunkLoadError;
export const handleChunkLoadError = handler.handleChunkLoadError;
export const initializeChunkLoadErrorHandler = handler.install;
