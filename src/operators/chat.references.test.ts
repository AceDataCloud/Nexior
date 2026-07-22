import { afterEach, describe, expect, it, vi } from 'vitest';

import { chatOperator } from './chat';
import type { IChatConversationRequest, IChatModelName } from '@/models';

describe('chat structured references', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('preserves owner-bound upload metadata in the request body', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('data: [DONE]\n\n', {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' }
      })
    );
    vi.stubGlobal('fetch', fetchMock);
    const request: IChatConversationRequest = {
      question: 'Publish this image',
      model: 'gpt-4o' as IChatModelName,
      references: [
        {
          url: 'https://cdn.example/uploads/file',
          name: 'photo.png',
          file_id: '00000000-0000-4000-8000-000000000001',
          sha256: `sha256:${'1'.repeat(64)}`,
          mime: 'image/png',
          size: 42
        }
      ]
    };

    await chatOperator.chatConversation(request, { token: 'token' });

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(JSON.parse(String(init.body)).references).toEqual(request.references);
  });
});
