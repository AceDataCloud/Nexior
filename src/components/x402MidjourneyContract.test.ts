import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (relativePath: string) => fs.readFileSync(path.resolve(process.cwd(), 'src', relativePath), 'utf8');

describe('Midjourney x402 contract', () => {
  it('registers Midjourney and quotes each selected endpoint with its builder', () => {
    const main = source('layouts/Main.vue');
    const panel = source('components/midjourney/ConfigPanel.vue');
    expect(main).toContain("'midjourney'");
    expect(panel).toContain('quoteImagine(buildMidjourneyImagineRequest(this.config))');
    expect(panel).toContain('quoteVideos(buildMidjourneyVideosRequest(this.config))');
    expect(panel).toContain('quoteDescribe(buildMidjourneyDescribeRequest(this.config))');
  });

  it('submits imagine, videos, describe, and custom actions through authoritative builders', () => {
    const page = source('pages/midjourney/Index.vue');
    expect(page).toContain('buildMidjourneyCustomRequest(this.config, payload)');
    expect(page).toContain('buildMidjourneyImagineRequest(this.config)');
    expect(page).toContain('buildMidjourneyVideosRequest(this.config)');
    expect(page).toContain('buildMidjourneyDescribeRequest(this.config)');
    expect(page).toContain('midjourneyOperator.imagine(request, options)');
    expect(page).toContain('midjourneyOperator.videos(request, options)');
    expect(page).toContain('midjourneyOperator.describe(request, options)');
  });

  it('keeps guest task history in memory and attaches authenticated identity', () => {
    const page = source('pages/midjourney/Index.vue');
    expect(page).toContain('walletTaskIds: string[]');
    expect(page).toContain("mode: 'x402', ids: this.walletTaskIds");
    expect(page).toContain('identityToken: this.credential?.token');
    expect(page).toContain('error instanceof X402PaymentCancelledError');
    expect(page).not.toContain('localStorage');
    expect(page).not.toContain('sessionStorage');
  });
});
