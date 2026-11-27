export interface TripoAsset {
  url: string;
  format: string;
  poster?: string;
}

function assetUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return;
  try {
    const url = new URL(value);
    if (
      url.protocol === 'https:' &&
      url.hostname === 'cdn.acedata2.cloud' &&
      !url.port &&
      !url.username &&
      !url.password &&
      url.pathname.startsWith('/tripo/')
    ) {
      return url.href;
    }
  } catch {
    // Invalid or relative URLs are not delivered model artifacts.
  }
}

function json(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

// Accept the REST task envelope and JSON text returned by HTTP and MCP tools.
export function tripoAssets(output: string | undefined): TripoAsset[] {
  if (!output?.includes('model_url') || !output.includes('cdn.acedata2.cloud/tripo/')) return [];
  const found = new Map<string, TripoAsset>();
  function visit(value: unknown, depth: number) {
    if (depth > 8) return;
    const item = json(value);
    if (Array.isArray(item)) {
      for (const entry of item) visit(entry, depth + 1);
      return;
    }
    if (!item || typeof item !== 'object') return;
    const row = item as Record<string, unknown>;
    if (row.success === false || row.isError === true) return;
    const url = assetUrl(row.model_url);
    if (url && typeof row.format === 'string') {
      found.set(url, { url, format: row.format, poster: assetUrl(row.image_url) });
    }
    for (const key of ['response', 'data', 'items', 'body', 'content', 'text', 'result', 'structuredContent']) {
      if (row[key] !== undefined) visit(row[key], depth + 1);
    }
  }
  visit(output, 0);
  return [...found.values()];
}
